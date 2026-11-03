import type { Payload } from "payload";

import { bordfulConfig, JOBS_PER_DAY, JOBS_PER_SYNC } from "@/config";

// Bordfeed bills one credit per job a feed request returns. Every feed sync
// makes at most one open-jobs request and one closed-jobs request, sized from
// what is left of the per-sync and per-day caps, so no schedule can drain a
// workspace.

export interface SyncLimits {
  jobsPerDay: number;
  jobsPerSync: number;
}

export interface SyncState {
  // Next page of an unfinished delta series (cursor or offset feeds).
  cursor: string | null;
  day: string | null;
  feedId: string | null;
  jobsToday: number;
  offset: number | null;
  // Watermark the series in progress moves `since` to once it finishes.
  pendingSince: string | null;
  // Jobs updated after this instant are fetched by the next delta sync.
  since: string | null;
}

export type FetchPlan =
  | { kind: "skip"; reason: "daily_cap" }
  | { kind: "first"; limit: number }
  | {
      cursor: string | null;
      kind: "delta";
      limit: number;
      offset: number | null;
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

function freshState(feedId: string | null): SyncState {
  return {
    cursor: null,
    day: null,
    feedId,
    jobsToday: 0,
    offset: null,
    pendingSince: null,
    since: null,
  };
}

// A different feed starts over with a capped first sync. Usage for the day
// carries across feeds, since it is the same Bordfeed workspace paying.
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
    return { ...freshState(feedId), ...usage };
  }

  const offset =
    typeof row.offset === "number" && row.offset > 0
      ? Math.floor(row.offset)
      : null;
  return {
    cursor: text(row.cursor),
    feedId,
    offset,
    pendingSince: text(row.pendingSince),
    since: text(row.since),
    ...usage,
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

  const resuming =
    state.pendingSince !== null &&
    (state.cursor !== null || state.offset !== null);
  return {
    cursor: resuming ? state.cursor : null,
    kind: "delta",
    limit,
    offset: resuming ? state.offset : null,
    seriesStart:
      resuming && state.pendingSince ? state.pendingSince : watermark(now),
    since: state.since,
  };
}

export function watermark(startedAt: Date): string {
  return new Date(startedAt.getTime() - WATERMARK_OVERLAP_MS).toISOString();
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
    cursor: null,
    offset: null,
    pendingSince: null,
    since: watermark(startedAt),
  };
}

// A delta series with more pages keeps its `since` and resumes from the
// cursor next run. Once the last page lands, `since` moves to when it began.
export function afterDelta(
  state: SyncState,
  plan: Extract<FetchPlan, { kind: "delta" }>,
  next: { nextCursor: string | null; nextOffset: number | null }
): SyncState {
  if (next.nextCursor || next.nextOffset) {
    return {
      ...state,
      cursor: next.nextCursor,
      offset: next.nextCursor ? null : next.nextOffset,
      pendingSince: plan.seriesStart,
    };
  }

  return {
    ...state,
    cursor: null,
    offset: null,
    pendingSince: null,
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

export async function writeSyncState(
  payload: Payload,
  state: SyncState
): Promise<void> {
  await payload.updateGlobal({
    data: { syncState: { ...state } },
    depth: 0,
    overrideAccess: true,
    slug: SLUG,
  });
}
