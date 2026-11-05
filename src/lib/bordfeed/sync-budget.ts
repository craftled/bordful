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

// Later syncs do two things:
// - additions: read open jobs that first became visible after `since`, from
//   the feed. Bordfeed bumps `updated_at` on routine scrape writes, so they
//   are read by `first_visible`, not `updated`. This is the billed part.
// - checks: look up a slice of the board's own published Bordfeed jobs by id
//   and unpublish the ones Bordfeed no longer shows. Bordfeed answers 404
//   before any charge for a job that is not active, and a job the workspace
//   already received is free, so checks cost no credits. They also catch
//   jobs that leave as filled or archived, which no feed status reports.
export interface SeriesPosition {
  cursor: string | null;
  offset: number | null;
}

export interface TrackState {
  // Set while a series is unfinished: where the next sync resumes.
  position: SeriesPosition | null;
  // Start of the unfinished series. `since` moves here once it ends.
  seriesStart: string | null;
  since: string | null;
}

// A check slice that looked like a Bordfeed incident: most of it came back
// gone. Removals stay held until two later syncs of this same slice, each
// at least 12 hours after the previous `at`, have confirmed it.
export interface RemovalHold {
  after: string | null;
  at: string;
  // Spaced reconfirmations after the hold was opened. Missing on older rows.
  confirmations: number;
  // Bordfeed job ids that looked gone when the hold was opened or last
  // confirmed. Only these ids may be unpublished after allow+confirmations.
  ids: string[];
}

export interface SyncState {
  additions: TrackState;
  // Last board job checked, by Bordfeed id. The next sync goes on after it
  // and wraps to the start, so every published job is checked in turn.
  checkAfter: string | null;
  day: string | null;
  feedId: string | null;
  jobsToday: number;
  removalHold: RemovalHold | null;
}

export interface TrackPlan {
  position: SeriesPosition;
  seriesStart: string;
  since: string;
}

// Board jobs one sync looks up. Free, but each is one request, and the
// client paces requests 500 ms apart (Bordfeed's free tier allows 2 a
// second), so 200 checks take about 100 s. Checks also stop after 120 s.
export const JOB_CHECKS_PER_SYNC = 200;

export type FetchPlan =
  | { kind: "skip"; reason: "daily_cap" }
  | { kind: "first"; limit: number }
  | {
      additions: TrackPlan;
      checkAfter: string | null;
      checks: number;
      kind: "delta";
      limit: number;
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

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function positionOf(value: unknown): SeriesPosition | null {
  const row = record(value);
  const cursor = text(row.cursor);
  const offset =
    typeof row.offset === "number" && row.offset > 0
      ? Math.floor(row.offset)
      : null;
  return cursor || offset ? { cursor, offset } : null;
}

const EMPTY_TRACK: TrackState = {
  position: null,
  seriesStart: null,
  since: null,
};

function trackOf(value: unknown): TrackState {
  const row = record(value);
  const since = text(row.since);
  const seriesStart = since ? text(row.seriesStart) : null;
  return {
    position: seriesStart ? positionOf(row.position) : null,
    seriesStart,
    since,
  };
}

function confirmationsOf(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

function idsOf(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );
}

function holdOf(value: unknown): RemovalHold | null {
  const row = record(value);
  const at = text(row.at);
  // Rows written before `confirmations` or `ids` existed start at zero / [].
  return at
    ? {
        after: text(row.after),
        at,
        confirmations: confirmationsOf(row.confirmations),
        ids: idsOf(row.ids),
      }
    : null;
}

// A different feed starts over with a capped first sync. Usage for the day
// carries across feeds, since the same Bordfeed workspace pays.
export function parseSyncState(
  value: unknown,
  feedId: string | null
): SyncState {
  const row = record(value);
  const jobsToday =
    typeof row.jobsToday === "number" && row.jobsToday > 0
      ? Math.floor(row.jobsToday)
      : 0;
  const sameFeed = text(row.feedId) === feedId;
  return {
    additions: sameFeed ? trackOf(row.additions) : EMPTY_TRACK,
    checkAfter: sameFeed ? text(row.checkAfter) : null,
    day: text(row.day),
    feedId,
    jobsToday,
    removalHold: sameFeed ? holdOf(row.removalHold) : null,
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

  if (!state.additions.since) {
    return { kind: "first", limit };
  }

  return {
    additions: {
      position: state.additions.position ?? { cursor: null, offset: null },
      seriesStart: state.additions.seriesStart ?? watermark(now),
      since: state.additions.since,
    },
    checkAfter: state.checkAfter,
    checks: JOB_CHECKS_PER_SYNC,
    kind: "delta",
    limit,
  };
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

// After a first sync, additions ask only for jobs new since it began.
export function afterFirst(state: SyncState, startedAt: Date): SyncState {
  return {
    ...state,
    additions: {
      position: null,
      seriesStart: null,
      since: watermark(startedAt),
    },
    checkAfter: null,
  };
}

// `next` is where additions resume, or null once the series is read. Only
// then does `since` move, so no new job in between is skipped.
export function afterAdditions(
  state: TrackState,
  plan: TrackPlan,
  next: SeriesPosition | null
): TrackState {
  if (next) {
    return { ...state, position: next, seriesStart: plan.seriesStart };
  }

  return { position: null, seriesStart: null, since: plan.seriesStart };
}

const SLUG = "bordfeed-connection";

interface DrizzleExecutor {
  execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }>;
}

function database(payload: Payload): DrizzleExecutor {
  return (payload.db as unknown as { drizzle: DrizzleExecutor }).drizzle;
}

// Sync state and the lease live in their own one-row table that only this
// module writes. Payload rewrites every column of the global on each save,
// so state kept there could be wound back by an admin save mid-sync.
export async function readSyncBudget(
  payload: Payload,
  feedId: string | null
): Promise<{ limits: SyncLimits; state: SyncState }> {
  const [doc, result] = await Promise.all([
    payload.findGlobal({ depth: 0, overrideAccess: true, slug: SLUG }),
    database(payload).execute(
      sql`select "state" from "bordfeed_sync_state" where "id" = 1`
    ),
  ]);
  const settings = doc as unknown as Record<string, unknown>;
  const row = result.rows[0] as { state?: unknown } | undefined;
  return {
    limits: resolveLimits({
      jobsPerDay: settings.jobsPerDay,
      jobsPerSync: settings.jobsPerSync,
    }),
    state: parseSyncState(row?.state ?? null, feedId),
  };
}

export class SyncLeaseLostError extends Error {
  constructor() {
    super("Another Bordfeed sync took over this one.");
    this.name = "SyncLeaseLostError";
  }
}

// Max sync time (route maxDuration is 300 s) plus a margin.
export const SYNC_LEASE_MS = 6 * 60 * 1000;

// One feed sync at a time, so two runs never spend the same budget. The
// upsert is atomic: only one caller takes a free or expired lease. Returns
// the lease token, or null when another sync holds it.
export async function acquireSyncLease(
  payload: Payload,
  now: Date
): Promise<string | null> {
  const token = crypto.randomUUID();
  const until = new Date(now.getTime() + SYNC_LEASE_MS).toISOString();
  const result = await database(payload).execute(sql`
    insert into "bordfeed_sync_state" ("id", "state", "lease_token", "lease_until")
    values (1, '{}'::jsonb, ${token}, ${until}::timestamptz)
    on conflict ("id") do update
      set "lease_token" = excluded."lease_token",
        "lease_until" = excluded."lease_until"
      where "bordfeed_sync_state"."lease_until" is null
        or "bordfeed_sync_state"."lease_until" < ${now.toISOString()}::timestamptz
    returning "id"
  `);
  return result.rows.length > 0 ? token : null;
}

// Writes only while this sync still holds the lease, so a sync that ran
// past its lease can never wind back a newer sync's usage.
export async function writeSyncState(
  payload: Payload,
  token: string,
  state: SyncState
): Promise<void> {
  const result = await database(payload).execute(sql`
    update "bordfeed_sync_state"
    set "state" = ${JSON.stringify(state)}::jsonb
    where "id" = 1 and "lease_token" = ${token}
    returning "id"
  `);
  if (result.rows.length === 0) {
    throw new SyncLeaseLostError();
  }
}

export async function releaseSyncLease(
  payload: Payload,
  token: string
): Promise<void> {
  await database(payload).execute(sql`
    update "bordfeed_sync_state"
    set "lease_token" = null, "lease_until" = null
    where "id" = 1 and "lease_token" = ${token}
  `);
}
