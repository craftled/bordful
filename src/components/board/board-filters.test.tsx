// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import type { BoardFacets } from "@/lib/board/filter";
import { type BoardQuery, parseBoardQuery } from "@/lib/board/query";

import { BoardFilters } from "./board-filters";

afterEach(() => {
  cleanup();
});

const OPTIONS = { defaultPerPage: 10 };

const FACETS: BoardFacets = {
  languages: [{ count: 2, value: "en" }],
  remote: 0,
  salary: [{ count: 0, value: "< $50K" }],
  seniority: [
    { count: 3, value: "senior" },
    { count: 0, value: "intern" },
  ],
  types: [
    { count: 4, value: "full-time" },
    { count: 0, value: "contract" },
  ],
  visa: 0,
};

function queryWith(overrides: Partial<BoardQuery>): BoardQuery {
  return { ...parseBoardQuery(new URLSearchParams(""), OPTIONS), ...overrides };
}

function renderFilters(query: BoardQuery, facets: BoardFacets = FACETS) {
  render(
    <BoardFilters
      facets={facets}
      marketing={false}
      options={OPTIONS}
      query={query}
    />
  );
}

// Below lg the rail is a native popover, so jsdom reports it as hidden;
// role queries opt in with hidden: true.
test("hides zero-count options", () => {
  renderFilters(queryWith({}));

  expect(screen.getByTestId("filter-type-full-time")).toBeTruthy();
  expect(screen.queryByTestId("filter-type-contract")).toBeNull();
  expect(screen.queryByTestId("filter-salary-0")).toBeNull();
  expect(screen.queryByTestId("filter-level-intern")).toBeNull();
  expect(screen.queryByTestId("filter-remote")).toBeNull();
  expect(screen.queryByTestId("filter-visa")).toBeNull();
  expect(
    screen.getByRole("group", { hidden: true, name: "Level" })
  ).toBeTruthy();
});

test("keeps an active zero-count option so it can be cleared", () => {
  renderFilters(queryWith({ types: ["contract"] }));

  const active = screen.getByTestId("filter-type-contract");
  expect(active.getAttribute("aria-current")).toBe("true");
  expect(screen.getByTestId("filter-type-full-time")).toBeTruthy();
});

test("the phone sheet has a reset link only when filters are active", () => {
  renderFilters(queryWith({}));
  expect(
    screen.queryByRole("link", { hidden: true, name: "Reset" })
  ).toBeNull();
  cleanup();

  renderFilters(queryWith({ types: ["full-time"] }), FACETS);
  expect(
    screen
      .getByRole("link", { hidden: true, name: "Reset" })
      .getAttribute("href")
  ).toBe("/");
});

test("the sheet's show button counts the matching jobs", () => {
  render(
    <BoardFilters
      facets={FACETS}
      marketing={false}
      options={OPTIONS}
      query={queryWith({})}
      total={18}
    />
  );

  expect(
    screen.getByRole("button", { hidden: true, name: "Show 18 jobs" })
  ).toBeTruthy();
});

test("active options are marked with aria-current and a selected label", () => {
  renderFilters(queryWith({ types: ["full-time"] }));

  const option = screen.getByTestId("filter-type-full-time");
  expect(option.getAttribute("aria-current")).toBe("true");
  expect(option.textContent).toContain("(selected)");
});

test("hides a group with no visible options", () => {
  renderFilters(queryWith({}), {
    ...FACETS,
    seniority: [{ count: 0, value: "intern" }],
  });

  expect(
    screen.queryByRole("group", { hidden: true, name: "Level" })
  ).toBeNull();
});

test("folds options past the first five behind show more", () => {
  const languages = ["en", "fr", "de", "es", "it", "pt"].map((value) => ({
    count: 1,
    value,
  }));
  renderFilters(queryWith({}), { ...FACETS, languages });

  const more = screen.getByText("Show more").closest("details");
  expect(more).not.toBeNull();
  expect(more?.hasAttribute("open")).toBe(false);
  expect(screen.getByTestId("filter-language-pt").closest("details")).toBe(
    more
  );
});

test("opens show more when a hidden option is active", () => {
  const languages = ["en", "fr", "de", "es", "it", "pt"].map((value) => ({
    count: 1,
    value,
  }));
  renderFilters(queryWith({ languages: ["pt"] }), { ...FACETS, languages });

  const more = screen.getByText("Show more").closest("details");
  expect(more?.hasAttribute("open")).toBe(true);
});
