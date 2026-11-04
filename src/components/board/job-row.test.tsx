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
    "$45k"
  );
  expect(formatSalary({ salaryCurrency: "USD", salaryMax: 65_000 })).toBe(
    "$65k"
  );
  expect(
    formatSalary({
      salaryCurrency: "USD",
      salaryMax: 65_000,
      salaryMin: 45_000,
    })
  ).toBe("$45k-65k");
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
  expect(container.textContent).toContain("$45k");
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

test("the card's job link is the title, and the title is an H3", () => {
  render(
    <ul>
      <JobRow
        job={job({
          companySlug: null,
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
  expect(
    screen.getByRole("heading", { level: 2, name: "Senior Engineer" })
  ).toBeTruthy();
  expect(screen.getByText("Featured")).toBeTruthy();
  expect(screen.getByText("Full-time")).toBeTruthy();
});

test("links the company name to its page when the slug is known", () => {
  render(
    <ul>
      <JobRow job={job({ companySlug: "acme" })} now={NOW} />
    </ul>
  );

  const company = screen.getByRole("link", { name: "Acme" });
  expect(company.getAttribute("href")).toBe("/companies/acme");
  expect(company.className).toContain("z-10");
});

test("shows the company name as plain text when the slug is missing", () => {
  render(
    <ul>
      <JobRow job={job({ companySlug: null })} now={NOW} />
    </ul>
  );

  expect(screen.queryByRole("link", { name: "Acme" })).toBeNull();
  expect(screen.getByText("Acme")).toBeTruthy();
});

test("shows the short age and keeps the full date in the time element", () => {
  const { container } = render(
    <ul>
      <JobRow job={job({ publishedAt: "2026-10-23T10:00:00Z" })} now={NOW} />
    </ul>
  );

  const time = container.querySelector("time");
  expect(time?.textContent).toBe("2h");
  expect(time?.getAttribute("dateTime")).toBe("2026-10-23T10:00:00Z");
  expect(time?.getAttribute("title")).toBe("2 hours ago");
});

test("marks featured, new and closing rows with status pills", () => {
  const { container } = render(
    <ul>
      <JobRow
        job={job({ featured: true, publishedAt: "2026-10-23T10:00:00Z" })}
        now={NOW}
      />
      <JobRow
        job={job({
          id: "closing",
          publishedAt: "2026-10-23T10:00:00Z",
          slug: "closing",
          validThrough: "2026-10-26T00:00:00Z",
        })}
        now={NOW}
      />
    </ul>
  );

  const statuses = Array.from(
    container.querySelectorAll("[data-status]"),
    (node) => node.getAttribute("data-status")
  );
  expect(statuses).toEqual(["featured", "new", "closing"]);
  expect(
    container.querySelector("[data-status='featured']")?.className
  ).toContain("text-featured");
  expect(
    container.querySelector("[data-status='closing']")?.className
  ).toContain("text-closing");
});
