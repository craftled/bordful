import { describe, expect, test } from "vitest";

import type { JobDetail } from "@/lib/read/types";

import { factRows } from "./job-facts";

function job(overrides: Partial<JobDetail>): JobDetail {
  return {
    applyEmail: null,
    applyMethod: null,
    applyUrl: null,
    careerLevel: [],
    categories: [],
    company: null,
    companyLogoUrl: null,
    companyName: "Acme",
    companySlug: null,
    countryCode: null,
    description: null,
    employmentType: null,
    featured: false,
    id: "job",
    indexable: true,
    languages: [],
    locality: null,
    locationDisplay: null,
    origin: "manual",
    publishedAt: null,
    region: null,
    remoteRegion: null,
    salaryCurrency: null,
    salaryMax: null,
    salaryMaxUsd: null,
    salaryMin: null,
    salaryMinUsd: null,
    seniority: null,
    slug: "job",
    sourceListingUrl: null,
    title: "Engineer",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: null,
    ...overrides,
  } as JobDetail;
}

describe("factRows", () => {
  test("keeps only allowed fields that have a value", () => {
    const rows = factRows(
      job({
        employmentType: "full-time",
        locationDisplay: "Berlin, Germany",
        salaryCurrency: "EUR",
        salaryMax: 90_000,
        salaryMin: 70_000,
      }),
      ["salary", "location", "employmentType", "careerLevel", "categories"]
    );
    expect(rows.map((row) => row.label)).toEqual([
      "Salary",
      "Type",
      "Location",
    ]);
  });

  test("never emits placeholder text for missing values", () => {
    const rows = factRows(job({}), [
      "salary",
      "location",
      "workplaceType",
      "careerLevel",
      "languages",
      "categories",
      "validThrough",
      "employmentType",
    ]);
    expect(rows).toEqual([]);
  });

  test("ignores a salary that formats to undefined", () => {
    const rows = factRows(
      job({ salaryCurrency: "USD", salaryMax: null, salaryMin: null }),
      ["salary"]
    );
    expect(rows).toEqual([]);
  });

  test("does not show a field the owner did not allow", () => {
    const rows = factRows(job({ categories: ["Engineering"] }), ["salary"]);
    expect(rows).toEqual([]);
  });
});
