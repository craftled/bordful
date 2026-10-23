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
import type { Job, User } from "@/payload-types";
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

const STAFF_PASSWORD = "Example-Passw0rd-123";

let adminUser: User;
let editorUser: User;

beforeAll(async () => {
  await payload.db.migrateFresh({ forceAcceptWarning: true });
  await loadBoardFixture(payload);
  adminUser = await payload.create({
    collection: "users",
    data: {
      email: "admin@example.com",
      password: STAFF_PASSWORD,
      roles: ["admin"],
    },
    depth: 0,
    overrideAccess: true,
  });
  editorUser = await payload.create({
    collection: "users",
    data: {
      email: "editor@example.com",
      password: STAFF_PASSWORD,
      roles: ["editor"],
    },
    depth: 0,
    overrideAccess: true,
  });
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
  expect(result.docs).toHaveLength(1);
  expect(result.docs[0]?.paymentReference).toBeUndefined();
});

test("an editor can feature a sample job and cannot retitle it", async () => {
  const found = await payload.find({
    collection: "jobs",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: "sample-remote-data-analyst" } },
  });
  expect(found.docs).toHaveLength(1);
  const [sample] = found.docs;
  if (!sample) {
    throw new Error("missing sample job");
  }

  const featured = await payload.update({
    collection: "jobs",
    data: { featured: true },
    depth: 0,
    id: sample.id,
    overrideAccess: false,
    user: editorUser,
  });
  expect(featured.featured).toBe(true);

  const retitled = await payload.update({
    collection: "jobs",
    data: { title: "Changed Sample Title" },
    depth: 0,
    id: sample.id,
    overrideAccess: false,
    user: editorUser,
  });
  expect(retitled.title).toBe("Sample Remote Data Analyst");
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
    payload.findVersions({
      collection: "jobs",
      depth: 0,
      overrideAccess: false,
      user: editorUser,
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

  await payload.updateGlobal({
    data: { previousState: "sample", state: "connected" },
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });
  await payload.updateGlobal({
    data: { showAttribution: false },
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });

  const connected = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });
  expect(connected.state).toBe("connected");
  expect(connected.showAttribution).toBe(false);

  await payload.updateGlobal({
    data: {
      lastError: { message: "example sync failure" },
      previousState: "connected",
      state: "error",
    },
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });

  const errored = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });
  expect(errored.state).toBe("error");
  expect(errored.previousState).toBe("connected");
  expect(errored.showAttribution).toBe(false);
});

test("an admin cannot write bordfeed connection machine fields", async () => {
  await payload.updateGlobal({
    data: { showAttribution: true, state: "sample" },
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });

  await payload.updateGlobal({
    data: { state: "connected" },
    depth: 0,
    overrideAccess: false,
    slug: "bordfeed-connection",
    user: adminUser,
  });

  const doc = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });
  expect(doc.state).toBe("sample");
});

test("ensureInstallId is stable", async () => {
  const first = await ensureInstallId(payload);
  const second = await ensureInstallId(payload);
  expect(first).toMatch(INSTALL_ID);
  expect(second).toBe(first);
});

test("an editor cannot write bordfeed identity fields on manual rows", async () => {
  const jobs = await payload.find({
    collection: "jobs",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: "example-senior-backend-engineer" } },
  });
  const [job] = jobs.docs;
  if (!job) {
    throw new Error("missing manual job");
  }

  await payload.update({
    collection: "jobs",
    data: {
      bordfeedDescriptionHash: "h2",
      bordfeedJobId: "22222222-2222-4222-8222-222222222222",
    },
    depth: 0,
    id: job.id,
    overrideAccess: false,
    user: editorUser,
  });

  const storedJob = await payload.findByID({
    collection: "jobs",
    depth: 0,
    id: job.id,
    overrideAccess: true,
    showHiddenFields: true,
  });
  expect(storedJob.bordfeedJobId).toBeNull();
  expect(storedJob.bordfeedDescriptionHash).toBeNull();

  const companies = await payload.find({
    collection: "companies",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: "example-co" } },
  });
  const [company] = companies.docs;
  if (!company) {
    throw new Error("missing manual company");
  }

  await payload.update({
    collection: "companies",
    data: { bordfeedCompanyId: "33333333-3333-4333-8333-333333333333" },
    depth: 0,
    id: company.id,
    overrideAccess: false,
    user: editorUser,
  });

  const storedCompany = await payload.findByID({
    collection: "companies",
    depth: 0,
    id: company.id,
    overrideAccess: true,
  });
  expect(storedCompany.bordfeedCompanyId).toBeNull();
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
