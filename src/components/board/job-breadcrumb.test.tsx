// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { JobBreadcrumb } from "./job-breadcrumb";

afterEach(() => {
  cleanup();
});

test("marketing mode links Home and Jobs to their own pages", () => {
  render(<JobBreadcrumb marketing title="Backend Engineer" />);

  expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe(
    "/"
  );
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
