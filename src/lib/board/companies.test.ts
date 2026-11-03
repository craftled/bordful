import { expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { companiesFromPool } from "./companies";

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
    validThrough: null,
    visaSponsorship: null,
    workplaceType: null,
    ...overrides,
  };
}

test("companiesFromPool counts jobs and sorts by name", () => {
  expect(
    companiesFromPool([
      makeCard({
        companyName: "Example Co",
        companySlug: "example-co",
        slug: "a-backend",
        title: "Example Backend Engineer",
      }),
      makeCard({
        companyName: "Acme Example Ltd",
        companySlug: "acme-example",
        slug: "b-designer",
        title: "Example Product Designer",
      }),
      makeCard({
        companyName: "Example Co",
        companySlug: "example-co",
        slug: "c-analyst",
        title: "Sample Remote Data Analyst",
      }),
      makeCard({
        companyName: "Skip",
        companySlug: null,
        slug: "d-skip",
        title: "Skipped",
      }),
    ])
  ).toEqual([
    {
      count: 1,
      logoUrl: null,
      name: "Acme Example Ltd",
      slug: "acme-example",
    },
    { count: 2, logoUrl: null, name: "Example Co", slug: "example-co" },
  ]);
});
