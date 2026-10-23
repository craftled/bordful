// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { formatSalary } from "@/lib/board/format";
import type { JobListItem } from "@/lib/read/types";

import { JobRow } from "./job-row";

afterEach(() => {
  cleanup();
});

const NOW = Date.parse("2026-10-23T12:00:00Z");

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

test("formats salary for min only, max only, both and none", () => {
  expect(formatSalary({ salaryCurrency: "USD", salaryMin: 45_000 })).toBe(
    "$45k (USD)"
  );
  expect(formatSalary({ salaryCurrency: "USD", salaryMax: 65_000 })).toBe(
    "$65k (USD)"
  );
  expect(
    formatSalary({
      salaryCurrency: "USD",
      salaryMax: 65_000,
      salaryMin: 45_000,
    })
  ).toBe("$45k-65k (USD)");
  expect(formatSalary({ salaryCurrency: "USD" })).toBe("");
  expect(formatSalary({ salaryMin: Number.NaN })).toBe("");
});

test("never renders undefined in the salary or the meta row", () => {
  const { container } = render(
    <ul>
      <JobRow
        job={job({ salaryCurrency: "USD", salaryMin: 45_000 })}
        now={NOW}
      />
    </ul>
  );

  expect(container.textContent).not.toContain("undefined");
  expect(container.textContent).toContain("$45k (USD)");
});

test("omits the salary, date and featured badge when they are missing", () => {
  const { container } = render(
    <ul>
      <JobRow job={job({ featured: false, publishedAt: null })} now={NOW} />
    </ul>
  );

  expect(container.textContent).not.toContain("ago");
  expect(screen.queryByText("Featured")).toBeNull();
  expect(container.querySelector("time")).toBeNull();
});

test("the whole card is one link with the title as its text", () => {
  render(
    <ul>
      <JobRow
        job={job({
          employmentType: "full-time",
          featured: true,
          publishedAt: "2026-10-22T12:00:00Z",
        })}
        now={NOW}
      />
    </ul>
  );

  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(1);
  expect(links[0]?.textContent).toBe("Senior Engineer");
  expect(links[0]?.getAttribute("href")).toBe("/jobs/senior-engineer");
  expect(screen.getByText("Featured")).toBeTruthy();
  expect(screen.getByText("Full-time")).toBeTruthy();
});
