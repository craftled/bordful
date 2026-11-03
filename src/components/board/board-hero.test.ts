import { expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { heroStats } from "./board-hero";

const NOW = Date.parse("2026-10-23T12:00:00Z");

function card(overrides: Partial<JobListItem>): JobListItem {
  return {
    careerLevel: [],
    categories: [],
    companyLogoUrl: null,
    companyName: "Acme",
    companySlug: "acme",
    countryCode: null,
    employmentType: null,
    featured: false,
    id: "id",
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
    slug: "job",
    title: "Job",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: null,
    ...overrides,
  };
}

test("counts open jobs and omits every stat when there is no data", () => {
  expect(heroStats([], NOW)).toEqual({
    lastUpdated: null,
    openJobs: 0,
    trending: [],
  });
});

test("last updated uses the newest valid publishedAt and skips junk dates", () => {
  const stats = heroStats(
    [
      card({ publishedAt: "2026-10-23T09:00:00Z" }),
      card({ publishedAt: "not a date" }),
      card({ publishedAt: "2026-10-22T12:00:00Z" }),
      card({ publishedAt: null }),
    ],
    NOW
  );

  expect(stats.openJobs).toBe(4);
  expect(stats.lastUpdated).toBe("3 hours ago");
});

test("last updated is omitted when no job has a usable date", () => {
  const stats = heroStats(
    [card({ publishedAt: null }), card({ publishedAt: "garbage" })],
    NOW
  );

  expect(stats.lastUpdated).toBeNull();
});

test("trending lists the top three companies by job count", () => {
  const cards = [
    card({ companyName: "Alpha", companySlug: "alpha" }),
    card({ companyName: "Beta", companySlug: "beta" }),
    card({ companyName: "Beta", companySlug: "beta" }),
    card({ companyName: "Gamma", companySlug: "gamma" }),
    card({ companyName: "Gamma", companySlug: "gamma" }),
    card({ companyName: "Gamma", companySlug: "gamma" }),
    card({ companyName: "Delta", companySlug: "delta" }),
  ];

  expect(heroStats(cards, NOW).trending).toEqual(["Gamma", "Beta", "Alpha"]);
});

test("trending ignores jobs without a company slug and is omitted when empty", () => {
  const stats = heroStats(
    [card({ companySlug: null }), card({ companySlug: "" })],
    NOW
  );

  expect(stats.trending).toEqual([]);
  expect(stats.openJobs).toBe(2);
});
