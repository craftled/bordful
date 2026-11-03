// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import {
  availableFilters,
  COMPANY_PAGE_SIZE,
  CompanyDirectory,
  type CompanyDirectoryRow,
  filterCompanies,
} from "./company-directory";

afterEach(() => {
  cleanup();
});

function row(
  slug: string,
  overrides: Partial<CompanyDirectoryRow> = {}
): CompanyDirectoryRow {
  return {
    count: 1,
    hiringThisWeek: false,
    location: "Remote",
    logoUrl: null,
    name: slug.toUpperCase(),
    remoteFirst: false,
    slug,
    ...overrides,
  };
}

test("offers only filters some company matches", () => {
  expect(availableFilters([row("a")])).toEqual(["all"]);
  expect(
    availableFilters([row("a", { hiringThisWeek: true }), row("b")])
  ).toEqual(["all", "week"]);
  expect(
    availableFilters([row("a", { hiringThisWeek: true, remoteFirst: true })])
  ).toEqual(["all", "week", "remote"]);
});

test("filters by tab and name together", () => {
  const rows = [
    row("alpha", { remoteFirst: true }),
    row("beta", { hiringThisWeek: true }),
    row("gamma", { remoteFirst: true }),
  ];
  expect(filterCompanies(rows, "remote", "").map((r) => r.slug)).toEqual([
    "alpha",
    "gamma",
  ]);
  expect(filterCompanies(rows, "remote", "gam").map((r) => r.slug)).toEqual([
    "gamma",
  ]);
  expect(filterCompanies(rows, "week", "").map((r) => r.slug)).toEqual([
    "beta",
  ]);
});

test("shows the first page, then every company after Show all", () => {
  const rows = Array.from({ length: COMPANY_PAGE_SIZE + 2 }, (_, index) =>
    row(`c${String(index).padStart(2, "0")}`, { count: 2, location: "Oslo" })
  );
  render(<CompanyDirectory rows={rows} subtitle="Sub." title="Companies" />);

  expect(screen.getAllByTestId("company-row")).toHaveLength(COMPANY_PAGE_SIZE);
  expect(screen.getAllByText("2 open roles")).toHaveLength(COMPANY_PAGE_SIZE);
  expect(screen.getAllByText("Oslo").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByTestId("company-show-all"));
  expect(screen.getAllByTestId("company-row")).toHaveLength(rows.length);
  expect(screen.queryByTestId("company-show-all")).toBeNull();
});
