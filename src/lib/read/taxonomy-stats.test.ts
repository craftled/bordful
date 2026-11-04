import { expect, test } from "vitest";

import { JOB_EMPLOYMENT_TYPES } from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

import {
  relatedTaxonomy,
  rolesWithTaxonomy,
  TYPE_DESCRIPTION,
} from "./taxonomy-stats";

function makeCard(
  overrides: Partial<JobListItem> & Pick<JobListItem, "slug">
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
    indexable: true,
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
    title: "Example role",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: null,
    ...overrides,
  };
}

const cards = [
  makeCard({ careerLevel: ["Entry"], slug: "a" }),
  makeCard({ careerLevel: ["Mid"], employmentType: "contract", slug: "b" }),
  makeCard({ seniority: "senior", slug: "c" }),
  makeCard({
    careerLevel: ["Lead"],
    employmentType: "full-time",
    languages: ["en"],
    slug: "d",
  }),
  makeCard({
    careerLevel: ["Director"],
    employmentType: "full-time",
    slug: "e",
  }),
  makeCard({ careerLevel: ["Lead"], employmentType: "part-time", slug: "f" }),
];

test("nearby levels are the closest rungs with roles, in ladder order", () => {
  const related = relatedTaxonomy(cards, "level", "senior");
  expect(related.map((item) => item.label)).toEqual(["Entry", "Mid", "Lead"]);
  expect(related.find((item) => item.slug === "lead")).toMatchObject({
    count: 2,
    href: "/jobs/level/lead",
  });
});

test("other types skip the current one and keep real counts", () => {
  const related = relatedTaxonomy(cards, "type", "full-time");
  expect(related.map((item) => [item.slug, item.count])).toEqual([
    ["contract", 1],
    ["part-time", 1],
  ]);
});

test("the intro count only covers roles that appear on a card", () => {
  expect(rolesWithTaxonomy(cards, "language")).toBe(1);
  expect(rolesWithTaxonomy(cards, "type")).toBe(4);
  // "c" has only a seniority; the Senior level card (and archive) lists it.
  expect(rolesWithTaxonomy(cards, "level")).toBe(6);
});

test("every contract type has a one-line description", () => {
  for (const type of JOB_EMPLOYMENT_TYPES) {
    expect(TYPE_DESCRIPTION[type].length).toBeGreaterThan(0);
  }
});
