// Pure Sentry configuration helpers. Nothing here imports @sentry/nextjs, so
// unit tests run without the SDK and callers that only read options stay SDK
// free. The browser call sites must read process.env.NEXT_PUBLIC_* by literal
// name in their own module, because Next inlines those values at build time.

export const DEFAULT_TRACES_SAMPLE_RATE = 0.1;

export type EnvRecord = Record<string, string | undefined>;

// A trimmed value. Whitespace-only input counts as unset.
function readTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// A DSN, or undefined when unset. A whitespace-only DSN counts as unset.
export function readDsn(value: string | undefined): string | undefined {
  return readTrimmed(value);
}

// A trace sample rate from 0 to 1. Empty, non-numeric, and out-of-range
// values all fall back to DEFAULT_TRACES_SAMPLE_RATE.
export function parseSampleRate(
  raw: string | undefined,
  fallback: number = DEFAULT_TRACES_SAMPLE_RATE
): number {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return fallback;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }
  return parsed;
}

// The environment tag: VERCEL_ENV on the server, NEXT_PUBLIC_VERCEL_ENV in
// the browser, and NODE_ENV anywhere else. No new variable.
function serverEnvironment(env: EnvRecord): string {
  return env.VERCEL_ENV ?? env.NODE_ENV ?? "development";
}

function clientEnvironment(env: EnvRecord): string {
  return env.NEXT_PUBLIC_VERCEL_ENV ?? env.NODE_ENV ?? "development";
}

// Options for Sentry.init in the node and edge runtimes. Null means Sentry is
// off and the SDK must not be imported.
export interface SentryServerInitOptions {
  dsn: string;
  environment: string;
  sendDefaultPii: false;
  tracesSampleRate: number;
}

export function serverInitOptions(
  env: EnvRecord = process.env
): SentryServerInitOptions | null {
  const dsn = readDsn(env.SENTRY_DSN);
  if (!dsn) {
    return null;
  }
  return {
    dsn,
    environment: serverEnvironment(env),
    tracesSampleRate: parseSampleRate(
      env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
    ),
    sendDefaultPii: false,
  };
}

// Replay masks all text and all inputs and blocks all media, and the caller
// only adds replayIntegration when this is non-null.
export interface SentryReplayOptions {
  blockAllMedia: true;
  maskAllInputs: true;
  maskAllText: true;
  replaysOnErrorSampleRate: number;
  replaysSessionSampleRate: number;
}

// Options for Sentry.init in the browser. Null means the browser SDK is off.
export interface SentryClientInitOptions {
  dsn: string;
  environment: string;
  replay: SentryReplayOptions | null;
  sendDefaultPii: false;
  tracesSampleRate: number;
}

// NEXT_PUBLIC_SENTRY_REPLAY is on only when the trimmed value is exactly
// "true". Unset, "false", "1", "TRUE", and anything else are off.
export function isReplayEnabled(env: EnvRecord): boolean {
  return readTrimmed(env.NEXT_PUBLIC_SENTRY_REPLAY) === "true";
}

export function clientInitOptions(
  env: EnvRecord = process.env
): SentryClientInitOptions | null {
  const dsn = readDsn(env.NEXT_PUBLIC_SENTRY_DSN);
  if (!dsn) {
    return null;
  }
  const replay: SentryReplayOptions | null = isReplayEnabled(env)
    ? {
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1,
      }
    : null;
  return {
    dsn,
    environment: clientEnvironment(env),
    tracesSampleRate: parseSampleRate(
      env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
    ),
    replay,
    sendDefaultPii: false,
  };
}

// True when either DSN is set, so the build wraps the Next config with
// withSentryConfig. With no DSN the wrapper is never applied.
export function isSentryConfigured(env: EnvRecord = process.env): boolean {
  return Boolean(
    readTrimmed(env.SENTRY_DSN) ?? readTrimmed(env.NEXT_PUBLIC_SENTRY_DSN)
  );
}

// Source maps upload only with all three: token, org, and project.
export function shouldUploadSourceMaps(env: EnvRecord = process.env): boolean {
  return Boolean(
    readTrimmed(env.SENTRY_AUTH_TOKEN) &&
      readTrimmed(env.SENTRY_ORG) &&
      readTrimmed(env.SENTRY_PROJECT)
  );
}

// The ingest origin of a browser DSN, for the CSP connect-src. Never throws:
// an unparsable DSN must not break the proxy, so it is simply dropped.
export function sentryConnectOrigins(dsn: string | undefined): string[] {
  const parsed = readDsn(dsn);
  if (!parsed) {
    return [];
  }
  let url: URL;
  try {
    url = new URL(parsed);
  } catch {
    return [];
  }
  return url.protocol === "https:" ? [url.origin] : [];
}

// Replay compresses recordings in a worker created from a blob URL, so
// worker-src must allow 'self' and blob: while client Replay is on. With
// Replay off, or without a client DSN, this is empty and worker-src stays
// absent from the policy.
export const SENTRY_WORKER_SOURCES: readonly string[] = ["'self'", "blob:"];

export function sentryWorkerSources(env: EnvRecord = process.env): string[] {
  return clientInitOptions(env)?.replay ? [...SENTRY_WORKER_SOURCES] : [];
}

// Options for withSentryConfig. This module stays SDK free, so the type is
// structural: the names mirror the options the SDK accepts.
export interface SentryBuildOptions {
  authToken?: string;
  org?: string;
  project?: string;
  silent: boolean;
  sourcemaps: { disable: boolean };
  telemetry: false;
}

export function sentryBuildOptions(
  env: EnvRecord = process.env
): SentryBuildOptions {
  const upload = shouldUploadSourceMaps(env);
  return {
    // No token value can appear when the token is unset.
    authToken: upload ? readTrimmed(env.SENTRY_AUTH_TOKEN) : undefined,
    org: readTrimmed(env.SENTRY_ORG),
    project: readTrimmed(env.SENTRY_PROJECT),
    silent: !env.CI,
    sourcemaps: { disable: !upload },
    telemetry: false,
  };
}
