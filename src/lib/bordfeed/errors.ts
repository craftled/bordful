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

export class SyncGuardError extends Error {
  constructor() {
    super("The Bordfeed feed came back empty, so no jobs were unpublished.");
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
  payment_required: "The Bordfeed plan cannot fetch this feed.",
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
    return {
      at,
      code: "invalid_response",
      message:
        "The Bordfeed feed came back empty, so no jobs were unpublished.",
    };
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
