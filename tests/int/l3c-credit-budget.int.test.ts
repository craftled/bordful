import { existsSync } from "node:fs";

import { beforeEach, describe, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

import { sql } from "@payloadcms/db-postgres";

import {
  createBordfeedMock,
  MOCK_API_KEY,
  MOCK_FEED_ID,
} from "../mocks/bordfeed";

const MOCK_ORIGIN = "http://bordfeed.credit.test";
process.env.BORDFEED_BASE_URL = MOCK_ORIGIN;

// Live-sized feed: 2,000 jobs against the 2,000 job starting credit.
const mock = createBordfeedMock({ feedTotal: 2000 });
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const request = new Request(input, init);
  if (request.url.startsWith(MOCK_ORIGIN)) {
    return mock.handle(request);
  }

  return originalFetch(input, init);
};

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_TEST is required for test:int");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
if (!(databaseName.endsWith("_int") || databaseName.endsWith("_test"))) {
  throw new Error("DATABASE_URL_TEST database must end with _int or _test");
}

process.env.DATABASE_URL = databaseUrl;
const cronSecret =
  process.env.CRON_SECRET || ["int-cron-secret", "0123456789"].join("-");
process.env.CRON_SECRET = cronSecret;

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const { GET } = await import("@/app/api/cron/bordfeed/route");
const { dispatchConnectionEvent, readConnection } = await import(
  "@/lib/bordfeed/connection-store"
);
const { sealApiKey } = await import("@/lib/bordfeed/key");
const { runBordfeedSync } = await import("@/lib/bordfeed/sync");

const payload = await getPayload({ config });

const FEED_PATH = `/api/v1/feeds/${MOCK_FEED_ID}/jobs`;

function feedReads(): number {
  return mock.state.requests.filter((request) => request.path === FEED_PATH)
    .length;
}

async function connectFeed(): Promise<void> {
  const sealed = sealApiKey(payload, MOCK_API_KEY);
  await dispatchConnectionEvent(payload, {
    apiKeyEncrypted: sealed.apiKeyEncrypted,
    keyHint: sealed.keyHint,
    type: "key_stored",
  });
  await dispatchConnectionEvent(payload, {
    feedId: MOCK_FEED_ID,
    type: "feed_ready",
  });
}

async function setLimits(limits: {
  jobsPerDay?: number;
  jobsPerSync?: number;
}): Promise<void> {
  await payload.updateGlobal({
    data: limits,
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });
}

interface Executor {
  execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }>;
}

function database(): Executor {
  return (payload.db as unknown as { drizzle: Executor }).drizzle;
}

async function storedSince(): Promise<string | null> {
  const result = await database().execute(
    sql`select "state"->>'since' as "since" from "bordfeed_sync_state"`
  );
  const row = result.rows[0] as { since?: string | null } | undefined;
  return row?.since ?? null;
}

function boardJobs(where: Record<string, unknown> = {}) {
  return payload.count({
    collection: "jobs",
    overrideAccess: true,
    where: { origin: { equals: "bordfeed" }, ...where },
  });
}

async function cron(): Promise<{ ok: boolean }> {
  const response = await GET(
    new Request("http://localhost:4130/api/cron/bordfeed", {
      headers: { authorization: `Bearer ${cronSecret}` },
    })
  );
  return (await response.json()) as { ok: boolean };
}

// Cron runs must not overlap, so they run one after another.
async function cronRuns(count: number): Promise<boolean[]> {
  if (count === 0) {
    return [];
  }

  const { ok } = await cron();
  return [ok, ...(await cronRuns(count - 1))];
}

describe("bordfeed credit budget", () => {
  beforeEach(async () => {
    await payload.db.migrateFresh({ forceAcceptWarning: true });
    mock.reset();
  });

  test("the first sync spends one capped page, later syncs fetch only deltas", async () => {
    await connectFeed();
    expect(mock.balance()).toBe(2000);

    const first = await runBordfeedSync(payload);
    expect(first).toMatchObject({
      created: 50,
      fetch: "first",
      fetchedJobs: 50,
      pages: 1,
    });
    expect(feedReads()).toBe(1);
    expect(mock.state.billedJobs).toBe(50);
    expect(mock.balance()).toBe(1950);
    expect((await boardJobs()).totalDocs).toBe(50);

    const quiet = await runBordfeedSync(payload);
    expect(quiet).toMatchObject({ created: 0, fetch: "delta", fetchedJobs: 0 });
    expect(mock.state.billedJobs).toBe(50);
    const deltaQueries = mock.state.requests
      .filter((request) => request.path === FEED_PATH)
      .slice(1)
      .map((request) => request.query);
    // Closed and expired jobs updated since the first sync, then new jobs.
    expect(deltaQueries).toHaveLength(3);
    for (const query of deltaQueries) {
      expect(query).toMatchObject({ limit: "50" });
      expect(typeof query.since).toBe("string");
    }
    expect(
      deltaQueries.map((query) => [query.status, query.since_field])
    ).toEqual([
      ["closed", "updated"],
      ["expired", "updated"],
      [undefined, "first_visible"],
    ]);

    // Live bumps updated_at on routine scrapes. That alone fetches nothing.
    mock.touchFeedJobs(Array.from({ length: 2000 }, (_, index) => index + 1));
    const scraped = await runBordfeedSync(payload);
    expect(scraped).toMatchObject({ fetch: "delta", fetchedJobs: 0 });

    mock.surfaceFeedJobs([1500]);
    mock.closeFeedJobs([7]);
    mock.expireFeedJobs([9]);
    const delta = await runBordfeedSync(payload);
    expect(delta).toMatchObject({
      created: 1,
      fetch: "delta",
      fetchedJobs: 3,
      unpublished: 2,
    });
    // Jobs 7 and 9 were already received, so only job 1500 is billed.
    expect(mock.state.servedJobs).toBe(53);
    expect(mock.state.billedJobs).toBe(51);
    expect(mock.balance()).toBe(1949);
    expect(
      (await boardJobs({ _status: { equals: "published" } })).totalDocs
    ).toBe(49);
    const connection = await readConnection(payload);
    expect(connection.state).toBe("connected");
  });

  test("cron runs never spend past the daily cap", async () => {
    await setLimits({ jobsPerDay: 120, jobsPerSync: 50 });
    await connectFeed();
    await runBordfeedSync(payload);
    expect(mock.state.billedJobs).toBe(50);

    // A busy day: 900 jobs surface after the first sync.
    mock.surfaceFeedJobs(Array.from({ length: 900 }, (_, index) => index + 1));
    expect(await cronRuns(6)).toEqual([true, true, true, true, true, true]);

    // 50 + 50 + 20 jobs fetched. Jobs 1 to 50 came in the first page, so
    // the day billed 70 credits and fetched no more than the 120 job cap.
    expect(mock.state.servedJobs).toBe(120);
    expect(mock.state.billedJobs).toBe(70);
    expect(mock.balance()).toBe(1930);
    const readsAtCap = feedReads();
    const capped = await runBordfeedSync(payload);
    expect(capped).toMatchObject({ fetch: "capped", fetchedJobs: 0 });
    expect(feedReads()).toBe(readsAtCap);

    // A skipped sync leaves the last real sync on record.
    const connection = await readConnection(payload);
    expect(connection.lastSyncSummary).toMatchObject({ fetch: "delta" });
    const settings = (await payload.findGlobal({
      depth: 0,
      overrideAccess: true,
      slug: "bordfeed-connection",
    })) as { jobsPerDay?: number; jobsPerSync?: number };
    expect(settings).toMatchObject({ jobsPerDay: 120, jobsPerSync: 50 });
  });

  test("an admin jobs-per-sync setting sizes the first page", async () => {
    await setLimits({ jobsPerSync: 20 });
    await connectFeed();
    const first = await runBordfeedSync(payload);
    expect(first).toMatchObject({ created: 20, fetchedJobs: 20, pages: 1 });
    expect(mock.balance()).toBe(1980);
  });

  test("a long run of closures resumes across syncs before since moves", async () => {
    await setLimits({ jobsPerSync: 20 });
    await connectFeed();
    await runBordfeedSync(payload);
    const sinceAfterFirst = await storedSince();

    // 30 jobs close: the 20 on the board and 10 it never fetched.
    mock.closeFeedJobs(Array.from({ length: 30 }, (_, index) => index + 1));
    const first = await runBordfeedSync(payload);
    expect(first).toMatchObject({ fetchedJobs: 20, unpublished: 20 });
    expect(await storedSince()).toBe(sinceAfterFirst);

    const second = await runBordfeedSync(payload);
    expect(second).toMatchObject({ fetchedJobs: 10, unpublished: 0 });
    expect(await storedSince()).not.toBe(sinceAfterFirst);
    expect(
      (await boardJobs({ _status: { equals: "published" } })).totalDocs
    ).toBe(0);
  });

  test("the first sync after an upgrade keeps jobs it did not fetch", async () => {
    await connectFeed();
    await runBordfeedSync(payload);
    // A board from before this change has no sync state.
    await setLimits({ jobsPerSync: 20 });
    await database().execute(sql`delete from "bordfeed_sync_state"`);

    const again = await runBordfeedSync(payload);
    expect(again).toMatchObject({ fetch: "first", fetchedJobs: 20 });
    expect(
      (await boardJobs({ _status: { equals: "published" } })).totalDocs
    ).toBe(50);
  });

  test("two syncs at once never both spend", async () => {
    await connectFeed();
    const results = await Promise.all([
      runBordfeedSync(payload),
      runBordfeedSync(payload),
    ]);
    expect(results.map((result) => result.fetch).sort()).toEqual([
      "busy",
      "first",
    ]);
    expect(mock.state.servedJobs).toBe(50);
    expect(feedReads()).toBe(1);
  });
});
