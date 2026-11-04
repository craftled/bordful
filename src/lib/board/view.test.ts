import { expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { parseBoardQuery } from "./query";
import { buildBoardView } from "./view";

const options = { defaultPerPage: 20 };

function makeCard(
  overrides: Partial<JobListItem> & Pick<JobListItem, "slug" | "title">
): JobListItem {
  return {
    careerLevel: [],
    categories: [],
    companyLogoUrl: null,
    companyName: "Example Co",
    companySlug: null,
    countryCode: null,
    employmentType: null,
    featured: false,
    id: overrides.slug,
    indexable: overrides.origin !== "bordfeed_sample",
    languages: [],
    locationDisplay: null,
    origin: "manual",
    publishedAt: null,
    remoteRegion: null,
    salaryCurrency: null,
    salaryMax: null,
    salaryMaxUsd: null,
    salaryMin: null,
    salaryMinUsd: null,
    seniority: null,
    validThrough: null,
    visaSponsorship: null,
    workplaceType: null,
    ...overrides,
  };
}

const cards = [
  makeCard({
    careerLevel: ["Senior"],
    categories: ["Engineering"],
    companyName: "Example Co",
    countryCode: "US",
    employmentType: "full-time",
    languages: ["en"],
    publishedAt: "2026-10-20T09:00:00.000Z",
    salaryMaxUsd: 160_000,
    salaryMinUsd: 120_000,
    seniority: "senior",
    slug: "a-backend",
    title: "Example Backend Engineer",
    visaSponsorship: "yes",
    workplaceType: "remote",
  }),
  makeCard({
    careerLevel: ["Mid"],
    categories: ["Design", "engineering"],
    companyName: "Acme Example Ltd",
    countryCode: "DE",
    employmentType: "contract",
    featured: true,
    languages: ["de", "en"],
    publishedAt: "2026-10-21T09:00:00.000Z",
    salaryMaxUsd: null,
    salaryMinUsd: null,
    seniority: "mid",
    slug: "b-designer",
    title: "Example Product Designer",
    visaSponsorship: null,
    workplaceType: "hybrid",
  }),
  makeCard({
    careerLevel: ["Entry"],
    companyName: "Example Co",
    countryCode: null,
    employmentType: "full-time",
    languages: [],
    origin: "bordfeed_sample",
    publishedAt: "2026-10-22T09:00:00.000Z",
    salaryMaxUsd: 60_000,
    salaryMinUsd: 45_000,
    seniority: "entry",
    slug: "c-analyst",
    title: "Sample Remote Data Analyst",
    workplaceType: "remote",
  }),
];

function slugs(params: string): string[] {
  const query = parseBoardQuery(new URLSearchParams(params), options);
  return buildBoardView(cards, query).docs.map((card) => card.slug);
}

test("builds the default board view", () => {
  const view = buildBoardView(
    cards,
    parseBoardQuery(new URLSearchParams(""), options)
  );

  expect(view.docs.map((card) => card.slug)).toEqual([
    "c-analyst",
    "b-designer",
    "a-backend",
  ]);
  expect(view.matchCount).toBe(3);
  expect(view.totalPages).toBe(1);
  expect(view.hasFilters).toBe(false);
  expect(view.outOfRange).toBe(false);
  expect(view.facets.types).toEqual([
    { count: 2, value: "full-time" },
    { count: 1, value: "contract" },
  ]);
  expect(view.facets.languages).toEqual([
    { count: 2, value: "en" },
    { count: 1, value: "de" },
  ]);
  expect(view.facets.categories).toEqual([
    { count: 2, label: "Engineering", value: "engineering" },
    { count: 1, label: "Design", value: "design" },
  ]);
  expect(view.facets.featured).toBe(1);
  expect(view.facets.remote).toBe(2);
  expect(view.facets.visa).toBe(1);
});

test("filters the board by type, text, visa, and salary", () => {
  expect(slugs("types=full-time")).toEqual(["c-analyst", "a-backend"]);
  expect(slugs("types=full-time&remote=true")).toEqual([
    "c-analyst",
    "a-backend",
  ]);
  expect(slugs("q=designer")).toEqual(["b-designer"]);
  expect(slugs("q=ACME")).toEqual(["b-designer"]);
  expect(slugs("visa=true")).toEqual(["a-backend"]);
  expect(slugs("salary=%24100K+-+%24200K")).toEqual(["a-backend"]);
  expect(slugs("salary=%3C+%2450K")).toEqual(["c-analyst"]);
  expect(slugs("salary=%2450K+-+%24100K")).toEqual(["c-analyst"]);
  expect(slugs("salary=%3E+%24200K")).toEqual([]);
  expect(
    buildBoardView(
      cards,
      parseBoardQuery(new URLSearchParams("salary=%3E+%24200K"), options)
    ).matchCount
  ).toBe(0);
});

test("sorts oldest and salary with nulls last", () => {
  expect(slugs("sort=oldest")).toEqual([
    "a-backend",
    "b-designer",
    "c-analyst",
  ]);
  expect(slugs("sort=salary")).toEqual([
    "a-backend",
    "c-analyst",
    "b-designer",
  ]);
});

test("salary sort converts a non-USD salary like the salary filter", () => {
  // 100k EUR is above 60k USD once converted, so it sorts above c-analyst.
  const euro = makeCard({
    salaryCurrency: "EUR",
    salaryMax: 100_000,
    salaryMin: 80_000,
    slug: "d-euro",
    title: "Example Euro Engineer",
  });
  const view = buildBoardView(
    [...cards, euro],
    parseBoardQuery(new URLSearchParams("sort=salary"), options)
  );

  expect(view.docs.map((card) => card.slug)).toEqual([
    "a-backend",
    "d-euro",
    "c-analyst",
    "b-designer",
  ]);
});

test("paginates a generated pool and flags pages past the end", () => {
  const base = Date.parse("2026-10-01T00:00:00.000Z");
  const generated = Array.from({ length: 25 }, (_, index) => {
    const n = index + 1;
    const slug = `job-${String(n).padStart(2, "0")}`;
    return makeCard({
      publishedAt: new Date(base + index * 60 * 60 * 1000).toISOString(),
      slug,
      title: slug,
    });
  });
  const pageThree = buildBoardView(
    generated,
    parseBoardQuery(new URLSearchParams("per_page=10&page=3"), options)
  );
  const pageFour = buildBoardView(
    generated,
    parseBoardQuery(new URLSearchParams("per_page=10&page=4"), options)
  );

  expect(pageThree.docs.map((card) => card.slug)).toEqual([
    "job-05",
    "job-04",
    "job-03",
    "job-02",
    "job-01",
  ]);
  expect(pageThree.totalPages).toBe(3);
  expect(pageFour.outOfRange).toBe(true);
  expect(pageFour.docs).toEqual([]);
});

test("filters the board by category and featured", () => {
  expect(slugs("categories=engineering")).toEqual(["b-designer", "a-backend"]);
  expect(slugs("categories=Design")).toEqual(["b-designer"]);
  expect(slugs("categories=design,engineering")).toEqual([
    "b-designer",
    "a-backend",
  ]);
  expect(slugs("featured=true")).toEqual(["b-designer"]);
  expect(slugs("featured=true&categories=data")).toEqual([]);
});

test("text search matches location and the ids Postgres matched on summary or skills", () => {
  const pool = [
    makeCard({
      locationDisplay: "Lisbon, PT",
      slug: "lisbon",
      title: "Designer",
    }),
    makeCard({ remoteRegion: "Europe", slug: "europe", title: "Writer" }),
    makeCard({ slug: "kube", title: "Platform engineer" }),
    makeCard({ slug: "other", title: "Accountant" }),
  ];
  const matched = (q: string, textMatchIds?: string[]) =>
    buildBoardView(pool, {
      ...parseBoardQuery(new URLSearchParams({ q }), options),
      textMatchIds,
    }).docs.map((card) => card.slug);

  expect(matched("lisbon")).toEqual(["lisbon"]);
  expect(matched("EUROPE")).toEqual(["europe"]);
  expect(matched("kubernetes")).toEqual([]);
  expect(matched("kubernetes", ["kube"])).toEqual(["kube"]);
});
