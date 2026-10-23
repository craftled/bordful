import { existsSync } from "node:fs";

import { afterAll, beforeAll, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

import { BORDFUL_VERSION } from "@/lib/bordfeed/client-header";
import { checkForUpdate } from "@/lib/update-check/check";

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_TEST is required for test:int");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
if (!(databaseName.endsWith("_int") || databaseName.endsWith("_test"))) {
  throw new Error(
    `DATABASE_URL_TEST database must end with _int or _test (${databaseName})`
  );
}

process.env.DATABASE_URL = databaseUrl;

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");

const payload = await getPayload({ config });

const NEWER = [{ draft: false, prerelease: true, tag_name: "v1.0.0-beta.2" }];
const SAME = [{ draft: false, tag_name: "v1.0.0-beta.1" }];
const RELEASES_URL =
  "https://example.com/repos/craftled/bordful/releases?per_page=20";

function releaseFetch(body: unknown, calls: { count: number }): typeof fetch {
  return (input, init) => {
    calls.count += 1;
    const headers = new Headers(init?.headers);
    expect(headers.get("accept")).toBe("application/vnd.github+json");
    expect(headers.get("user-agent")).toBe(`bordful/${BORDFUL_VERSION}`);
    expect(headers.get("x-github-api-version")).toBe("2022-11-28");
    expect(String(input)).toBe(RELEASES_URL);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    return Promise.resolve(Response.json(body));
  };
}

beforeAll(async () => {
  await payload.db.migrateFresh({ forceAcceptWarning: true });
});

afterAll(async () => {
  await payload.destroy();
});

test("checkForUpdate caches a newer release and survives a later outage", async () => {
  const calls = { count: 0 };
  const first = await checkForUpdate(payload, {
    fetch: releaseFetch(NEWER, calls),
    now: new Date("2026-10-23T09:00:00.000Z"),
    url: RELEASES_URL,
  });

  expect(first).toEqual({
    current: "1.0.0-beta.1",
    isNewer: true,
    latest: "1.0.0-beta.2",
  });
  expect(calls.count).toBe(1);

  const stored = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: "install-state",
  });
  expect(stored.latestVersion).toBe("1.0.0-beta.2");
  expect(stored.latestCheckedAt).toBe("2026-10-23T09:00:00.000Z");

  const second = await checkForUpdate(payload, {
    fetch: releaseFetch(NEWER, calls),
    now: new Date("2026-10-23T20:00:00.000Z"),
    url: RELEASES_URL,
  });
  expect(calls.count).toBe(1);
  expect(second).toEqual(first);

  const failing: typeof fetch = () => {
    calls.count += 1;
    return Promise.reject(new Error("release host unavailable"));
  };
  const third = await checkForUpdate(payload, {
    fetch: failing,
    now: new Date("2026-10-24T09:00:01.000Z"),
    url: RELEASES_URL,
  });
  expect(calls.count).toBe(2);
  expect(third).toEqual(first);

  const afterFailure = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: "install-state",
  });
  expect(afterFailure.latestVersion).toBe("1.0.0-beta.2");
  expect(afterFailure.latestCheckedAt).toBe("2026-10-24T09:00:01.000Z");

  await payload.db.migrateFresh({ forceAcceptWarning: true });
  const sameCalls = { count: 0 };
  const same = await checkForUpdate(payload, {
    fetch: releaseFetch(SAME, sameCalls),
    now: new Date("2026-10-23T09:00:00.000Z"),
    url: RELEASES_URL,
  });
  expect(same).toEqual({
    current: "1.0.0-beta.1",
    isNewer: false,
    latest: "1.0.0-beta.1",
  });
  expect(sameCalls.count).toBe(1);
});
