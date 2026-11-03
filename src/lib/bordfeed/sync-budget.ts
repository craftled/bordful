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

// Later syncs run two tracks, each with its own watermark and resume point:
// - removals: jobs closed, then expired, updated after its `since`;
// - additions: open jobs that first became visible after its `since`.
// Bordfeed bumps `updated_at` on routine scrape writes, so additions are
// read by `first_visible`, not `updated`. Each track gets its own share of a
// sync's budget, so removals can never starve new jobs or the other way.
export type Track = "additions" | "removals";
export type SeriesPhase = "closed" | "expired" | "open";

const TRACK_PHASES: Record<Track, readonly SeriesPhase[]> = {
  additions: ["open"],
  removals: ["closed", "expired"],
};

export function sinceFieldFor(phase: SeriesPhase): "first_visible" | "updated" {
  return phase === "open" ? "first_visible" : "updated";
}

export function nextPhase(
  track: Track,
  phase: SeriesPhase
): SeriesPhase | null {
  const phases = TRACK_PHASES[track];
  return phases[phases.indexOf(phase) + 1] ?? null;
}

export interface SeriesPosition {
  cursor: string | null;
  offset: number | null;
  phase: SeriesPhase;
}

export interface TrackState {
  // Set while a series is unfinished: where the next sync resumes.
  position: SeriesPosition | null;
  // Start of the unfinished series. `since` moves here once it ends.
  seriesStart: string | null;
  since: string | null;
}

export interface SyncState {
  additions: TrackState;
  day: string | null;
  feedId: string | null;
  jobsToday: number;
  removals: TrackState;
}

export interface TrackPlan {
  position: SeriesPosition;
  seriesStart: string;
  since: string;
}

export type FetchPlan =
  | { kind: "skip"; reason: "daily_cap" }
  | { kind: "first"; limit: number }
  | {
      additions: TrackPlan;
      kind: "delta";
      limit: number;
      removals: TrackPlan;
      // Budget the removals track may use. Additions get the rest.
      removalsLimit: number;
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

function positionOf(value: unknown, track: Track): SeriesPosition | null {
  const row = record(value);
  const phase = TRACK_PHASES[track].find((item) => item === row.phase);
  if (!phase) {
    return null;
  }

  const offset =
    typeof row.offset === "number" && row.offset > 0
      ? Math.floor(row.offset)
      : null;
  return { cursor: text(row.cursor), offset, phase };
}

const EMPTY_TRACK: TrackState = {
  position: null,
  seriesStart: null,
  since: null,
};

function trackOf(value: unknown, track: Track): TrackState {
  const row = record(value);
  const since = text(row.since);
  const seriesStart = since ? text(row.seriesStart) : null;
  return {
    position: seriesStart ? positionOf(row.position, track) : null,
    seriesStart,
    since,
  };
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
  const usage = { day: text(row.day), jobsToday };
  const sameFeed = text(row.feedId) === feedId;
  const additions = sameFeed
    ? trackOf(row.additions, "additions")
    : EMPTY_TRACK;
  const removals = sameFeed ? trackOf(row.removals, "removals") : EMPTY_TRACK;
  // Both tracks start together; a half-set state starts over.
  const started = additions.since !== null && removals.since !== null;
  return {
    ...usage,
    additions: started ? additions : EMPTY_TRACK,
    feedId,
    removals: started ? removals : EMPTY_TRACK,
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

function trackPlan(state: TrackState, track: Track, now: Date): TrackPlan {
  const first = TRACK_PHASES[track][0] ?? "open";
  return {
    position: state.position ?? { cursor: null, offset: null, phase: first },
    seriesStart: state.seriesStart ?? watermark(now),
    since: state.since ?? watermark(now),
  };
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

  if (!(state.additions.since && state.removals.since)) {
    return { kind: "first", limit };
  }

  return {
    additions: trackPlan(state.additions, "additions", now),
    kind: "delta",
    limit,
    removals: trackPlan(state.removals, "removals", now),
    removalsLimit: Math.floor(limit / 2),
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

// After a first sync both tracks ask only for changes since it began.
export function afterFirst(state: SyncState, startedAt: Date): SyncState {
  const fresh: TrackState = {
    position: null,
    seriesStart: null,
    since: watermark(startedAt),
  };
  return { ...state, additions: fresh, removals: { ...fresh } };
}

// `next` is where the track resumes, or null once all its phases are read.
// Only then does its `since` move, so nothing in between is skipped.
export function afterTrack(
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
