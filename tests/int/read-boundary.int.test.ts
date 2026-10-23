import { existsSync } from "node:fs";

import { afterAll, beforeAll, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";
import { ensureInstallId } from "@/lib/install/install-id";
import {
  queryBordfeedConnectionPublic,
  queryCompanies,
  queryCompanyBySlug,
  queryJobBySlug,
  queryPublishedJobs,
  querySiteSettings,
} from "@/lib/read/queries";
import type { Job } from "@/payload-types";
import { exampleDescription } from "../fixtures/board";
import { loadBoardFixture } from "../fixtures/load";

const INSTALL_ID = /^[a-f0-9]{64}$/;

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

test("published jobs are the three public rows, newest first", async () => {
  const page = await queryPublishedJobs(payload, { limit: 20, page: 1 });
  expect(page.items.map((job) => job.slug)).toEqual([
    "sample-remote-data-analyst",
    "example-product-designer",
    "example-senior-backend-engineer",
  ]);
  expect(page.totalDocs).toBe(3);
  expect(page.items.map((job) => job.indexable)).toEqual([false, true, true]);
});

test("draft and expired jobs are not publicly readable", async () => {
  expect(await queryJobBySlug(payload, "example-draft-role")).toBeNull();
  expect(await queryJobBySlug(payload, "example-expired-role")).toBeNull();
});

test("payment references stay off the public job document", async () => {
  const result = await payload.find({
    collection: "jobs",
    depth: 0,
    overrideAccess: false,
    where: { slug: { equals: "example-product-designer" } },
  });
  expect(result.docs[0]?.paymentReference).toBeUndefined();
});

test("anonymous callers cannot read versions or alert subscribers", async () => {
  await expect(
    payload.findVersions({
      collection: "jobs",
      depth: 0,
      overrideAccess: false,
    })
  ).rejects.toThrow();
  await expect(
    payload.find({
      collection: "alert-subscribers",
      depth: 0,
      overrideAccess: false,
    })
  ).rejects.toThrow();
});

test("the public bordfeed connection is the sample default", async () => {
  expect(await queryBordfeedConnectionPublic(payload)).toEqual({
    lastSyncAt: null,
    showAttribution: true,
    state: "sample",
    templateId: "remote-engineering",
  });
});

test("attribution cannot be hidden and plaintext keys are refused", async () => {
  await expect(
    payload.updateGlobal({
      data: { showAttribution: false },
      depth: 0,
      overrideAccess: true,
      slug: "bordfeed-connection",
    })
  ).rejects.toMatchObject({ name: "ValidationError" });

  await expect(
    payload.updateGlobal({
      data: { apiKeyEncrypted: "plaintext-key" },
      depth: 0,
      overrideAccess: true,
      slug: "bordfeed-connection",
    })
  ).rejects.toMatchObject({ name: "ValidationError" });

  const encrypted = encryptSecret(payload, "bf_test_key_0000");
  await payload.updateGlobal({
    data: { apiKeyEncrypted: encrypted },
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });

  const hidden = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    slug: "bordfeed-connection",
  });
  expect(decryptSecret(payload, String(hidden.apiKeyEncrypted))).toBe(
    "bf_test_key_0000"
  );

  const publicDoc = await payload.findGlobal({
    depth: 0,
    overrideAccess: false,
    slug: "bordfeed-connection",
  });
  expect(publicDoc).not.toHaveProperty("apiKeyEncrypted");
});

test("ensureInstallId is stable", async () => {
  const first = await ensureInstallId(payload);
  const second = await ensureInstallId(payload);
  expect(first).toMatch(INSTALL_ID);
  expect(second).toBe(first);
});

test("site settings and companies use the public defaults", async () => {
  const settings = await querySiteSettings(payload);
  expect(settings.postJob).toEqual({
    durationDays: 30,
    enabled: false,
    paymentLinkUrl: "",
    priceLabel: "",
  });
  expect(settings.alerts.defaultFrequency).toBe("weekly");

  const companies = await queryCompanies(payload, { limit: 20, page: 1 });
  expect(companies.items.map((company) => company.name).sort()).toEqual([
    "Acme Example Ltd",
    "Example Co",
  ]);
  expect((await queryCompanyBySlug(payload, "example-co"))?.domain).toBe(
    "example.com"
  );
});
