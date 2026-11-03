// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { categoryCrumb, JobBreadcrumb, locationCrumb } from "./job-breadcrumb";

afterEach(() => {
  cleanup();
});

test("marketing mode starts the trail at Jobs, as Paper does", () => {
  render(<JobBreadcrumb marketing title="Backend Engineer" />);

  expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
  expect(screen.getByRole("link", { name: "Jobs" }).getAttribute("href")).toBe(
    "/jobs"
  );
});

test("board mode has no duplicate Home crumb", () => {
  render(<JobBreadcrumb marketing={false} title="Backend Engineer" />);

  expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
  expect(screen.getByRole("link", { name: "Jobs" }).getAttribute("href")).toBe(
    "/"
  );
});

test("the last crumb is the current page and carries the full title", () => {
  render(<JobBreadcrumb marketing title="Backend Engineer" />);

  const current = screen.getByText("Backend Engineer");
  expect(current.getAttribute("aria-current")).toBe("page");
  expect(current.parentElement?.getAttribute("title")).toBe("Backend Engineer");
  expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
});

test("renders trailing actions next to the back link", () => {
  render(
    <JobBreadcrumb
      actions={<button type="button">Save job</button>}
      marketing={false}
      title="Backend Engineer"
    />
  );

  expect(screen.getByRole("button", { name: "Save job" })).toBeTruthy();
});

test("names the company in the last crumb when it is known", () => {
  render(
    <JobBreadcrumb companyName="Acme" marketing title="Backend Engineer" />
  );

  expect(screen.getByText("Backend Engineer at Acme")).toBeTruthy();
  expect(screen.getByText("Acme")).toBeTruthy();
  expect(
    screen
      .getByText("Backend Engineer at Acme")
      .parentElement?.parentElement?.getAttribute("title")
  ).toBe("Backend Engineer at Acme");
});

test("links the category and location crumbs when given", () => {
  render(
    <JobBreadcrumb
      category={{ href: "/jobs/search?categories=design", label: "Design" }}
      companyName="Acme"
      location={{ href: "/jobs/location/remote", label: "Remote" }}
      marketing
      title="Backend Engineer"
    />
  );

  const links = screen
    .getAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);
  expect(links.slice(0, 3)).toEqual([
    ["Jobs", "/jobs"],
    ["Design", "/jobs/search?categories=design"],
    ["Remote", "/jobs/location/remote"],
  ]);
});

const job = (overrides: Partial<JobListItem>): JobListItem =>
  ({
    careerLevel: [],
    categories: [],
    countryCode: null,
    languages: [],
    workplaceType: null,
    ...overrides,
  }) as JobListItem;

test("categoryCrumb links the first category to the filtered board", () => {
  expect(
    categoryCrumb(job({ categories: [" Art, Fashion & Design "] }))
  ).toEqual({
    href: "/jobs/search?categories=art%2C+fashion+%26+design",
    label: "Art, Fashion & Design",
  });
  expect(categoryCrumb(job({ categories: [] }))).toBeNull();
  // A bare comma would split into two categories on the board.
  expect(categoryCrumb(job({ categories: ["a,b"] }))).toBeNull();
});

test("locationCrumb prefers Remote, then the country archive", () => {
  expect(
    locationCrumb(job({ countryCode: "AR", workplaceType: "remote" }))
  ).toEqual({ href: "/jobs/location/remote", label: "Remote" });
  expect(locationCrumb(job({ countryCode: "de" }))).toEqual({
    href: "/jobs/location/de",
    label: "Germany",
  });
  expect(locationCrumb(job({}))).toBeNull();
});
