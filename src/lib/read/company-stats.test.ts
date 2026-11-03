import { expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { companyStatsFromPool, similarCompanies } from "./company-stats";

const NOW = Date.parse("2026-11-03T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function card(
  overrides: Partial<JobListItem> & Pick<JobListItem, "slug">
): JobListItem {
  return {
    careerLevel: [],
    categories: [],
    companyLogoUrl: null,
    companyName: "Acme",
    companySlug: "acme",
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
    title: "Role",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: null,
    ...overrides,
  };
}

test("counts roles, picks the common location and flags recent and remote hiring", () => {
  const stats = companyStatsFromPool(
    [
      card({
        publishedAt: new Date(NOW - 2 * DAY).toISOString(),
        slug: "a",
        workplaceType: "remote",
      }),
      card({ slug: "b", workplaceType: "remote" }),
      card({ locationDisplay: "Berlin", slug: "c", workplaceType: "onsite" }),
      card({
        companyName: "Old Co",
        companySlug: "old",
        locationDisplay: "Paris",
        publishedAt: new Date(NOW - 30 * DAY).toISOString(),
        slug: "d",
        workplaceType: "onsite",
      }),
      card({ companySlug: null, slug: "e" }),
    ],
    NOW
  );

  expect(stats.size).toBe(2);
  expect(stats.get("acme")).toMatchObject({
    count: 3,
    hiringThisWeek: true,
    location: "Remote",
    remoteFirst: true,
  });
  expect(stats.get("old")).toMatchObject({
    count: 1,
    hiringThisWeek: false,
    location: "Paris",
    remoteFirst: false,
  });
});

test("an even remote split is not remote-first", () => {
  const stats = companyStatsFromPool(
    [
      card({ slug: "a", workplaceType: "remote" }),
      card({ slug: "b", workplaceType: "hybrid" }),
    ],
    NOW
  );
  expect(stats.get("acme")?.remoteFirst).toBe(false);
});

test("similar companies share categories first and skip unrelated ones", () => {
  const stats = companyStatsFromPool(
    [
      card({ categories: ["design", "eng"], slug: "a" }),
      card({
        categories: ["design", "eng"],
        companyName: "Both",
        companySlug: "both",
        slug: "b",
      }),
      card({
        categories: ["design"],
        companyName: "One",
        companySlug: "one",
        slug: "c",
      }),
      card({
        categories: ["sales"],
        companyName: "None",
        companySlug: "none",
        locationDisplay: "Oslo",
        slug: "d",
      }),
    ],
    NOW
  );

  expect(similarCompanies(stats, "acme").map((item) => item.slug)).toEqual([
    "both",
    "one",
  ]);
  expect(similarCompanies(stats, "missing")).toEqual([]);
});
