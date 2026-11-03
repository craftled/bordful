import { expect, test } from "vitest";

import type { LexicalRoot } from "./html-to-lexical";
import type { MappedCompany } from "./map-company";
import type { MappedJob } from "./map-job";
import { comparableJobFields, type ExistingRow, planSync } from "./planner";

const description: LexicalRoot = {
  root: {
    children: [],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

function job(
  id: string,
  hash: string,
  origin: MappedJob["origin"] = "bordfeed"
): MappedJob {
  return {
    applyEmail: null,
    applyMethod: null,
    applyUrl: null,
    bordfeedDescriptionHash: hash,
    bordfeedJobId: id,
    careerLevel: [],
    categories: [],
    company: null,
    countryCode: null,
    description,
    employmentType: "full-time",
    languages: [],
    locality: null,
    locationDisplay: null,
    origin,
    publishedAt: null,
    region: null,
    remoteRegion: null,
    salaryCurrency: null,
    salaryMax: null,
    salaryMaxUsd: null,
    salaryMin: null,
    salaryMinUsd: null,
    seniority: null,
    slug: id,
    sourceListingUrl: null,
    title: id,
    validThrough: null,
    visaSponsorship: null,
    workplaceType: "remote",
  };
}

function row(
  id: string,
  bordfeedJobId: string | null,
  origin: ExistingRow["origin"],
  status: ExistingRow["status"],
  hash: string | null,
  source: MappedJob
): ExistingRow {
  return {
    bordfeedJobId,
    fields: comparableJobFields(source),
    hash,
    id,
    origin,
    slug: source.slug,
    status,
  };
}

test("feed planning removes missing rows and is idempotent", () => {
  const j1 = job("j1", "h1");
  const j3 = job("j3", "h3");
  const existing = [
    row("id-j1", "j1", "bordfeed", "published", "h1", j1),
    row("id-j2", "j2", "bordfeed", "published", "h2", job("j2", "h2")),
    row(
      "id-s1",
      "s1",
      "bordfeed_sample",
      "published",
      "hs",
      job("s1", "hs", "bordfeed_sample")
    ),
    row("id-manual", null, "manual", "published", null, job("manual", "hm")),
  ];
  const incoming = [j1, j3];
  const plan = planSync({
    existing,
    incoming,
    mode: "feed",
    takenSlugs: new Set(existing.map((item) => item.slug)),
  });

  expect(plan.create.map((item) => item.bordfeedJobId)).toEqual(["j3"]);
  expect(plan.update).toEqual([]);
  expect(plan.unpublish).toEqual(["id-j2"]);
  expect(plan.deleteIds).toEqual(["id-s1"]);
  expect(plan.skipped).toBe(0);
  expect(plan.deleteIds).not.toContain("id-manual");
  expect(plan.unpublish).not.toContain("id-manual");

  const applied: ExistingRow[] = [
    existing[0] as ExistingRow,
    { ...existing[1], status: "draft" } as ExistingRow,
    existing[3] as ExistingRow,
    row(
      "id-j3",
      "j3",
      "bordfeed",
      "published",
      "h3",
      plan.create[0] as MappedJob
    ),
  ];
  expect(
    planSync({
      existing: applied,
      incoming,
      mode: "feed",
      takenSlugs: new Set(applied.map((item) => item.slug)),
    })
  ).toEqual({
    create: [],
    deleteIds: [],
    skipped: 0,
    unpublish: [],
    update: [],
  });
});

test("a draft that reappears is republished", () => {
  const j2 = job("j2", "h2");
  const plan = planSync({
    existing: [row("id-j2", "j2", "bordfeed", "draft", "h2", j2)],
    incoming: [j2],
    mode: "feed",
    takenSlugs: new Set(["j2"]),
  });

  expect(plan.update).toEqual([{ data: {}, id: "id-j2", republish: true }]);
});

test("sample mode leaves bordfeed rows alone", () => {
  const sample = job("s2", "h", "bordfeed_sample");
  const plan = planSync({
    existing: [
      row("id-b", "b1", "bordfeed", "published", "hb", job("b1", "hb")),
      row(
        "id-s",
        "s1",
        "bordfeed_sample",
        "published",
        "hs",
        job("s1", "hs", "bordfeed_sample")
      ),
    ],
    incoming: [sample],
    mode: "sample",
    takenSlugs: new Set(["b1", "s1"]),
  });

  expect(plan.deleteIds).toEqual(["id-s"]);
  expect(plan.unpublish).toEqual([]);
  expect(plan.update.map((item) => item.id)).not.toContain("id-b");
  expect(plan.create.map((item) => item.bordfeedJobId)).toEqual(["s2"]);
});

test("a persistent slug collision plans once and then stays empty", () => {
  const incoming = job("abcdef12-0000-4000-8000-000000000001", "h1");
  incoming.slug = "engineer";
  const manual = job("manual", "hm");
  manual.slug = "engineer";
  const existing = [
    row("id-manual", null, "manual", "published", null, manual),
  ];
  const first = planSync({
    existing,
    incoming: [incoming],
    mode: "feed",
    takenSlugs: new Set(existing.map((item) => item.slug)),
  });
  expect(first.create.map((item) => item.slug)).toEqual(["engineer-abcdef12"]);
  expect(first.update).toEqual([]);

  const created = first.create[0] as MappedJob;
  const applied = [
    existing[0] as ExistingRow,
    row(
      "id-job",
      created.bordfeedJobId,
      "bordfeed",
      "published",
      "h1",
      created
    ),
  ];
  expect(
    planSync({
      existing: applied,
      incoming: [incoming],
      mode: "feed",
      takenSlugs: new Set(applied.map((item) => item.slug)),
    })
  ).toEqual({
    create: [],
    deleteIds: [],
    skipped: 0,
    unpublish: [],
    update: [],
  });
});

test("a doubled collision slug is not rewritten on the next plan", () => {
  const incoming = job("abcdef12-0000-4000-8000-000000000001", "h1");
  incoming.slug = "engineer";
  const stored = { ...incoming, slug: "engineer-abcdef12-abcdef12" };
  const manual = job("manual", "hm");
  manual.slug = "engineer";
  const existing = [
    row("id-manual", null, "manual", "published", null, manual),
    row("id-job", stored.bordfeedJobId, "bordfeed", "published", "h1", stored),
  ];
  const plan = planSync({
    existing,
    incoming: [incoming],
    mode: "feed",
    takenSlugs: new Set(existing.map((item) => item.slug)),
  });

  expect(plan.create).toEqual([]);
  expect(plan.update).toEqual([]);
});

test("reused company rows compare by relation id", () => {
  const company: MappedCompany = {
    bordfeedCompanyId: "company-x",
    domain: "example.com",
    logoUrl: null,
    name: "Example Co",
    slug: "example-co",
  };
  const incoming = job("j1", "h1");
  incoming.company = company;
  const existing = row("id-j1", "j1", "bordfeed", "published", "h1", incoming);
  existing.fields = { ...existing.fields, companyKey: "rel:7" };
  const plan = planSync({
    companyIds: new Map([["id:company-x", 7]]),
    existing: [existing],
    incoming: [incoming],
    mode: "feed",
    takenSlugs: new Set([incoming.slug]),
  });

  expect(plan.update).toEqual([]);
  expect(plan.create).toEqual([]);
});
