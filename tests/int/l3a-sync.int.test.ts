import { existsSync } from "node:fs";

import { beforeEach, describe, expect, test } from "vitest";
import type { BordfeedClient, FeedPageQuery } from "@/lib/bordfeed/client";
import {
  dispatchConnectionEvent,
  readConnection,
} from "@/lib/bordfeed/connection-store";
import {
  BordfeedApiError,
  MASS_REMOVAL_MESSAGE,
  MASS_REMOVAL_PENDING_MESSAGE,
  MAX_INCIDENT_REMOVALS_PER_SYNC,
  massRemovalFloorMessage,
  SyncGuardError,
} from "@/lib/bordfeed/errors";
import type { BordfeedJob } from "@/lib/bordfeed/job-schema";
import { sealApiKey } from "@/lib/bordfeed/key";
import { ensureSampleJobs } from "@/lib/bordfeed/sample";
import { runFeedSync, runSampleSync } from "@/lib/bordfeed/sync";
import { isEncryptedEnvelope } from "@/lib/crypto/secret-box";
import { queryPublishedJobs } from "@/lib/read/queries";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const FEED_ID = "11111111-1111-4111-8111-111111111111";
// biome-ignore lint/complexity/noUnnecessaryTemplateExpression: split literal keeps secret scanners from flagging the test key
const API_KEY = `bf_${"test_key_0001"}`;

const exampleCompany = {
  domain: "example.com",
  id: "co-example",
  name: "Example Co",
  slug: "example-co",
};

const acmeCompany = {
  domain: "acme.example",
  id: "co-acme",
  name: "Acme Example Ltd",
  slug: "acme-example-ltd",
};

const previewCalls: string[] = [];
const originalFetch = globalThis.fetch;

function previewBody(jobs: BordfeedJob[]) {
  return {
    data: jobs,
    message: "Preview of sample jobs.",
    preview: true as const,
    request_id: "req_preview",
    template: {
      description: "Remote roles in every job category and location",
      filters: { workplace_type: ["Remote"] },
      id: "fully-remote",
      name: "Fully Remote",
    },
  };
}

function sampleJobs(): BordfeedJob[] {
  return [0, 1, 2].map((index) => {
    const number = String(index + 1).padStart(2, "0");
    const company = index === 1 ? acmeCompany : exampleCompany;
    return {
      apply_url: `https://jobs.example.com/sample/${number}/apply`,
      company,
      description: `Build reliable systems ${number}.`,
      id: `samplejob${number}`,
      listing_url: `https://jobs.example.com/sample/${number}`,
      posted_date: "2026-01-15T12:00:00.000Z",
      slug: `sample-platform-engineer-${number}`,
      title: `Sample Platform Engineer ${number}`,
      type: "Full-time",
      workplace_type: "Remote",
    };
  });
}

function feedJobs(count: number): BordfeedJob[] {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const company = index % 2 === 0 ? exampleCompany : acmeCompany;
    return {
      apply_url: `https://jobs.example.com/feed/${number}/apply`,
      company,
      description: `Build reliable systems ${number}.`,
      id: `feedjob${number}`,
      listing_url: `https://jobs.example.com/feed/${number}`,
      posted_date: "2026-01-15T12:00:00.000Z",
      slug: `mock-feed-engineer-${number}`,
      title: `Mock Feed Engineer ${number}`,
      type: "Full-time",
      workplace_type: "Remote",
    };
  });
}

globalThis.fetch = (input, init) => {
  const url = String(input);
  if (url.includes("/api/v1/templates/") && url.includes("/preview")) {
    previewCalls.push(url);
    return Promise.resolve(Response.json(previewBody(sampleJobs())));
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

// The integration job does not set CRON_SECRET. The route reads it per request.
const cronSecret =
  process.env.CRON_SECRET || ["int-cron-secret", "0123456789"].join("-");
process.env.CRON_SECRET = cronSecret;

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const { GET } = await import("@/app/api/cron/bordfeed/route");

const payload = await getPayload({ config });

function unused<T>(): Promise<T> {
  return Promise.reject(new Error("unused"));
}

function emptyPage() {
  return Promise.resolve({
    data: [],
    hasMore: false,
    nextCursor: null,
    nextOffset: null,
  });
}

function sampleClient(jobs: BordfeedJob[] = sampleJobs()): BordfeedClient {
  return {
    checkJob: unused,
    createFeed: () => Promise.resolve({ id: FEED_ID }),
    fetchFeedPage: emptyPage,
    listTemplates: unused,
    previewTemplate: () => Promise.resolve(previewBody(jobs)),
    register: unused,
    verify: unused,
  };
}

// A feed whose jobs all changed just now: a delta sync sees every job, and
// `closed` lists the jobs Bordfeed no longer shows (404 on a check).
function feedClient(
  jobs: BordfeedJob[],
  closed: BordfeedJob[] = []
): BordfeedClient & { queries: FeedPageQuery[] } {
  const queries: FeedPageQuery[] = [];
  const gone = new Set(closed.map((job) => job.id));
  return {
    checkJob: (jobId) =>
      Promise.resolve(
        gone.has(jobId)
          ? { status: "gone" as const }
          : { charged: 0, status: "active" as const }
      ),
    createFeed: () => Promise.resolve({ id: FEED_ID }),
    fetchFeedPage(_feedId, query) {
      queries.push(query);
      const source = jobs;
      const start = query.cursor ? Number(query.cursor.slice(1)) : 0;
      const end = Math.min(start + query.limit, source.length);
      const more = end < source.length;
      return Promise.resolve({
        data: source.slice(start, end),
        hasMore: more,
        nextCursor: more ? `c${end}` : null,
        nextOffset: null,
      });
    },
    listTemplates: unused,
    previewTemplate: () => Promise.resolve(previewBody([])),
    queries,
    register: unused,
    verify: unused,
  };
}

async function connectFeed(): Promise<void> {
  const sealed = sealApiKey(payload, API_KEY);
  await dispatchConnectionEvent(payload, {
    apiKeyEncrypted: sealed.apiKeyEncrypted,
    keyHint: sealed.keyHint,
    type: "key_stored",
  });
  await dispatchConnectionEvent(payload, {
    feedId: FEED_ID,
    type: "feed_ready",
  });
}

describe("bordfeed sync", () => {
  beforeEach(async () => {
    await payload.db.migrateFresh({ forceAcceptWarning: true });
    previewCalls.length = 0;
  });

  test("sample sync publishes three jobs and two companies, then changes nothing", async () => {
    const first = await runSampleSync(payload, { client: sampleClient() });
    const jobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    const companies = await payload.count({
      collection: "companies",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    const published = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: {
        and: [
          { origin: { equals: "bordfeed_sample" } },
          { _status: { equals: "published" } },
        ],
      },
    });
    const connection = await readConnection(payload);

    expect(first.created).toBe(3);
    expect(jobs.totalDocs).toBe(3);
    expect(published.totalDocs).toBe(3);
    expect(companies.totalDocs).toBe(2);
    expect(connection.state).toBe("sample");
    expect(connection.lastSyncAt).toEqual(expect.any(String));

    const second = await runSampleSync(payload, { client: sampleClient() });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0);
  });

  test("ensureSampleJobs creates the sample once", async () => {
    await ensureSampleJobs(payload);
    expect(previewCalls).toHaveLength(1);
    previewCalls.length = 0;
    await ensureSampleJobs(payload);
    expect(previewCalls).toHaveLength(0);
    const jobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    expect(jobs.totalDocs).toBe(3);
  });

  test("feed sync publishes one page, then unpublishes closed jobs", async () => {
    await runSampleSync(payload, { client: sampleClient() });
    const [sampleBefore] = sampleJobs();
    if (!sampleBefore?.slug) {
      throw new Error("sample fixture is missing a slug");
    }

    await connectFeed();
    const stored = await readConnection(payload);
    expect(isEncryptedEnvelope(stored.apiKeyEncrypted ?? "")).toBe(true);
    expect(JSON.stringify(stored).includes(API_KEY)).toBe(false);

    const connectedJobs = feedJobs(25).map((job, index) =>
      index === 0
        ? { ...job, id: sampleBefore.id, slug: sampleBefore.slug }
        : job
    );
    const first = await runFeedSync(payload, {
      client: feedClient(connectedJobs),
    });
    const connection = await readConnection(payload);
    const sampleJobsLeft = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    const sampleCompaniesLeft = await payload.count({
      collection: "companies",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    const bordfeedJobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed" } },
    });
    const overlapped = await payload.find({
      collection: "jobs",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { bordfeedJobId: { equals: sampleBefore.id } },
    });
    const summary = connection.lastSyncSummary;

    expect(first.created).toBe(25);
    expect(first.pages).toBe(1);
    expect(first.fetchedJobs).toBe(25);
    expect(bordfeedJobs.totalDocs).toBe(25);
    expect(sampleJobsLeft.totalDocs).toBe(0);
    expect(sampleCompaniesLeft.totalDocs).toBe(0);
    expect(overlapped.docs[0]?.origin).toBe("bordfeed");
    expect(overlapped.docs[0]?.slug).toBe(sampleBefore.slug);
    expect(connection.state).toBe("connected");
    expect(summary).toMatchObject({ created: 25 });

    const rerun = await runFeedSync(payload, {
      client: feedClient(connectedJobs),
    });
    expect(rerun.created).toBe(0);
    expect(rerun.updated).toBe(0);

    expect(rerun.fetch).toBe("delta");

    const second = await runFeedSync(payload, {
      client: feedClient([], connectedJobs.slice(23)),
    });
    const published = await queryPublishedJobs(payload, { limit: 50, page: 1 });
    expect(second.unpublished).toBe(2);
    expect(published.totalDocs).toBe(23);

    // A delta that finds nothing changed keeps every job.
    const quiet = await runFeedSync(payload, { client: feedClient([]) });
    const stillPublished = await queryPublishedJobs(payload, {
      limit: 50,
      page: 1,
    });
    expect(quiet).toMatchObject({ created: 0, unpublished: 0, updated: 0 });
    expect(stillPublished.totalDocs).toBe(23);
  });

  test("the import blocklist keeps blocked jobs and their company off the board", async () => {
    await payload.updateGlobal({
      data: { companies: "acme example ltd" },
      overrideAccess: true,
      slug: "import-blocklist",
    });

    const summary = await runSampleSync(payload, { client: sampleClient() });
    const companies = await payload.find({
      collection: "companies",
      depth: 0,
      overrideAccess: true,
    });

    expect(summary).toMatchObject({ created: 2, skipped: 1 });
    expect(companies.docs.map((company) => company.name)).toEqual([
      "Example Co",
    ]);
  });

  test("saving the blocklist unpublishes imported matches and syncs keep them down", async () => {
    await connectFeed();
    const jobs = feedJobs(4);
    await runFeedSync(payload, { client: feedClient(jobs) });
    const manual = await payload.create({
      collection: "jobs",
      data: {
        _status: "published",
        applyMethod: "url",
        applyUrl: "https://acme.example/apply",
        companyName: "Acme Example Ltd",
        origin: "manual",
        slug: "manual-acme-role",
        title: "Manual Acme Role",
      },
      draft: false,
      overrideAccess: true,
    });

    await payload.updateGlobal({
      data: { domains: "acme.example\nnot a domain" },
      overrideAccess: true,
      slug: "import-blocklist",
    });
    const afterSave = await queryPublishedJobs(payload, { limit: 50, page: 1 });
    expect(afterSave.items.map((job) => job.slug).sort()).toEqual([
      "manual-acme-role",
      "mock-feed-engineer-01",
      "mock-feed-engineer-03",
    ]);

    // Bordfeed sends the blocked jobs again: they stay unpublished.
    const rerun = await runFeedSync(payload, {
      client: feedClient(
        jobs.map((job) => ({ ...job, title: `${job.title}!` }))
      ),
    });
    const afterSync = await queryPublishedJobs(payload, { limit: 50, page: 1 });
    expect(rerun).toMatchObject({ created: 0, skipped: 2, updated: 2 });
    expect(afterSync.totalDocs).toBe(3);
    expect(afterSync.items.some((job) => job.slug === manual.slug)).toBe(true);
  });

  test("a billed check stops the checks and shrinks the feed read", async () => {
    await connectFeed();
    await runFeedSync(payload, { client: feedClient(feedJobs(25)) });

    // A board job this workspace was never billed for: the first check
    // costs one credit, so no more checks run and the feed read asks for 49.
    const base = feedClient(feedJobs(25));
    let checks = 0;
    const billed: BordfeedClient & { queries: FeedPageQuery[] } = {
      ...base,
      checkJob: () => {
        checks += 1;
        return Promise.resolve({ charged: 1, status: "active" as const });
      },
    };
    const run = await runFeedSync(payload, { client: billed });
    expect(checks).toBe(1);
    expect(run.checkedJobs).toBe(1);
    expect(base.queries.at(-1)?.limit).toBe(49);
  });

  test("a failed check keeps the jobs and still adds new ones", async () => {
    await connectFeed();
    await runFeedSync(payload, { client: feedClient(feedJobs(25)) });

    const base = feedClient(feedJobs(30));
    const failing: BordfeedClient & { queries: FeedPageQuery[] } = {
      ...base,
      checkJob: () =>
        Promise.reject(
          new BordfeedApiError({
            code: "rate_limited",
            message: "Bordfeed is rate limiting this workspace.",
            status: 429,
          })
        ),
    };
    await expect(runFeedSync(payload, { client: failing })).rejects.toThrow();
    expect(base.queries).toHaveLength(1);
    const published = await queryPublishedJobs(payload, { limit: 50, page: 1 });
    expect(published.totalDocs).toBe(30);
  });

  test("most checked jobs gone stays held until two confirmations and an allow flag", async () => {
    await connectFeed();
    const jobs = feedJobs(25);
    await runFeedSync(payload, { client: feedClient(jobs) });

    // 22 of 25 gone at once looks like a Bordfeed incident, not churn.
    const gone = () => feedClient([], jobs.slice(0, 22));
    const start = Date.now();
    const at = (hours: number) => () => new Date(start + hours * 3_600_000);
    const published = async () =>
      (await queryPublishedJobs(payload, { limit: 50, page: 1 })).totalDocs;
    const runAt = (hours: number) =>
      runFeedSync(payload, { client: gone(), now: at(hours) }).catch(
        (caught: unknown) => caught
      );
    const previous = process.env.BORDFEED_ALLOW_MASS_UNPUBLISH;
    delete process.env.BORDFEED_ALLOW_MASS_UNPUBLISH;

    try {
      for (const hours of [0, 1]) {
        // biome-ignore lint/performance/noAwaitInLoops: syncs run in order
        const error = await runAt(hours);
        expect(error).toBeInstanceOf(SyncGuardError);
        expect(error).toMatchObject({ message: MASS_REMOVAL_MESSAGE });
        expect(await published()).toBe(25);
      }
      const connection = await readConnection(payload);
      expect(connection.lastError?.message).toBe(MASS_REMOVAL_MESSAGE);

      // One confirmation, 13 hours later. Still held.
      const once = await runAt(13);
      expect(once).toBeInstanceOf(SyncGuardError);
      expect(once).toMatchObject({ message: MASS_REMOVAL_MESSAGE });
      expect(await published()).toBe(25);

      // The allow flag does not skip the second confirmation.
      process.env.BORDFEED_ALLOW_MASS_UNPUBLISH = "1";
      const early = await runAt(14);
      expect(early).toBeInstanceOf(SyncGuardError);
      expect(early).toMatchObject({ message: MASS_REMOVAL_MESSAGE });
      expect(await published()).toBe(25);
      delete process.env.BORDFEED_ALLOW_MASS_UNPUBLISH;

      // Second confirmation. Still held until the owner allows it.
      const twice = await runAt(25);
      expect(twice).toBeInstanceOf(SyncGuardError);
      expect(twice).toMatchObject({ message: MASS_REMOVAL_PENDING_MESSAGE });
      expect(await published()).toBe(25);
      const pending = await readConnection(payload);
      expect(pending.lastError?.message).toBe(MASS_REMOVAL_PENDING_MESSAGE);

      process.env.BORDFEED_ALLOW_MASS_UNPUBLISH = "1";
      const released = await runAt(26);
      expect(released).toBeInstanceOf(SyncGuardError);
      expect(released).toMatchObject({
        message: massRemovalFloorMessage(MAX_INCIDENT_REMOVALS_PER_SYNC),
      });
      expect(await published()).toBe(25 - MAX_INCIDENT_REMOVALS_PER_SYNC);
      const capped = await readConnection(payload);
      expect(capped.lastError?.message).toBe(
        massRemovalFloorMessage(MAX_INCIDENT_REMOVALS_PER_SYNC)
      );

      // A later allowed sync drains another batch of the same confirmed ids.
      const again = await runAt(27);
      expect(again).toBeInstanceOf(SyncGuardError);
      expect(again).toMatchObject({
        message: massRemovalFloorMessage(MAX_INCIDENT_REMOVALS_PER_SYNC),
      });
      expect(await published()).toBe(25 - 2 * MAX_INCIDENT_REMOVALS_PER_SYNC);
    } finally {
      if (previous === undefined) {
        delete process.env.BORDFEED_ALLOW_MASS_UNPUBLISH;
      } else {
        process.env.BORDFEED_ALLOW_MASS_UNPUBLISH = previous;
      }
    }
  });

  test("a normal share of closures is unpublished at once", async () => {
    await connectFeed();
    const jobs = feedJobs(25);
    await runFeedSync(payload, { client: feedClient(jobs) });
    // 15 of 25 is a lot, but under the 80% incident line.
    const run = await runFeedSync(payload, {
      client: feedClient([], jobs.slice(0, 15)),
    });
    expect(run.unpublished).toBe(15);
  });

  test("a job whose lookup keeps failing is skipped, not a wall", async () => {
    await connectFeed();
    const jobs = feedJobs(25);
    await runFeedSync(payload, { client: feedClient(jobs) });

    const base = feedClient([], jobs.slice(0, 3));
    let calls = 0;
    const flaky: BordfeedClient & { queries: FeedPageQuery[] } = {
      ...base,
      checkJob: (jobId) => {
        calls += 1;
        if (calls === 1) {
          return Promise.reject(
            new BordfeedApiError({
              code: "invalid_response",
              message: "Bordfeed returned an unexpected response.",
              status: 200,
            })
          );
        }
        return base.checkJob(jobId);
      },
    };
    const run = await runFeedSync(payload, { client: flaky });
    expect(run.checkedJobs).toBe(24);
    expect(run.unpublished).toBeGreaterThanOrEqual(2);
  });

  test("checks stop at their time limit", async () => {
    await connectFeed();
    await runFeedSync(payload, { client: feedClient(feedJobs(25)) });

    // Every clock read moves 10 s, so the 120 s check budget runs out early.
    let time = Date.parse("2026-11-03T06:00:00.000Z");
    const now = () => {
      time += 10_000;
      return new Date(time);
    };
    const run = await runFeedSync(payload, {
      client: feedClient(feedJobs(25)),
      now,
    });
    expect(run.checkedJobs).toBeGreaterThan(0);
    expect(run.checkedJobs).toBeLessThan(25);
  });

  test("an empty first feed keeps the samples and records an error", async () => {
    await runSampleSync(payload, { client: sampleClient() });
    await connectFeed();
    await expect(
      runFeedSync(payload, { client: feedClient([]) })
    ).rejects.toBeInstanceOf(SyncGuardError);
    const afterGuard = await readConnection(payload);
    const samples = await queryPublishedJobs(payload, { limit: 50, page: 1 });
    expect(afterGuard.state).toBe("error");
    expect(afterGuard.previousState).toBe("connected");
    expect(samples.totalDocs).toBe(3);

    const retry = await runFeedSync(payload, {
      client: feedClient(feedJobs(4)),
    });
    expect(retry).toMatchObject({ created: 4, fetch: "first" });
  });

  test("reusing a manual company by domain does not rewrite jobs", async () => {
    await payload.create({
      collection: "companies",
      data: {
        domain: "example.com",
        name: "Example Co",
        origin: "manual",
        slug: "example-co",
      },
      depth: 0,
      overrideAccess: true,
    });
    await connectFeed();
    const jobs = feedJobs(2);
    const first = await runFeedSync(payload, { client: feedClient(jobs) });
    expect(first.created).toBe(2);

    const example = await payload.find({
      collection: "companies",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { domain: { equals: "example.com" } },
    });
    expect(example.docs[0]?.origin).toBe("manual");
    expect(example.docs[0]?.bordfeedCompanyId ?? null).toBeNull();
    expect(example.totalDocs).toBe(1);

    const second = await runFeedSync(payload, { client: feedClient(jobs) });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0);
  });

  test("feed sync updates a bordfeed company and then stays quiet", async () => {
    await connectFeed();
    const original = feedJobs(1);
    await runFeedSync(payload, { client: feedClient(original) });
    const renamed = original.map((job) => ({
      ...job,
      company: {
        ...exampleCompany,
        logo_url: "https://cdn.example.com/logo.png",
        name: "Example Co Renamed",
      },
    }));
    const second = await runFeedSync(payload, { client: feedClient(renamed) });
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0);

    const company = await payload.find({
      collection: "companies",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { domain: { equals: "example.com" } },
    });
    expect(company.docs[0]?.name).toBe("Example Co Renamed");
    expect(company.docs[0]?.logoUrl).toBe("https://cdn.example.com/logo.png");
    expect(company.docs[0]?.origin).toBe("bordfeed");

    const listed = await payload.find({
      collection: "jobs",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { origin: { equals: "bordfeed" } },
    });
    expect(listed.docs[0]?.companyName).toBe("Example Co Renamed");

    const third = await runFeedSync(payload, { client: feedClient(renamed) });
    expect(third.created).toBe(0);
    expect(third.updated).toBe(0);
  });

  test("renaming a bordfeed company leaves manual and paid jobs alone", async () => {
    await connectFeed();
    const original = feedJobs(1);
    await runFeedSync(payload, { client: feedClient(original) });
    const company = await payload.find({
      collection: "companies",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { domain: { equals: "example.com" } },
    });
    const companyId = company.docs[0]?.id;
    if (companyId === undefined) {
      throw new Error("missing bordfeed company");
    }

    const owned = {
      company: companyId,
      companyDomain: "owner.example",
      companyName: "Owner Label",
      companySlug: "owner-label",
    };
    const manual = await payload.create({
      collection: "jobs",
      data: {
        ...owned,
        _status: "published",
        origin: "manual",
        slug: "owner-manual-role",
        title: "Owner Manual Role",
      },
      depth: 0,
      overrideAccess: true,
    });
    const paid = await payload.create({
      collection: "jobs",
      data: {
        ...owned,
        _status: "published",
        origin: "paid",
        slug: "owner-paid-role",
        title: "Owner Paid Role",
      },
      depth: 0,
      overrideAccess: true,
    });

    const renamed = original.map((job) => ({
      ...job,
      company: {
        ...exampleCompany,
        domain: "renamed.example",
        name: "Example Co Renamed",
      },
    }));
    const second = await runFeedSync(payload, { client: feedClient(renamed) });
    expect(second.updated).toBe(0);

    const manualAfter = await payload.findByID({
      collection: "jobs",
      depth: 0,
      id: manual.id,
      overrideAccess: true,
    });
    const paidAfter = await payload.findByID({
      collection: "jobs",
      depth: 0,
      id: paid.id,
      overrideAccess: true,
    });
    const feedAfter = await payload.find({
      collection: "jobs",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { origin: { equals: "bordfeed" } },
    });

    expect(manual.companyName).toBe("Owner Label");
    expect(manual.companyDomain).toBe("example.com");
    expect(manualAfter.companyName).toBe("Owner Label");
    expect(manualAfter.companySlug).toBe(manual.companySlug);
    expect(manualAfter.companyDomain).toBe("example.com");
    expect(manualAfter.updatedAt).toBe(manual.updatedAt);
    expect(paid.companyName).toBe("Owner Label");
    expect(paidAfter.companyName).toBe("Owner Label");
    expect(paidAfter.companySlug).toBe(paid.companySlug);
    expect(paidAfter.companyDomain).toBe(paid.companyDomain);
    expect(paidAfter.updatedAt).toBe(paid.updatedAt);
    expect(feedAfter.docs[0]?.companyName).toBe("Example Co Renamed");
    expect(feedAfter.docs[0]?.companyDomain).toBe("renamed.example");
  });

  test("an empty sample preview keeps the jobs already on the board", async () => {
    await runSampleSync(payload, { client: sampleClient() });
    await expect(
      runSampleSync(payload, { client: sampleClient([]) })
    ).rejects.toBeInstanceOf(SyncGuardError);
    const jobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    const connection = await readConnection(payload);
    expect(jobs.totalDocs).toBe(3);
    expect(connection.state).toBe("error");
    expect(connection.previousState).toBe("sample");
  });

  test("ensureSampleJobs retries a failed first boot when the board is empty", async () => {
    await dispatchConnectionEvent(payload, {
      error: {
        at: "2026-10-23T09:00:00.000Z",
        code: "network",
        message: "Could not reach Bordfeed.",
      },
      type: "sync_failed",
    });
    await ensureSampleJobs(payload);
    expect(previewCalls).toHaveLength(1);
    const jobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    const connection = await readConnection(payload);
    expect(jobs.totalDocs).toBe(3);
    expect(connection.state).toBe("sample");
  });

  test("ensureSampleJobs skips a failed sample after a sync has already landed", async () => {
    await runSampleSync(payload, { client: sampleClient() });
    await payload.delete({
      collection: "jobs",
      depth: 0,
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    await dispatchConnectionEvent(payload, {
      error: {
        at: "2026-10-23T10:00:00.000Z",
        code: "network",
        message: "Could not reach Bordfeed.",
      },
      type: "sync_failed",
    });

    await ensureSampleJobs(payload);
    const jobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    expect(previewCalls).toHaveLength(0);
    expect(jobs.totalDocs).toBe(0);
  });

  test("concurrent first boots seed the sample once and leave the connection in sample", async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => ensureSampleJobs(payload))
    );
    const jobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    const connection = await readConnection(payload);
    expect(previewCalls).toHaveLength(1);
    expect(jobs.totalDocs).toBe(3);
    expect(connection.state).toBe("sample");
    expect(connection.lastSyncAt).not.toBeNull();
  });

  test("ensureSampleJobs records a seed whose success was lost to a racing failure", async () => {
    await runSampleSync(payload, { client: sampleClient() });
    // A losing boot wrote its failure over the winner's success: samples are
    // on the board, the state is error, and no sync is recorded.
    await dispatchConnectionEvent(payload, { type: "reset" });
    await dispatchConnectionEvent(payload, {
      error: {
        at: "2026-10-23T09:00:00.000Z",
        code: "unknown",
        message: "The Bordfeed request failed.",
      },
      type: "sync_failed",
    });
    const before = previewCalls.length;

    await ensureSampleJobs(payload);
    const jobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });
    const connection = await readConnection(payload);
    expect(previewCalls).toHaveLength(before);
    expect(jobs.totalDocs).toBe(3);
    expect(connection.state).toBe("sample");
    expect(connection.lastSyncAt).not.toBeNull();
    const summary = connection.lastSyncSummary as { created?: number } | null;
    expect(summary?.created).toBe(3);
  });

  test("a feed sync that loses the connection does not publish jobs", async () => {
    await connectFeed();
    const jobs = feedJobs(2);
    const client = feedClient(jobs);
    const { fetchFeedPage } = client;
    client.fetchFeedPage = async (feedId, query) => {
      await dispatchConnectionEvent(payload, { type: "reset" });
      return fetchFeedPage(feedId, query);
    };

    const summary = await runFeedSync(payload, { client });
    const bordfeedJobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed" } },
    });
    const connection = await readConnection(payload);
    expect(summary.created).toBe(0);
    expect(bordfeedJobs.totalDocs).toBe(0);
    expect(connection.state).toBe("sample");
    expect(connection.feedId).toBeNull();
  });

  test("cron rejects a missing bearer and runs a sample sync when authorized", async () => {
    const denied = await GET(
      new Request("http://localhost:4130/api/cron/bordfeed")
    );
    expect(denied.status).toBe(401);
    expect(await denied.json()).toEqual({ error: "unauthorized" });

    const allowed = await GET(
      new Request("http://localhost:4130/api/cron/bordfeed", {
        headers: { authorization: `Bearer ${cronSecret}` },
      })
    );
    expect(allowed.status).toBe(200);
    const body = (await allowed.json()) as { ok: boolean; state: string };
    expect(body.ok).toBe(true);
    expect(body.state).toBe("sample");
  });
});
