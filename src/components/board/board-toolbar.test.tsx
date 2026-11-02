// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { parseBoardQuery } from "@/lib/board/query";

import { BoardToolbar, perPageChoices, showingLabel } from "./board-toolbar";

afterEach(() => {
  cleanup();
});

const OPTIONS = { defaultPerPage: 10 };

function toolbar(search: string, shown: number, total: number) {
  return (
    <BoardToolbar
      marketing={false}
      options={OPTIONS}
      query={parseBoardQuery(new URLSearchParams(search), OPTIONS)}
      showControls
      shown={shown}
      total={total}
    />
  );
}

test("shows the page size and the total in the count label", () => {
  expect(showingLabel(10, 143)).toBe("Showing 10 of 143 positions");
  expect(showingLabel(1, 1)).toBe("Showing 1 of 1 position");
  expect(showingLabel(0, 0)).toBe("Showing 0 of 0 positions");
});

test("adds a non-standard default page size to the per-page choices", () => {
  expect(perPageChoices(10)).toEqual([10, 20, 50, 100]);
  expect(perPageChoices(7)).toEqual([7, 10, 20, 50, 100]);
});

test("renders the count element from the component with its data attributes", () => {
  render(toolbar("per_page=20", 20, 143));

  const count = screen.getByTestId("job-count");
  expect(count.getAttribute("data-count")).toBe("143");
  expect(count.textContent).toBe("Showing 20 of 143 positions");
});

test("renders the title as the H2 and accepts a custom title", () => {
  const { unmount } = render(toolbar("", 10, 10));
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
      shown={0}
      title="Results"
      total={0}
    />
  );
  expect(
    screen.getByRole("heading", { level: 2, name: "Results" })
  ).toBeTruthy();
});

test("the per-page menu links to each page size and marks the current one", () => {
  render(toolbar("per_page=20&sort=oldest", 20, 143));

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

test("the sort menu uses the old labels and marks the current sort", () => {
  render(toolbar("per_page=20&sort=oldest", 20, 143));

  const menu = screen.getByTestId("sort-menu");
  expect(menu.querySelector("summary")?.textContent).toContain("Oldest first");

  const links = within(menu).getAllByRole("link", { hidden: true });
  expect(links.map((link) => link.textContent)).toEqual([
    "Newest first",
    "Oldest first",
    "Highest salary",
  ]);
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "/jobs/search?per_page=20",
    "/jobs/search?sort=oldest&per_page=20",
    "/jobs/search?sort=salary&per_page=20",
  ]);

  const active = links.filter((link) => link.hasAttribute("aria-current"));
  expect(active.map((link) => link.textContent)).toEqual(["Oldest first"]);
});

test("hides the menus when controls are off", () => {
  render(
    <BoardToolbar
      marketing={false}
      options={OPTIONS}
      query={parseBoardQuery(new URLSearchParams(""), OPTIONS)}
      showControls={false}
      shown={0}
      total={0}
    />
  );

  expect(screen.queryByTestId("sort-menu")).toBeNull();
  expect(screen.queryByTestId("per-page-menu")).toBeNull();
});
