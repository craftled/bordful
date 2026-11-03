import { existsSync } from "node:fs";

import { afterAll, beforeAll, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_TEST is required for test:int");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\//u, "");
if (!(databaseName.endsWith("_int") || databaseName.endsWith("_test"))) {
  throw new Error(
    `DATABASE_URL_TEST database must end with _int or _test (${databaseName})`
  );
}

process.env.DATABASE_URL = databaseUrl;

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const { querySimilarJobs } = await import("@/lib/detail/queries");
const { toJobListItem } = await import("@/lib/read/mappers");
const { exampleDescription } = await import("../fixtures/board");

const payload = await getPayload({ config });

const BERLIN = "Berlin, Germany";

// The ranking rules have unit tests in similar.test.ts; these cover the query.
function createJob(data: Record<string, unknown>) {
  return payload.create({
    collection: "jobs",
    data: {
      _status: "published",
      categories: ["Engineering"],
      companyName: "Acme",
      description: exampleDescription as never,
      employmentType: "full-time",
      locationDisplay: BERLIN,
      origin: "manual",
      publishedAt: "2026-10-01T00:00:00.000Z",
      ...data,
    } as never,
    depth: 0,
    overrideAccess: true,
  });
}

let current: Awaited<ReturnType<typeof createJob>>;

beforeAll(async () => {
  await payload.db.migrateFresh({ forceAcceptWarning: true });
  current = await createJob({ slug: "similar-current", title: "Current Role" });
  await createJob({
    companyName: "Beta",
    slug: "similar-match",
    title: "Match Role",
  });
  await createJob({
    _status: "draft",
    companyName: "Gamma",
    slug: "similar-draft",
    title: "Draft Role",
  });
  await createJob({
    companyName: "Delta",
    slug: "similar-expired",
    title: "Expired Role",
    validThrough: "2020-01-01T00:00:00.000Z",
  });
  await createJob({
    companyName: "Epsilon",
    origin: "bordfeed_sample",
    slug: "similar-sample",
    title: "Sample Role",
  });
  await createJob({
    companyName: "Zeta",
    locationDisplay: "Paris, France",
    slug: "similar-paris",
    title: "Paris Role",
  });
});

afterAll(async () => {
  await payload.destroy();
});

test("lists only published, same-location jobs and never the current job", async () => {
  const result = await querySimilarJobs(payload, toJobListItem(current), false);
  expect(result.map((job) => job.slug)).toEqual(["similar-match"]);
});

test("sample jobs appear only when the board shows samples", async () => {
  const result = await querySimilarJobs(payload, toJobListItem(current), true);
  // Both jobs share a publishedAt, so their order is a tie-break and not checked here.
  expect(result.map((job) => job.slug).sort()).toEqual([
    "similar-match",
    "similar-sample",
  ]);
});

test("a job without a location gets no similar jobs", async () => {
  const noLocation = await createJob({
    companyName: "Eta",
    locationDisplay: null,
    slug: "similar-remote",
    title: "Remote Role",
  });
  const result = await querySimilarJobs(
    payload,
    toJobListItem(noLocation),
    false
  );
  expect(result).toEqual([]);
});
