import { expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { filterBoard } from "./filter";
import {
  filterByTaxonomy,
  taxonomyLabel,
  taxonomySearchQuery,
  taxonomyValuesFor,
} from "./taxonomy";

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

const cardA = makeCard({
  careerLevel: ["Senior"],
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
});

const cardB = makeCard({
  careerLevel: ["Mid"],
  companyName: "Acme Example Ltd",
  countryCode: "DE",
  employmentType: "contract",
  languages: ["de", "en"],
  publishedAt: "2026-10-21T09:00:00.000Z",
  seniority: "mid",
  slug: "b-designer",
  title: "Example Product Designer",
  workplaceType: "hybrid",
});

const cardC = makeCard({
  careerLevel: ["Entry"],
  companyName: "Example Co",
  employmentType: "full-time",
  origin: "bordfeed_sample",
  publishedAt: "2026-10-22T09:00:00.000Z",
  salaryMaxUsd: 60_000,
  salaryMinUsd: 45_000,
  seniority: "entry",
  slug: "c-analyst",
  title: "Sample Remote Data Analyst",
  workplaceType: "remote",
});

const cards = [cardA, cardB, cardC];

function slugs(matched: JobListItem[] | null): string[] | null {
  return matched?.map((card) => card.slug) ?? null;
}

test("taxonomyValuesFor lists remote and the country code", () => {
  expect(taxonomyValuesFor(cardA).locations).toEqual(["remote", "us"]);
});

test("filterByTaxonomy matches remote jobs and rejects an unknown type", () => {
  expect(slugs(filterByTaxonomy(cards, "location", "remote"))).toEqual([
    "a-backend",
    "c-analyst",
  ]);
  expect(filterByTaxonomy(cards, "type", "not-a-type")).toBeNull();
});

test("filterByTaxonomy returns no rows for a known type with no jobs", () => {
  expect(filterByTaxonomy(cards, "type", "volunteer")).toEqual([]);
});

test("filterByTaxonomy includes seniority when careerLevel is empty", () => {
  const seniorOnly = makeCard({
    careerLevel: [],
    seniority: "senior",
    slug: "senior-only",
    title: "Senior only",
  });

  expect(slugs(filterByTaxonomy([seniorOnly], "level", "senior"))).toEqual([
    "senior-only",
  ]);
  expect(
    slugs(filterByTaxonomy([seniorOnly, cardA], "level", "senior"))
  ).toEqual(["senior-only", "a-backend"]);
});

test("taxonomyLabel names countries and languages", () => {
  expect(taxonomyLabel("location", "de")).toBe("Germany");
  expect(taxonomyLabel("language", "en")).toBe("English");
});

test("taxonomySearchQuery seeds type, remote and language only", () => {
  expect(taxonomySearchQuery("type", "contract", 2, options)?.types).toEqual([
    "contract",
  ]);
  expect(taxonomySearchQuery("type", "contract", 2, options)?.page).toBe(2);
  expect(taxonomySearchQuery("location", "remote", 1, options)?.remote).toBe(
    true
  );
  expect(taxonomySearchQuery("language", "en", 1, options)?.languages).toEqual([
    "en",
  ]);
  expect(taxonomySearchQuery("location", "us", 1, options)).toBeNull();
  expect(taxonomySearchQuery("level", "senior", 1, options)).toBeNull();

  const query = taxonomySearchQuery("type", "full-time", 1, options);
  expect(query).not.toBeNull();
  if (query === null) {
    return;
  }
  expect(filterBoard(cards, query).map((card) => card.slug)).toEqual(
    slugs(filterByTaxonomy(cards, "type", "full-time"))
  );
});
