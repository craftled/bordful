import { expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { roleAlert, similarJobs } from "./job-preview";

function job(overrides: Partial<JobListItem>): JobListItem {
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
    slug: "senior-engineer",
    title: "Senior Engineer",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: null,
    ...overrides,
  };
}

test("similar jobs share a category with the open one, never itself", () => {
  const open = job({ categories: ["Design"], slug: "a" });
  const jobs = [
    open,
    job({ categories: ["Engineering"], slug: "b" }),
    job({ categories: ["Design", "Data"], slug: "c" }),
    job({ categories: ["Design"], slug: "d" }),
    job({ categories: ["Design"], slug: "e" }),
    job({ categories: ["Design"], slug: "f" }),
  ];

  expect(similarJobs(open, jobs).map((item) => item.slug)).toEqual([
    "c",
    "d",
    "e",
  ]);
  expect(similarJobs(job({ slug: "x" }), jobs)).toEqual([]);
});

test("the role alert carries the job's level, type and remote flag", () => {
  expect(
    roleAlert(
      job({
        employmentType: "full-time",
        seniority: "senior",
        workplaceType: "remote",
      })
    )
  ).toEqual({
    href: "/alerts?seniority=senior&types=full-time&remote=true",
    summary: "Senior, Full-time, Remote",
  });
  expect(roleAlert(job({}))).toEqual({ href: "/alerts", summary: "" });
});
