import { expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { renderConfirmEmail } from "./confirm";
import { renderDigestEmail } from "./digest";

function card(overrides: Partial<JobListItem>): JobListItem {
  return {
    careerLevel: [],
    categories: [],
    companyLogoUrl: null,
    companyName: "Example Co",
    companySlug: "example-co",
    countryCode: null,
    employmentType: "full-time",
    featured: false,
    id: overrides.slug ?? "1",
    indexable: true,
    languages: [],
    locationDisplay: "Remote",
    origin: "manual",
    publishedAt: "2026-10-20T09:00:00.000Z",
    remoteRegion: null,
    salaryCurrency: null,
    salaryMax: null,
    salaryMaxUsd: null,
    salaryMin: null,
    salaryMinUsd: null,
    seniority: null,
    slug: "job",
    title: "Example Role",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: "remote",
    ...overrides,
  };
}

const jobA = card({
  companyName: "Example Co",
  locationDisplay: "Remote",
  slug: "a",
  title: "<b>R&D</b>",
});
const jobB = card({
  companyName: "Acme Example Ltd",
  employmentType: "contract",
  locationDisplay: "Berlin",
  slug: "b",
  title: "Example Contract Role",
  workplaceType: "hybrid",
});

test("renderDigestEmail escapes titles and links each job", () => {
  const rendered = renderDigestEmail({
    frequency: "weekly",
    jobs: [jobA, jobB],
    siteName: "Example Board",
    siteUrl: "https://board.example",
    unsubscribeUrl: "https://board.example/alerts/unsubscribe?token=t",
  });

  expect(rendered.subject).toBe("2 new jobs on Example Board");
  expect(rendered.text).toContain("https://board.example/jobs/a");
  expect(rendered.text).toContain(
    "https://board.example/alerts/unsubscribe?token=t"
  );
  expect(rendered.html).toContain("&lt;b&gt;R&amp;D&lt;/b&gt;");
  expect(
    renderDigestEmail({
      frequency: "weekly",
      jobs: [jobA],
      siteName: "Example Board",
      siteUrl: "https://board.example",
      unsubscribeUrl: "https://board.example/alerts/unsubscribe?token=t",
    }).subject
  ).toBe("1 new job on Example Board");
});

test("renderConfirmEmail uses the confirm subject", () => {
  expect(
    renderConfirmEmail({
      confirmUrl: "https://board.example/alerts/confirm?token=t",
      siteName: "Example Board",
    }).subject
  ).toBe("Confirm your job alerts on Example Board");
});

test("renderConfirmEmail escapes the site name in the heading", () => {
  const rendered = renderConfirmEmail({
    confirmUrl: "https://board.example/alerts/confirm?token=t",
    siteName: "R&D <Jobs>",
  });

  expect(rendered.subject).toBe("Confirm your job alerts on R&D <Jobs>");
  expect(rendered.html).toContain("R&amp;D &lt;Jobs&gt;");
  expect(rendered.html).not.toContain("<Jobs>");
  expect(rendered.text).toContain("R&D <Jobs>");
});
