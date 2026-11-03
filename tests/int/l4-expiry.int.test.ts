import { existsSync } from "node:fs";

import { afterAll, beforeAll, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

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

// The integration job does not set CRON_SECRET. The route reads it per request.
const cronSecret =
  process.env.CRON_SECRET || ["int-cron-secret", "0123456789"].join("-");
process.env.CRON_SECRET = cronSecret;

import type { Job } from "@/payload-types";
import { exampleDescription } from "../fixtures/board";
import { loadBoardFixture } from "../fixtures/load";

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const { expireJobs } = await import("@/jobs/expire-job");
const { GET } = await import("@/app/api/cron/expire/route");

const payload = await getPayload({ config });

const DAY_MS = 86_400_000;
const SWEEP_AT = "2098-06-01T09:00:01.000Z";

function plusDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();
}

function isoOf(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function readJob(id: number, draft: boolean): Promise<Job> {
  return payload.findByID({
    collection: "jobs",
    depth: 0,
    draft,
    id,
    overrideAccess: true,
  });
}

function createJob(data: {
  _status: "draft" | "published";
  origin: "manual" | "paid";
  publishedAt?: string;
  slug: string;
  title: string;
  validThrough?: string;
}): Promise<Job> {
  return payload.create({
    collection: "jobs",
    data: {
      companyName: "Example Co",
      description: exampleDescription as NonNullable<Job["description"]>,
      ...data,
    },
    depth: 0,
    overrideAccess: true,
  });
}

beforeAll(async () => {
  await payload.db.migrateFresh({ forceAcceptWarning: true });
  await payload.updateGlobal({
    data: {
      postJob: {
        durationDays: 14,
        enabled: false,
        paymentLinkUrl: "",
        priceLabel: "",
      },
    },
    depth: 0,
    overrideAccess: true,
    slug: "site-settings",
  });
  await loadBoardFixture(payload);
});

afterAll(async () => {
  await payload.destroy();
});

test("a published paid job expires durationDays after publishedAt", async () => {
  const created = await createJob({
    _status: "published",
    origin: "paid",
    slug: "example-paid-board-listing",
    title: "Example Paid Board Listing",
  });
  const stored = await readJob(created.id, false);
  const publishedAt = isoOf(stored.publishedAt);
  if (publishedAt === null) {
    throw new Error("publishedAt was not stamped");
  }
  expect(isoOf(stored.validThrough)).toBe(plusDays(publishedAt, 14));
});

test("publishing a paid draft stamps validThrough from the new publishedAt", async () => {
  const draft = await createJob({
    _status: "draft",
    origin: "paid",
    slug: "example-paid-draft-listing",
    title: "Example Paid Draft Listing",
  });
  const storedDraft = await readJob(draft.id, true);
  expect(storedDraft.publishedAt ?? null).toBeNull();
  expect(storedDraft.validThrough ?? null).toBeNull();

  await payload.update({
    collection: "jobs",
    data: { _status: "published" },
    depth: 0,
    id: draft.id,
    overrideAccess: true,
  });
  const published = await readJob(draft.id, false);
  const publishedAt = isoOf(published.publishedAt);
  if (publishedAt === null) {
    throw new Error("publishedAt was not stamped");
  }
  expect(isoOf(published.validThrough)).toBe(plusDays(publishedAt, 14));
});

test("expireJobs unpublishes only listings due at the sweep instant", async () => {
  // Paid rows published during this run are due before the fixed sweep date.
  const alreadyDue = await payload.find({
    collection: "jobs",
    depth: 0,
    draft: false,
    limit: 100,
    overrideAccess: true,
    where: {
      and: [
        { _status: { equals: "published" } },
        { validThrough: { less_than_equal: SWEEP_AT } },
      ],
    },
  });
  await Promise.all(
    alreadyDue.docs.map((doc) =>
      payload.update({
        collection: "jobs",
        data: { _status: "draft" },
        depth: 0,
        id: doc.id,
        overrideAccess: true,
      })
    )
  );

  const due = await createJob({
    _status: "published",
    origin: "manual",
    publishedAt: "2026-10-20T09:00:00.000Z",
    slug: "example-manual-due",
    title: "Example Manual Due",
    validThrough: "2098-06-01T09:00:00.000Z",
  });
  const later = await createJob({
    _status: "published",
    origin: "manual",
    publishedAt: "2026-10-20T09:00:00.000Z",
    slug: "example-manual-later",
    title: "Example Manual Later",
    validThrough: "2098-06-01T09:00:02.000Z",
  });

  const first = await expireJobs(payload, new Date(SWEEP_AT));
  expect(first.unpublished).toBe(1);
  expect(first.ids).toEqual([String(due.id)]);
  expect((await readJob(due.id, true))._status).toBe("draft");
  expect((await readJob(later.id, false))._status).toBe("published");

  const second = await expireJobs(payload, new Date(SWEEP_AT));
  expect(second.unpublished).toBe(0);
  expect(second.ids).toEqual([]);
});

test("the paid fixture with an explicit validThrough stays published", async () => {
  const found = await payload.find({
    collection: "jobs",
    depth: 0,
    draft: false,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: "example-product-designer" } },
  });
  const [fixture] = found.docs;
  expect(fixture).toBeDefined();
  expect(isoOf(fixture?.validThrough)).toBe("2099-01-01T00:00:00.000Z");
  expect(fixture?._status).toBe("published");
});

async function callExpireCron(): Promise<{
  now: string;
  ok: boolean;
  unpublished: number;
}> {
  const response = await GET(
    new Request(`http://localhost/api/cron/expire?now=${SWEEP_AT}`, {
      headers: { authorization: `Bearer ${cronSecret}` },
    })
  );
  expect(response.status).toBe(200);
  return response.json() as Promise<{
    now: string;
    ok: boolean;
    unpublished: number;
  }>;
}

test("the expire cron honors the test clock and ignores now without it", async () => {
  const due = await payload.find({
    collection: "jobs",
    depth: 0,
    draft: true,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: "example-manual-due" } },
  });
  const dueId = due.docs[0]?.id;
  if (typeof dueId !== "number") {
    throw new Error("example-manual-due was not created");
  }

  await payload.update({
    collection: "jobs",
    data: { _status: "published" },
    depth: 0,
    id: dueId,
    overrideAccess: true,
  });

  process.env.BORDFUL_TEST_CLOCK = "true";
  const clocked = await callExpireCron();
  expect(clocked).toEqual({
    now: SWEEP_AT,
    ok: true,
    unpublished: 1,
  });
  expect((await readJob(dueId, true))._status).toBe("draft");

  await payload.update({
    collection: "jobs",
    data: { _status: "published" },
    depth: 0,
    id: dueId,
    overrideAccess: true,
  });

  delete process.env.BORDFUL_TEST_CLOCK;
  const live = await callExpireCron();
  expect(live.ok).toBe(true);
  expect(live.unpublished).toBe(0);
  expect(live.now).not.toBe(SWEEP_AT);
  expect((await readJob(dueId, false))._status).toBe("published");
});
