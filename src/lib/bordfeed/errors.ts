import type { BordfeedWorkspace, SafeError, SafeErrorCode } from "./types";

export class BordfeedApiError extends Error {
  readonly code: string;
  readonly retryAfterSeconds: number | null;
  readonly status: number;
  readonly workspaces: BordfeedWorkspace[];

  constructor(options: {
    code: string;
    message: string;
    retryAfterSeconds?: number | null;
    status: number;
    workspaces?: BordfeedWorkspace[];
  }) {
    super(options.message);
    this.name = "BordfeedApiError";
    this.code = options.code;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
    this.status = options.status;
    this.workspaces = options.workspaces ?? [];
  }
}

export const EMPTY_FEED_MESSAGE =
  "The Bordfeed feed came back empty, so the board kept its current jobs.";

export const MASS_REMOVAL_MESSAGE =
  "Bordfeed reported most of the checked jobs as gone, so the board kept them published for now. Two later syncs, at least 12 hours apart, must see the same slice before any of those jobs can be unpublished, and only when mass unpublish is explicitly allowed.";

export const MAX_INCIDENT_REMOVALS_PER_SYNC = 10;

export const MASS_REMOVAL_PENDING_MESSAGE = `Bordfeed confirmed this slice of jobs as gone on two later syncs. Mass unpublish stays held until BORDFEED_ALLOW_MASS_UNPUBLISH=1. A later sync then unpublishes at most ${MAX_INCIDENT_REMOVALS_PER_SYNC} of them.`;

export function massRemovalFloorMessage(cap: number): string {
  return `Bordfeed confirmed a mass removal and this sync unpublished ${cap} jobs, the most one sync may remove after an incident. The rest stay published until a later sync.`;
}

export class SyncGuardError extends Error {
  constructor(message = EMPTY_FEED_MESSAGE) {
    super(message);
    this.name = "SyncGuardError";
  }
}

export class IllegalTransitionError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.name = "IllegalTransitionError";
    this.reason = reason;
  }
}

const MESSAGES = {
  already_issued:
    "This code was already used and its API key was issued. Paste your Bordfeed API key instead.",
  auth_failed: "Bordfeed rejected the API key.",
  invalid_response: "Bordfeed returned an unexpected response.",
  network: "Could not reach Bordfeed.",
  not_found: "Bordfeed could not find this template or feed.",
  payment_required:
    "This Bordfeed workspace does not have enough credits for this sync. Each job a sync fetches for the first time uses one credit. Top up in Bordfeed, then sync again. The board keeps its current jobs until then.",
  rate_limited: "Bordfeed is rate limiting this board. Try again later.",
  unknown: "The Bordfeed request failed.",
  workspace_required: "Choose which Bordfeed workspace to connect.",
} as const;

export function safeMessage(code: SafeErrorCode): string {
  return MESSAGES[code];
}

function isNetworkFailure(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function safeCode(error: BordfeedApiError): SafeErrorCode {
  if (error.code === "workspace_required") {
    return "workspace_required";
  }

  if (error.code === "already_issued") {
    return "already_issued";
  }

  if (error.code === "network" || error.status === 0) {
    return "network";
  }

  if (error.code === "invalid_response") {
    return "invalid_response";
  }

  if (error.status === 401 || error.status === 403) {
    return "auth_failed";
  }

  if (error.status === 402) {
    return "payment_required";
  }

  if (error.status === 404) {
    return "not_found";
  }

  if (error.status === 429 || error.code === "rate_limited") {
    return "rate_limited";
  }

  return "unknown";
}

export function toSafeError(error: unknown, now = new Date()): SafeError {
  const at = now.toISOString();

  if (error instanceof SyncGuardError) {
    return { at, code: "invalid_response", message: error.message };
  }

  if (error instanceof BordfeedApiError) {
    const code = safeCode(error);
    return { at, code, message: safeMessage(code) };
  }

  if (isNetworkFailure(error)) {
    return { at, code: "network", message: safeMessage("network") };
  }

  return { at, code: "unknown", message: safeMessage("unknown") };
}
