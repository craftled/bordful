import { expect, test } from "vitest";

import type { BordfeedJob } from "./job-schema";
import { mapBordfeedJob } from "./map-job";

const DESCRIPTION_HASH =
  "88131bd04c7f4f8ac816143d39681612846b802ac6e2c49c81dfeb0f6eeb4254";

const fixture = {
  apply_url: "https://jobs.widgets.example/apply/1",
  career_level: ["Mid"],
  company: {
    domain: "widgets.example",
    id: "c0000000-0000-4000-8000-000000000001",
    logo_url: null,
    name: "Sample Widgets Inc",
    slug: null,
  },
  description: "Build reliable systems.",
  id: "bfec0000-0000-4000-8000-000000000001",
  listing_url: "javascript:alert(1)",
  locations: ["Hyderabad, IN"],
  posted_date: "2026-10-14T00:00:00.000Z",
  salary_currency: null,
  salary_max: null,
  salary_max_usd: null,
  salary_min: null,
  salary_min_usd: null,
  slug: null,
  title: "Site Reliability Engineer II",
  type: "Full-time",
  workplace_country_code: "in",
  workplace_type: "Remote",
} as BordfeedJob;

test("mapBordfeedJob copies the listing into Bordful fields", () => {
  expect(mapBordfeedJob(fixture, "bordfeed")).toEqual({
    applyEmail: null,
    applyMethod: null,
    applyUrl: "https://jobs.widgets.example/apply/1",
    bordfeedDescriptionHash: DESCRIPTION_HASH,
    bordfeedJobId: "bfec0000-0000-4000-8000-000000000001",
    careerLevel: ["Mid"],
    categories: [],
    company: {
      bordfeedCompanyId: "c0000000-0000-4000-8000-000000000001",
      domain: "widgets.example",
      logoUrl: null,
      name: "Sample Widgets Inc",
      slug: "sample-widgets-inc",
    },
    countryCode: "IN",
    description: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "Build reliable systems.",
                type: "text",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    },
    employmentType: "full-time",
    languages: [],
    locality: null,
    locationDisplay: "Hyderabad, IN",
    origin: "bordfeed",
    publishedAt: "2026-10-14T00:00:00.000Z",
    region: null,
    remoteRegion: null,
    salaryCurrency: null,
    salaryMax: null,
    salaryMaxUsd: null,
    salaryMin: null,
    salaryMinUsd: null,
    seniority: "mid",
    slug: "site-reliability-engineer-ii-bfec0000",
    sourceListingUrl: null,
    title: "Site Reliability Engineer II",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: "remote",
  });
});
