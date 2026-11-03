// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { BoardFacets } from "@/lib/board/filter";
import { parseBoardQuery } from "@/lib/board/query";

import { BoardToolbar, perPageChoices, resultsLabel } from "./board-toolbar";

afterEach(() => {
  cleanup();
});

const OPTIONS = { defaultPerPage: 10 };

function toolbar(search: string, total: number) {
  return (
    <BoardToolbar
      marketing={false}
      options={OPTIONS}
      query={parseBoardQuery(new URLSearchParams(search), OPTIONS)}
      showControls
      total={total}
    />
  );
}

test("shows the total and the last update in the count label", () => {
  expect(resultsLabel(143)).toBe("143 results");
  expect(resultsLabel(1)).toBe("1 result");
  expect(resultsLabel(0, null)).toBe("0 results");
  expect(resultsLabel(31, "2 hours ago")).toBe(
    "31 results · updated 2 hours ago"
  );
});

test("adds a non-standard default page size to the per-page choices", () => {
  expect(perPageChoices(10)).toEqual([10, 20, 50, 100]);
  expect(perPageChoices(7)).toEqual([7, 10, 20, 50, 100]);
});

test("renders the count element from the component with its data attributes", () => {
  render(toolbar("per_page=20", 143));

  const count = screen.getByTestId("job-count");
  expect(count.getAttribute("data-count")).toBe("143");
  expect(count.textContent).toBe("143 results");
});

test("renders the title as the H2 and accepts a custom title", () => {
  const { unmount } = render(toolbar("", 10));
  expect(
    screen.getByRole("heading", { level: 2, name: "Latest Opportunities" })
  ).toBeTruthy();
  unmount();

  render(
    <BoardToolbar
      marketing={false}
      options={OPTIONS}
      query={parseBoardQuery(new URLSearchParams(""), OPTIONS)}
      showControls={false}
      title="Results"
      total={0}
    />
  );
  expect(
    screen.getByRole("heading", { level: 2, name: "Results" })
  ).toBeTruthy();
});

test("the per-page menu links to each page size and marks the current one", () => {
  render(toolbar("per_page=20&sort=oldest", 143));

  const menu = screen.getByTestId("per-page-menu");
  expect(menu.querySelector("summary")?.textContent).toContain("20");

  const links = within(menu).getAllByRole("link", { hidden: true });
  expect(links.map((link) => link.textContent)).toEqual([
    "10",
    "20",
    "50",
    "100",
  ]);
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "/jobs/search?sort=oldest",
    "/jobs/search?sort=oldest&per_page=20",
    "/jobs/search?sort=oldest&per_page=50",
    "/jobs/search?sort=oldest&per_page=100",
  ]);

  const active = links.filter((link) => link.hasAttribute("aria-current"));
  expect(active.map((link) => link.textContent)).toEqual(["20"]);
  expect(active[0]?.getAttribute("data-active")).toBe("true");
});

test("the sort menu uses the short labels and marks the current sort", () => {
  render(toolbar("per_page=20&sort=oldest", 143));

  const menu = screen.getByTestId("sort-menu");
  expect(menu.querySelector("summary")?.textContent).toContain("Oldest");

  const links = within(menu).getAllByRole("link", { hidden: true });
  expect(links.map((link) => link.textContent)).toEqual([
    "Newest",
    "Oldest",
    "Highest salary",
  ]);
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "/jobs/search?per_page=20",
    "/jobs/search?sort=oldest&per_page=20",
    "/jobs/search?sort=salary&per_page=20",
  ]);

  const active = links.filter((link) => link.hasAttribute("aria-current"));
  expect(active.map((link) => link.textContent)).toEqual(["Oldest"]);
});

test("hides the menus when controls are off", () => {
  render(
    <BoardToolbar
      marketing={false}
      options={OPTIONS}
      query={parseBoardQuery(new URLSearchParams(""), OPTIONS)}
      showControls={false}
      total={0}
    />
  );

  expect(screen.queryByTestId("sort-menu")).toBeNull();
  expect(screen.queryByTestId("per-page-menu")).toBeNull();
});

const FACETS: BoardFacets = {
  categories: [],
  featured: 0,
  languages: [],
  remote: 2,
  salary: [],
  seniority: [],
  types: [{ count: 4, value: "full-time" }],
  visa: 0,
};

function withFacets(search: string) {
  return (
    <BoardToolbar
      facets={FACETS}
      marketing={false}
      options={OPTIONS}
      query={parseBoardQuery(new URLSearchParams(search), OPTIONS)}
      showControls
      total={4}
    />
  );
}

test("clear href keeps sort and page size but drops every filter", () => {
  render(withFacets("types=full-time&per_page=20&sort=oldest"));

  const clear = screen.getByTestId("filter-clear");
  expect(clear.textContent).toBe("Clear");
  const href = clear.getAttribute("href") ?? "";
  expect(href).not.toContain("types=");
  expect(href).toContain("per_page=20");
  expect(href).toContain("sort=oldest");
});

test("no clear link when nothing is active", () => {
  render(withFacets(""));

  expect(screen.queryByTestId("filter-clear")).toBeNull();
});

test("an active filter gets a removable phone chip", () => {
  render(withFacets("types=full-time&remote=true"));

  const chip = screen.getByRole("link", {
    name: "Remove Type filter: Full-time",
  });
  expect(chip.getAttribute("href")).toBe("/jobs/search?remote=true");
});

test("chips are left out when there are no facets", () => {
  render(toolbar("types=full-time", 4));

  expect(screen.queryByTestId("filter-clear")).toBeNull();
  expect(screen.queryByRole("button", { name: "Filters" })).toBeNull();
});
