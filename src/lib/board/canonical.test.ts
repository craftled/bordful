import { expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { canonicalSearchRedirect as redirectFor } from "./canonical";

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

const cards = [
  makeCard({
    employmentType: "full-time",
    languages: ["en"],
    seniority: "senior",
    slug: "a-backend",
    title: "Example Backend Engineer",
    workplaceType: "remote",
  }),
  makeCard({
    employmentType: "contract",
    slug: "b-designer",
    title: "Example Product Designer",
  }),
];

function canonicalSearchRedirect(
  params: URLSearchParams,
  opts: typeof options
): string | null {
  return redirectFor(params, opts, cards);
}

test("redirects a single facet to its archive and cleans query order", () => {
  expect(
    canonicalSearchRedirect(new URLSearchParams("types=full-time"), options)
  ).toBe("/jobs/type/full-time");
  expect(
    canonicalSearchRedirect(new URLSearchParams("remote=true"), options)
  ).toBe("/jobs/location/remote");
  expect(
    canonicalSearchRedirect(
      new URLSearchParams("types=contract&page=2"),
      options
    )
  ).toBe("/jobs/type/contract/page/2");
  expect(
    canonicalSearchRedirect(
      new URLSearchParams("types=full-time&remote=true"),
      options
    )
  ).toBeNull();
  expect(
    canonicalSearchRedirect(new URLSearchParams("remote=true&q=a"), options)
  ).toBe("/jobs/search?q=a&remote=true");
  expect(
    canonicalSearchRedirect(new URLSearchParams("q=a&remote=true"), options)
  ).toBeNull();
});

test("keeps a category or featured search on the search page", () => {
  expect(
    canonicalSearchRedirect(
      new URLSearchParams("categories=design&remote=true"),
      options
    )
  ).toBeNull();
  expect(
    canonicalSearchRedirect(
      new URLSearchParams("featured=true&types=contract"),
      options
    )
  ).toBeNull();
});

test("stays on the search page when the archive would have no jobs", () => {
  expect(
    canonicalSearchRedirect(new URLSearchParams("types=internship"), options)
  ).toBeNull();
  expect(
    canonicalSearchRedirect(new URLSearchParams("languages=xx"), options)
  ).toBeNull();
  expect(
    canonicalSearchRedirect(new URLSearchParams("roles=lead"), options)
  ).toBeNull();
  expect(
    canonicalSearchRedirect(new URLSearchParams("languages=en"), options)
  ).toBe("/jobs/language/en");
  expect(
    canonicalSearchRedirect(new URLSearchParams("roles=senior"), options)
  ).toBe("/jobs/level/senior");
  expect(redirectFor(new URLSearchParams("remote=true"), options, [])).toBe(
    null
  );
});
