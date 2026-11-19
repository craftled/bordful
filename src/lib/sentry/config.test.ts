import { expect, test } from "vitest";

import {
  clientInitOptions,
  DEFAULT_TRACES_SAMPLE_RATE,
  isReplayEnabled,
  isSentryConfigured,
  parseSampleRate,
  readDsn,
  sentryBuildOptions,
  sentryConnectOrigins,
  sentryWorkerSources,
  serverInitOptions,
  shouldUploadSourceMaps,
} from "./config";

// Tests use this fake public DSN. Never put a real DSN in a test.
const FAKE_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";
const FAKE_DSN_ORIGIN = "https://o0.ingest.sentry.io";

test("readDsn trims and treats whitespace-only as unset", () => {
  expect(readDsn(` ${FAKE_DSN} `)).toBe(FAKE_DSN);
  expect(readDsn("   ")).toBeUndefined();
  expect(readDsn("")).toBeUndefined();
  expect(readDsn(undefined)).toBeUndefined();
});

test("parseSampleRate accepts finite rates from 0 to 1", () => {
  expect(parseSampleRate(undefined)).toBe(DEFAULT_TRACES_SAMPLE_RATE);
  expect(parseSampleRate("")).toBe(DEFAULT_TRACES_SAMPLE_RATE);
  expect(parseSampleRate("  ")).toBe(DEFAULT_TRACES_SAMPLE_RATE);
  expect(parseSampleRate("abc")).toBe(DEFAULT_TRACES_SAMPLE_RATE);
  expect(parseSampleRate("-1")).toBe(DEFAULT_TRACES_SAMPLE_RATE);
  expect(parseSampleRate("2")).toBe(DEFAULT_TRACES_SAMPLE_RATE);
  expect(parseSampleRate("Infinity")).toBe(DEFAULT_TRACES_SAMPLE_RATE);
  expect(parseSampleRate("0.5")).toBe(0.5);
  expect(parseSampleRate(" 0.25 ")).toBe(0.25);
  expect(parseSampleRate("0")).toBe(0);
  expect(parseSampleRate("1")).toBe(1);
  expect(parseSampleRate("junk", 0.25)).toBe(0.25);
});

test("serverInitOptions is null without a DSN", () => {
  expect(serverInitOptions({})).toBeNull();
  expect(serverInitOptions({ SENTRY_DSN: "   " })).toBeNull();
  expect(serverInitOptions({ NEXT_PUBLIC_SENTRY_DSN: FAKE_DSN })).toBeNull();
});

test("serverInitOptions returns the server DSN and environment", () => {
  expect(serverInitOptions({ SENTRY_DSN: FAKE_DSN })).toEqual({
    dsn: FAKE_DSN,
    environment: "development",
    tracesSampleRate: DEFAULT_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  });
  expect(
    serverInitOptions({ SENTRY_DSN: FAKE_DSN, VERCEL_ENV: "production" })
  ).toEqual({
    dsn: FAKE_DSN,
    environment: "production",
    tracesSampleRate: DEFAULT_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  });
  expect(
    serverInitOptions({
      NODE_ENV: "production",
      SENTRY_DSN: FAKE_DSN,
      VERCEL_ENV: "preview",
    })?.environment
  ).toBe("preview");
  expect(
    serverInitOptions({
      NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: "0.5",
      NODE_ENV: "production",
      SENTRY_DSN: FAKE_DSN,
    })?.tracesSampleRate
  ).toBe(0.5);
});

test("clientInitOptions is null without a browser DSN", () => {
  expect(clientInitOptions({})).toBeNull();
  expect(clientInitOptions({ NEXT_PUBLIC_SENTRY_DSN: " " })).toBeNull();
  expect(clientInitOptions({ SENTRY_DSN: FAKE_DSN })).toBeNull();
  // Replay on still means off without a browser DSN.
  expect(clientInitOptions({ NEXT_PUBLIC_SENTRY_REPLAY: "true" })).toBeNull();
});

test("clientInitOptions returns the browser DSN and environment", () => {
  expect(clientInitOptions({ NEXT_PUBLIC_SENTRY_DSN: FAKE_DSN })).toEqual({
    dsn: FAKE_DSN,
    environment: "development",
    tracesSampleRate: DEFAULT_TRACES_SAMPLE_RATE,
    replay: null,
    sendDefaultPii: false,
  });
  expect(
    clientInitOptions({
      NEXT_PUBLIC_SENTRY_DSN: FAKE_DSN,
      NEXT_PUBLIC_VERCEL_ENV: "production",
    })?.environment
  ).toBe("production");
  expect(
    clientInitOptions({
      NEXT_PUBLIC_SENTRY_DSN: FAKE_DSN,
      NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: "0",
    })?.tracesSampleRate
  ).toBe(0);
});

test("replay is off unless the trimmed value is exactly true", () => {
  expect(isReplayEnabled({})).toBe(false);
  expect(isReplayEnabled({ NEXT_PUBLIC_SENTRY_REPLAY: "" })).toBe(false);
  expect(isReplayEnabled({ NEXT_PUBLIC_SENTRY_REPLAY: "false" })).toBe(false);
  expect(isReplayEnabled({ NEXT_PUBLIC_SENTRY_REPLAY: "1" })).toBe(false);
  expect(isReplayEnabled({ NEXT_PUBLIC_SENTRY_REPLAY: "TRUE" })).toBe(false);
  expect(isReplayEnabled({ NEXT_PUBLIC_SENTRY_REPLAY: "yes" })).toBe(false);
  expect(isReplayEnabled({ NEXT_PUBLIC_SENTRY_REPLAY: "true" })).toBe(true);
  expect(isReplayEnabled({ NEXT_PUBLIC_SENTRY_REPLAY: " true " })).toBe(true);
});

test("clientInitOptions turns replay on only for the exact value true", () => {
  const base = { NEXT_PUBLIC_SENTRY_DSN: FAKE_DSN };
  expect(clientInitOptions(base)?.replay).toBeNull();
  expect(
    clientInitOptions({ ...base, NEXT_PUBLIC_SENTRY_REPLAY: "TRUE" })?.replay
  ).toBeNull();
  expect(
    clientInitOptions({ ...base, NEXT_PUBLIC_SENTRY_REPLAY: "1" })?.replay
  ).toBeNull();
  const replay = clientInitOptions({
    ...base,
    NEXT_PUBLIC_SENTRY_REPLAY: "true",
  })?.replay;
  expect(replay).toEqual({
    maskAllText: true,
    maskAllInputs: true,
    blockAllMedia: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
  });
});

test("isSentryConfigured is true when either DSN is set", () => {
  expect(isSentryConfigured({})).toBe(false);
  expect(isSentryConfigured({ SENTRY_DSN: " " })).toBe(false);
  expect(isSentryConfigured({ SENTRY_DSN: FAKE_DSN })).toBe(true);
  expect(isSentryConfigured({ NEXT_PUBLIC_SENTRY_DSN: FAKE_DSN })).toBe(true);
});

test("shouldUploadSourceMaps needs token, org, and project", () => {
  expect(shouldUploadSourceMaps({})).toBe(false);
  expect(
    shouldUploadSourceMaps({
      SENTRY_AUTH_TOKEN: "example-token",
      SENTRY_ORG: "example-org",
    })
  ).toBe(false);
  expect(
    shouldUploadSourceMaps({
      SENTRY_AUTH_TOKEN: "example-token",
      SENTRY_PROJECT: "example-project",
    })
  ).toBe(false);
  expect(
    shouldUploadSourceMaps({
      SENTRY_ORG: "example-org",
      SENTRY_PROJECT: "example-project",
    })
  ).toBe(false);
  expect(
    shouldUploadSourceMaps({
      SENTRY_AUTH_TOKEN: " ",
      SENTRY_ORG: "example-org",
      SENTRY_PROJECT: "example-project",
    })
  ).toBe(false);
  expect(
    shouldUploadSourceMaps({
      SENTRY_AUTH_TOKEN: "example-token",
      SENTRY_ORG: "example-org",
      SENTRY_PROJECT: "example-project",
    })
  ).toBe(true);
});

test("sentryBuildOptions disables upload without the token trio", () => {
  const without = sentryBuildOptions({});
  expect(without.sourcemaps.disable).toBe(true);
  expect(without.authToken).toBeUndefined();
  expect(without.telemetry).toBe(false);
  expect(without.org).toBeUndefined();
  expect(without.project).toBeUndefined();

  const partial = sentryBuildOptions({ SENTRY_ORG: "example-org" });
  expect(partial.sourcemaps.disable).toBe(true);
  expect(partial.authToken).toBeUndefined();

  const withToken = sentryBuildOptions({
    CI: "1",
    SENTRY_AUTH_TOKEN: "example-token",
    SENTRY_ORG: " example-org ",
    SENTRY_PROJECT: "example-project",
  });
  expect(withToken.sourcemaps.disable).toBe(false);
  expect(withToken.authToken).toBe("example-token");
  expect(withToken.org).toBe("example-org");
  expect(withToken.project).toBe("example-project");
  expect(withToken.silent).toBe(false);
  expect(sentryBuildOptions({}).silent).toBe(true);
});

test("sentryConnectOrigins returns the https ingest origin only", () => {
  expect(sentryConnectOrigins(FAKE_DSN)).toEqual([FAKE_DSN_ORIGIN]);
  expect(sentryConnectOrigins(undefined)).toEqual([]);
  expect(sentryConnectOrigins("")).toEqual([]);
  expect(sentryConnectOrigins("  ")).toEqual([]);
  expect(sentryConnectOrigins("not a url")).toEqual([]);
  expect(sentryConnectOrigins("http://key@o0.ingest.sentry.io/0")).toEqual([]);
});

test("sentryConnectOrigins keeps a port and an IPv6 host", () => {
  expect(sentryConnectOrigins("https://k@sentry.example.com:9000/1")).toEqual([
    "https://sentry.example.com:9000",
  ]);
  expect(sentryConnectOrigins("https://k@[::1]:9000/1")).toEqual([
    "https://[::1]:9000",
  ]);
});

test("sentryConnectOrigins never throws on hosts that fail CSP validation", () => {
  // Each parses as a URL, but the origin would be rejected by assertCspOrigin.
  expect(sentryConnectOrigins("https://k@o0.ingest.sentry.io;x/0")).toEqual([]);
  expect(sentryConnectOrigins("https://k@a,b.io/0")).toEqual([]);
  expect(sentryConnectOrigins("https://k@a'b.io/0")).toEqual([]);
});

test("sentryWorkerSources only allow blob workers with replay and a DSN", () => {
  expect(sentryWorkerSources({})).toEqual([]);
  expect(sentryWorkerSources({ NEXT_PUBLIC_SENTRY_REPLAY: "true" })).toEqual(
    []
  );
  expect(sentryWorkerSources({ NEXT_PUBLIC_SENTRY_DSN: FAKE_DSN })).toEqual([]);
  expect(
    sentryWorkerSources({
      NEXT_PUBLIC_SENTRY_DSN: FAKE_DSN,
      NEXT_PUBLIC_SENTRY_REPLAY: "false",
    })
  ).toEqual([]);
  expect(
    sentryWorkerSources({
      NEXT_PUBLIC_SENTRY_DSN: FAKE_DSN,
      NEXT_PUBLIC_SENTRY_REPLAY: "true",
    })
  ).toEqual(["'self'", "blob:"]);
});
