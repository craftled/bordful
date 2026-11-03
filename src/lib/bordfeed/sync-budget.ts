import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import { bordfulConfig, JOBS_PER_DAY, JOBS_PER_SYNC } from "@/config";

// Bordfeed bills one credit for each job a workspace receives for the first
// time. Every feed sync fetches at most jobsPerSync jobs, never more than is
// left of jobsPerDay, so no schedule can drain a workspace.

export interface SyncLimits {
  jobsPerDay: number;
  jobsPerSync: number;
}

// A delta series reads open jobs, then closed, then expired, all updated
// after `since`. It can span several syncs.
export type SeriesPhase = "closed" | "expired" | "open";

const PHASES: readonly SeriesPhase[] = ["open", "closed", "expired"];

export interface SeriesPosition {
  cursor: string | null;
  offset: number | null;
  phase: SeriesPhase;
}

export interface SyncState {
  day: string | null;
  feedId: string | null;
  jobsToday: number;
  // Set while a series is unfinished: where the next sync resumes.
  position: SeriesPosition | null;
  // Start of the unfinished series. `since` moves here once it ends.
  seriesStart: string | null;
  // Jobs updated after this instant are fetched by delta syncs.
  since: string | null;
}

export type FetchPlan =
  | { kind: "skip"; reason: "daily_cap" }
  | { kind: "first"; limit: number }
  | {
      kind: "delta";
      limit: number;
      position: SeriesPosition;
      seriesStart: string;
      since: string;
    };

// Overlap between watermarks so clock skew never drops an update.
export const WATERMARK_OVERLAP_MS = 10 * 60 * 1000;

function clampInt(
  value: unknown,
  bounds: { max: number; min: number },
  fallback: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(bounds.max, Math.max(bounds.min, Math.floor(value)));
}

// Empty admin fields fall back to bordful.config.ts.
export function resolveLimits(stored: {
  jobsPerDay?: unknown;
  jobsPerSync?: unknown;
}): SyncLimits {
  const config = bordfulConfig.bordfeed.sync;
  return {
    jobsPerDay: clampInt(stored.jobsPerDay, JOBS_PER_DAY, config.jobsPerDay),
    jobsPerSync: clampInt(
      stored.jobsPerSync,
      JOBS_PER_SYNC,
      config.jobsPerSync
    ),
  };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function positionOf(value: unknown): SeriesPosition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const phase = PHASES.find((item) => item === row.phase);
  if (!phase) {
    return null;
  }

  const offset =
    typeof row.offset === "number" && row.offset > 0
      ? Math.floor(row.offset)
      : null;
  return { cursor: text(row.cursor), offset, phase };
}

// A different feed starts over with a capped first sync. Usage for the day
// carries across feeds, since the same Bordfeed workspace pays.
export function parseSyncState(
  value: unknown,
  feedId: string | null
): SyncState {
  const row =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const jobsToday =
    typeof row.jobsToday === "number" && row.jobsToday > 0
      ? Math.floor(row.jobsToday)
      : 0;
  const usage = { day: text(row.day), jobsToday };
  if (text(row.feedId) !== feedId) {
    return {
      ...usage,
      feedId,
      position: null,
      seriesStart: null,
      since: null,
    };
  }

  const since = text(row.since);
  const seriesStart = since ? text(row.seriesStart) : null;
  return {
    ...usage,
    feedId,
    position: seriesStart ? positionOf(row.position) : null,
    seriesStart,
    since,
  };
}

export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function usedToday(state: SyncState, now: Date): number {
  return state.day === utcDay(now) ? state.jobsToday : 0;
}

export function remainingToday(
  state: SyncState,
  limits: SyncLimits,
  now: Date
): number {
  return Math.max(0, limits.jobsPerDay - usedToday(state, now));
}

export function watermark(startedAt: Date): string {
  return new Date(startedAt.getTime() - WATERMARK_OVERLAP_MS).toISOString();
}

export function planFetch(
  state: SyncState,
  limits: SyncLimits,
  now: Date
): FetchPlan {
  const limit = Math.min(
    limits.jobsPerSync,
    remainingToday(state, limits, now)
  );
  if (limit <= 0) {
    return { kind: "skip", reason: "daily_cap" };
  }

  if (!state.since) {
    return { kind: "first", limit };
  }

  return {
    kind: "delta",
    limit,
    position: state.position ?? { cursor: null, offset: null, phase: "open" },
    seriesStart: state.seriesStart ?? watermark(now),
    since: state.since,
  };
}

export function nextPhase(phase: SeriesPhase): SeriesPhase | null {
  return PHASES[PHASES.indexOf(phase) + 1] ?? null;
}

export function recordSpend(
  state: SyncState,
  jobs: number,
  now: Date
): SyncState {
  return {
    ...state,
    day: utcDay(now),
    jobsToday: usedToday(state, now) + Math.max(0, jobs),
  };
}

// After a first sync the next run asks only for jobs updated since it began.
export function afterFirst(state: SyncState, startedAt: Date): SyncState {
  return {
    ...state,
    position: null,
    seriesStart: null,
    since: watermark(startedAt),
  };
}

// `next` is where the series resumes, or null once every phase is read. Only
// then does `since` move, so no update, closure or expiry is skipped.
export function afterDelta(
  state: SyncState,
  plan: Extract<FetchPlan, { kind: "delta" }>,
  next: SeriesPosition | null
): SyncState {
  if (next) {
    return { ...state, position: next, seriesStart: plan.seriesStart };
  }

  return {
    ...state,
    position: null,
    seriesStart: null,
    since: plan.seriesStart,
  };
}

const SLUG = "bordfeed-connection";

export async function readSyncBudget(
  payload: Payload,
  feedId: string | null
): Promise<{ limits: SyncLimits; state: SyncState }> {
  const doc = (await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: SLUG,
  })) as unknown as Record<string, unknown>;
  return {
    limits: resolveLimits({
      jobsPerDay: doc.jobsPerDay,
      jobsPerSync: doc.jobsPerSync,
    }),
    state: parseSyncState(doc.syncState, feedId),
  };
}

interface DrizzleExecutor {
  execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }>;
}

function database(payload: Payload): DrizzleExecutor {
  return (payload.db as unknown as { drizzle: DrizzleExecutor }).drizzle;
}

// Writes the state but keeps the lease the running sync holds.
export async function writeSyncState(
  payload: Payload,
  state: SyncState
): Promise<void> {
  const value = JSON.stringify(state);
  await database(payload).execute(sql`
    update "bordfeed_connection"
    set "sync_state" = ${value}::jsonb
      || jsonb_build_object('leaseUntil', "sync_state"->'leaseUntil')
  `);
}

// Max sync time (route maxDuration is 300 s) plus a margin.
export const SYNC_LEASE_MS = 6 * 60 * 1000;

// One feed sync at a time, so two runs never spend the same budget. The
// update is atomic: only one caller sees an expired lease and takes it.
export async function acquireSyncLease(
  payload: Payload,
  now: Date
): Promise<boolean> {
  const until = new Date(now.getTime() + SYNC_LEASE_MS).toISOString();
  const result = await database(payload).execute(sql`
    update "bordfeed_connection"
    set "sync_state" = coalesce("sync_state", '{}'::jsonb)
      || jsonb_build_object('leaseUntil', ${until}::text)
    where coalesce("sync_state"->>'leaseUntil', '') < ${now.toISOString()}
    returning "id"
  `);
  return result.rows.length > 0;
}

export async function releaseSyncLease(payload: Payload): Promise<void> {
  await database(payload).execute(sql`
    update "bordfeed_connection"
    set "sync_state" = "sync_state" - 'leaseUntil'
    where "sync_state" is not null
  `);
}
