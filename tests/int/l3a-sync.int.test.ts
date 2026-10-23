import { existsSync } from "node:fs";

import { beforeEach, describe, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

import type { BordfeedClient } from "@/lib/bordfeed/client";
import {
  dispatchConnectionEvent,
  readConnection,
} from "@/lib/bordfeed/connection-store";
import { SyncGuardError } from "@/lib/bordfeed/errors";
import type { BordfeedJob } from "@/lib/bordfeed/job-schema";
import { sealApiKey } from "@/lib/bordfeed/key";
import { ensureSampleJobs } from "@/lib/bordfeed/sample";
import { runFeedSync, runSampleSync } from "@/lib/bordfeed/sync";
import { isEncryptedEnvelope } from "@/lib/crypto/secret-box";
import { queryPublishedJobs } from "@/lib/read/queries";

const FEED_ID = "11111111-1111-4111-8111-111111111111";
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
      description: "Engineering roles.",
      filters: {},
      id: "engineering-it",
      name: "Engineering and IT",
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

function pagesOf(jobs: BordfeedJob[], size: number): BordfeedJob[][] {
  const pages: BordfeedJob[][] = [];
  for (let index = 0; index < jobs.length; index += size) {
    pages.push(jobs.slice(index, index + size));
  }

  return pages;
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

const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
if (!(databaseName.endsWith("_int") || databaseName.endsWith("_test"))) {
  throw new Error("DATABASE_URL_TEST database must end with _int or _test");
}

process.env.DATABASE_URL = databaseUrl;

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const { GET } = await import("@/app/api/cron/bordfeed/route");

const payload = await getPayload({ config });

function unused<T>(): Promise<T> {
  return Promise.reject(new Error("unused"));
}

function sampleClient(jobs: BordfeedJob[] = sampleJobs()): BordfeedClient {
  return {
    createFeed: () => Promise.resolve({ id: FEED_ID }),
    async *listFeedJobs() {
      await Promise.resolve();
      yield [];
    },
    listTemplates: unused,
    previewTemplate: () => Promise.resolve(previewBody(jobs)),
    register: unused,
    verify: unused,
  };
}

function feedClient(jobs: BordfeedJob[]): BordfeedClient {
  const pages = pagesOf(jobs, 10);
  return {
    createFeed: () => Promise.resolve({ id: FEED_ID }),
    async *listFeedJobs() {
      await Promise.resolve();
      for (const page of pages) {
        yield page;
      }
    },
    listTemplates: unused,
    previewTemplate: () => Promise.resolve(previewBody([])),
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

  test("feed sync publishes, unpublishes missing rows, and guards an empty feed", async () => {
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
    expect(first.pages).toBe(3);
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

    const second = await runFeedSync(payload, {
      client: feedClient(connectedJobs.slice(0, 23)),
    });
    const published = await queryPublishedJobs(payload, { limit: 50, page: 1 });
    expect(second.unpublished).toBe(2);
    expect(published.totalDocs).toBe(23);

    await expect(
      runFeedSync(payload, { client: feedClient([]) })
    ).rejects.toBeInstanceOf(SyncGuardError);
    const afterGuard = await readConnection(payload);
    const stillPublished = await queryPublishedJobs(payload, {
      limit: 50,
      page: 1,
    });
    expect(afterGuard.state).toBe("error");
    expect(afterGuard.previousState).toBe("connected");
    expect(stillPublished.totalDocs).toBe(23);
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

  test("a feed sync that loses the connection does not publish jobs", async () => {
    await connectFeed();
    const jobs = feedJobs(2);
    const client = feedClient(jobs);
    const { listFeedJobs } = client;
    client.listFeedJobs = async function* listFeedJobsAfterReset(feedId) {
      await dispatchConnectionEvent(payload, { type: "reset" });
      yield* listFeedJobs.call(client, feedId);
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
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new Error("CRON_SECRET is required for test:int");
    }

    const denied = await GET(
      new Request("http://localhost:4130/api/cron/bordfeed")
    );
    expect(denied.status).toBe(401);
    expect(await denied.json()).toEqual({ error: "unauthorized" });

    const allowed = await GET(
      new Request("http://localhost:4130/api/cron/bordfeed", {
        headers: { authorization: `Bearer ${secret}` },
      })
    );
    expect(allowed.status).toBe(200);
    const body = (await allowed.json()) as { ok: boolean; state: string };
    expect(body.ok).toBe(true);
    expect(body.state).toBe("sample");
  });
});
