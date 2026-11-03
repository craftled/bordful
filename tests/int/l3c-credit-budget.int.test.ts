import { existsSync } from "node:fs";
import { sql } from "@payloadcms/db-postgres";
import { beforeEach, describe, expect, test } from "vitest";
import {
  createBordfeedMock,
  MOCK_API_KEY,
  MOCK_FEED_ID,
} from "../mocks/bordfeed";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

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

const databaseName = new URL(databaseUrl).pathname.replace(/^\//u, "");
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
    sql`select "state"->'additions'->>'since' as "since" from "bordfeed_sync_state"`
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

const FAST = { minIntervalMs: 0 };

function sync() {
  return runBordfeedSync(payload, FAST);
}

// Syncs run one after another, like daily crons.
async function syncRuns(
  count: number
): Promise<Awaited<ReturnType<typeof runBordfeedSync>>[]> {
  if (count === 0) {
    return [];
  }

  const run = await sync();
  return [run, ...(await syncRuns(count - 1))];
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

describe("bordfeed credit budget", () => {
  beforeEach(async () => {
    await payload.db.migrateFresh({ forceAcceptWarning: true });
    mock.reset();
  });

  test("the first sync spends one capped page, later syncs fetch only deltas", async () => {
    await connectFeed();
    expect(mock.balance()).toBe(2000);

    const first = await sync();
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

    const quiet = await sync();
    expect(quiet).toMatchObject({
      checkedJobs: 50,
      created: 0,
      fetch: "delta",
      fetchedJobs: 0,
    });
    // Checking the 50 board jobs by id is free.
    expect(mock.state.checkedJobs).toBe(50);
    expect(mock.state.billedJobs).toBe(50);
    const deltaQueries = mock.state.requests
      .filter((request) => request.path === FEED_PATH)
      .slice(1)
      .map((request) => request.query);
    // One feed read: open jobs first visible since the first sync.
    expect(deltaQueries).toHaveLength(1);
    expect(deltaQueries[0]).toMatchObject({
      limit: "50",
      since_field: "first_visible",
    });
    expect(deltaQueries[0]?.status).toBeUndefined();
    expect(typeof deltaQueries[0]?.since).toBe("string");

    // Live bumps updated_at on routine scrapes. That alone fetches nothing.
    mock.touchFeedJobs(range(1, 2000));
    const scraped = await sync();
    expect(scraped).toMatchObject({ fetch: "delta", fetchedJobs: 0 });

    mock.surfaceFeedJobs([1500]);
    mock.closeFeedJobs([7]);
    mock.expireFeedJobs([9]);
    const delta = await sync();
    expect(delta).toMatchObject({
      created: 1,
      fetch: "delta",
      fetchedJobs: 1,
      unpublished: 2,
    });
    // Only the new job 1500 is billed. Jobs 7 and 9 were found by free checks.
    expect(mock.state.servedJobs).toBe(51);
    expect(mock.state.billedJobs).toBe(51);
    expect(mock.balance()).toBe(1949);
    expect(
      (await boardJobs({ _status: { equals: "published" } })).totalDocs
    ).toBe(49);
    const connection = await readConnection(payload);
    expect(connection.state).toBe("connected");
  });

  test("syncs and the cron never spend past the daily cap", async () => {
    await setLimits({ jobsPerDay: 120, jobsPerSync: 50 });
    await connectFeed();
    await sync();
    expect(mock.state.billedJobs).toBe(50);

    // A busy day: 900 jobs surface after the first sync.
    mock.surfaceFeedJobs(range(1, 900));
    const runs = await syncRuns(2);
    expect(runs.map((run) => run.fetchedJobs)).toEqual([50, 20]);

    // 50 + 50 + 20 jobs fetched. Jobs 1 to 50 came in the first page, so
    // the day billed 70 credits and fetched no more than the 120 job cap.
    expect(mock.state.servedJobs).toBe(120);
    expect(mock.state.billedJobs).toBe(70);
    expect(mock.balance()).toBe(1930);

    // The real cron route at the cap makes no request at all.
    const requestsAtCap = mock.state.requests.length;
    expect(await cron()).toMatchObject({ ok: true });
    const capped = await sync();
    expect(capped).toMatchObject({ fetch: "capped", fetchedJobs: 0 });
    expect(mock.state.requests.length).toBe(requestsAtCap);

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
    const first = await sync();
    expect(first).toMatchObject({ created: 20, fetchedJobs: 20, pages: 1 });
    expect(mock.balance()).toBe(1980);
  });

  test("closures elsewhere in the feed cost nothing and block nothing", async () => {
    await connectFeed();
    await sync();
    const sinceAfterFirst = await storedSince();

    // Three busy days: 60 jobs the board never had close and 5 new jobs
    // appear each day. On day 2 a board job closes too.
    const created: number[] = [];
    const billed: number[] = [];
    for (const day of [0, 1, 2]) {
      mock.closeFeedJobs(range(100 + day * 60, 159 + day * 60));
      mock.surfaceFeedJobs(range(1900 + day * 5, 1904 + day * 5));
      if (day === 1) {
        mock.closeFeedJobs([3]);
      }
      const before = mock.state.billedJobs;
      // biome-ignore lint/performance/noAwaitInLoops: one sync per day, in order
      const run = await sync();
      created.push(run.created);
      billed.push(mock.state.billedJobs - before);
    }

    // Each day bills exactly its 5 new jobs: closures are never fetched.
    expect(created).toEqual([5, 5, 5]);
    expect(billed).toEqual([5, 5, 5]);
    expect(await storedSince()).not.toBe(sinceAfterFirst);
    expect(
      (await boardJobs({ _status: { equals: "published" } })).totalDocs
    ).toBe(64);
  });

  test("checks walk the whole board across syncs, for free", async () => {
    await setLimits({ jobsPerDay: 1000, jobsPerSync: 100 });
    await connectFeed();
    await sync();
    mock.surfaceFeedJobs(range(101, 200));
    await sync();
    mock.surfaceFeedJobs(range(201, 250));
    // Back-to-back syncs re-read the 10 minute watermark overlap first
    // (free), so the last 50 jobs land over two syncs.
    const grow = await syncRuns(2);
    expect(grow.reduce((sum, run) => sum + run.created, 0)).toBe(50);
    expect(grow.at(-1)?.checkedJobs).toBe(200);
    expect(mock.state.billedJobs).toBe(250);

    // 250 board jobs and 200 checks a sync: two syncs reach every job.
    mock.closeFeedJobs([5, 120]);
    mock.expireFeedJobs([240]);
    const runs = await syncRuns(2);
    expect(runs.every((run) => run.checkedJobs <= 200)).toBe(true);
    expect(runs.reduce((sum, run) => sum + run.unpublished, 0)).toBe(3);
    expect(mock.state.billedJobs).toBe(250);
    expect(
      (await boardJobs({ _status: { equals: "published" } })).totalDocs
    ).toBe(247);
  });

  test("the first sync after an upgrade keeps jobs it did not fetch", async () => {
    await connectFeed();
    await sync();
    // A board from before this change has no sync state.
    await setLimits({ jobsPerSync: 20 });
    await database().execute(sql`delete from "bordfeed_sync_state"`);

    const again = await sync();
    expect(again).toMatchObject({ fetch: "first", fetchedJobs: 20 });
    expect(
      (await boardJobs({ _status: { equals: "published" } })).totalDocs
    ).toBe(50);
  });

  test("two syncs at once never both spend", async () => {
    await connectFeed();
    const results = await Promise.all([sync(), sync()]);
    expect(results.map((result) => result.fetch).sort()).toEqual([
      "busy",
      "first",
    ]);
    expect(mock.state.servedJobs).toBe(50);
    expect(feedReads()).toBe(1);
  });
});
