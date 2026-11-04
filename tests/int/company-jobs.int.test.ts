import { existsSync } from "node:fs";

import { beforeAll, expect, test } from "vitest";

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

const payload = await getPayload({ config });

function createCompany(slug: string, domain: string) {
  return payload.create({
    collection: "companies",
    data: { domain, name: slug, origin: "manual", slug },
    depth: 0,
    overrideAccess: true,
  });
}

function createJob(slug: string, companyId: number) {
  return payload.create({
    collection: "jobs",
    data: {
      _status: "published",
      company: companyId,
      companyName: "Owner Text",
      origin: "manual",
      publishedAt: "2026-10-01T00:00:00.000Z",
      slug,
      title: slug,
    },
    depth: 0,
    draft: false,
    overrideAccess: true,
  });
}

function readJob(id: number) {
  return payload.findByID({
    collection: "jobs",
    depth: 0,
    draft: false,
    id,
    overrideAccess: true,
  });
}

function countVersions(id: number) {
  return payload
    .countVersions({
      collection: "jobs",
      overrideAccess: true,
      where: { parent: { equals: id } },
    })
    .then((result) => result.totalDocs);
}

beforeAll(async () => {
  await payload.db.migrateFresh({ forceAcceptWarning: true });
});

test("a company slug or domain change reaches its jobs, owner text stays", async () => {
  const company = await createCompany("old-co", "old.example");
  const job = await createJob("old-co-role", company.id);
  expect(job.companySlug).toBe("old-co");
  expect(job.companyDomain).toBe("old.example");

  await payload.update({
    collection: "companies",
    data: { domain: "new.example", name: "Renamed Co", slug: "new-co" },
    depth: 0,
    id: company.id,
    overrideAccess: true,
  });

  const after = await readJob(job.id);
  expect(after.companySlug).toBe("new-co");
  expect(after.companyDomain).toBe("new.example");
  expect(after.companyName).toBe("Owner Text");
});

test("a company edit that keeps slug and domain does not version its jobs", async () => {
  const company = await createCompany("steady-co", "steady.example");
  const job = await createJob("steady-co-role", company.id);
  const before = await countVersions(job.id);

  await payload.update({
    collection: "companies",
    data: { industry: "Software" },
    depth: 0,
    id: company.id,
    overrideAccess: true,
  });

  expect(await countVersions(job.id)).toBe(before);
});

test("deleting a company clears the company link on its jobs", async () => {
  const company = await createCompany("gone-co", "gone.example");
  const job = await createJob("gone-co-role", company.id);

  await payload.delete({
    collection: "companies",
    id: company.id,
    overrideAccess: true,
  });

  const after = await readJob(job.id);
  expect(after.company ?? null).toBeNull();
  expect(after.companySlug ?? null).toBeNull();
  expect(after.companyDomain ?? null).toBeNull();
  expect(after.companyName).toBe("Owner Text");
  expect(after._status).toBe("published");
});

test("a draft saved before a slug change publishes the new slug", async () => {
  const company = await createCompany("draft-co", "draft.example");
  const job = await createJob("draft-co-role", company.id);
  // An editor's pending draft still carries the old derived values.
  await payload.update({
    collection: "jobs",
    data: { company: company.id, companySlug: "draft-co", title: "Edited" },
    depth: 0,
    draft: true,
    id: job.id,
    overrideAccess: true,
  });
  await payload.update({
    collection: "companies",
    data: { slug: "draft-co-renamed" },
    depth: 0,
    id: company.id,
    overrideAccess: true,
  });

  const published = await payload.update({
    collection: "jobs",
    data: {
      _status: "published",
      company: company.id,
      companySlug: "draft-co",
    },
    depth: 0,
    id: job.id,
    overrideAccess: true,
  });
  expect(published.companySlug).toBe("draft-co-renamed");
});
