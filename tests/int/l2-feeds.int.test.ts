import { existsSync } from "node:fs";

import { afterAll, beforeAll, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

import { queryFeedJobs, querySitemapJobs } from "@/lib/seo/queries";
import type { Job } from "@/payload-types";
import { exampleDescription } from "../fixtures/board";
import { loadBoardFixture } from "../fixtures/load";

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

beforeAll(async () => {
  await payload.db.migrateFresh({ forceAcceptWarning: true });
  await loadBoardFixture(payload);
  await payload.create({
    collection: "jobs",
    data: {
      _status: "draft",
      companyName: "Example Co",
      description: exampleDescription as NonNullable<Job["description"]>,
      origin: "manual",
      slug: "example-draft-role",
      title: "Example Draft Role",
    },
    depth: 0,
    overrideAccess: true,
  });
  await payload.create({
    collection: "jobs",
    data: {
      _status: "published",
      companyName: "Example Co",
      description: exampleDescription as NonNullable<Job["description"]>,
      origin: "manual",
      publishedAt: "2020-01-01T00:00:00.000Z",
      slug: "example-expired-role",
      title: "Example Expired Role",
      validThrough: "2020-01-01T00:00:00.000Z",
    },
    depth: 0,
    overrideAccess: true,
  });
});

afterAll(async () => {
  await payload.destroy();
});

test("feeds and the sitemap skip sample, draft, and expired jobs", async () => {
  const feed = await queryFeedJobs(payload);
  expect(feed.map((job) => job.slug)).toEqual([
    "example-product-designer",
    "example-senior-backend-engineer",
  ]);
  expect(feed.map((job) => job.descriptionText)).toEqual([
    "Example description.",
    "Example description.",
  ]);

  const sitemap = await querySitemapJobs(payload);
  expect(sitemap.map((job) => job.slug)).toEqual([
    "example-product-designer",
    "example-senior-backend-engineer",
  ]);
});
