// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { parseBoardQuery } from "@/lib/board/query";

import { BoardPagination } from "./board-pagination";

afterEach(() => {
  cleanup();
});

const OPTIONS = { defaultPerPage: 10 };

function renderPagination(page: number, totalPages: number) {
  render(
    <BoardPagination
      marketing={false}
      options={OPTIONS}
      page={page}
      query={{ ...parseBoardQuery(new URLSearchParams(""), OPTIONS), page }}
      totalPages={totalPages}
    />
  );
}

function pageNumbers(): string[] {
  const links = screen
    .getByRole("navigation", { name: "Pagination" })
    .querySelectorAll("a[data-testid^='pagination-page-']");
  return Array.from(links, (link) => link.textContent ?? "");
}

test("renders nothing for a single page", () => {
  renderPagination(1, 1);

  expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
});

test("first page of two disables Previous and links Next", () => {
  renderPagination(1, 2);

  expect(screen.queryByTestId("pagination-prev")).toBeNull();
  const disabled = screen
    .getByRole("navigation", { name: "Pagination" })
    .querySelector("[aria-disabled='true']");
  expect(disabled?.textContent).toContain("Previous");
  expect(screen.getByTestId("pagination-next").getAttribute("href")).toContain(
    "page"
  );
  expect(pageNumbers()).toEqual(["1", "2"]);
});

test("last page disables Next and links Previous", () => {
  renderPagination(2, 2);

  expect(screen.queryByTestId("pagination-next")).toBeNull();
  expect(screen.getByTestId("pagination-prev")).toBeTruthy();
  expect(
    screen
      .getByRole("navigation", { name: "Pagination" })
      .querySelectorAll("[aria-disabled='true']")
  ).toHaveLength(1);
});

test("marks the current page with aria-current", () => {
  renderPagination(2, 3);

  expect(
    screen.getByTestId("pagination-page-2").getAttribute("aria-current")
  ).toBe("page");
  expect(
    screen.getByTestId("pagination-page-1").getAttribute("aria-current")
  ).toBeNull();
});

test("shows the window with ellipsis for twenty pages", () => {
  renderPagination(1, 20);
  expect(pageNumbers()).toEqual(["1", "2", "20"]);

  cleanup();
  renderPagination(10, 20);
  expect(pageNumbers()).toEqual(["1", "9", "10", "11", "20"]);
  expect(screen.getAllByText("…")).toHaveLength(2);
});

test("shows every page for seven pages", () => {
  renderPagination(4, 7);

  expect(pageNumbers()).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  expect(screen.queryByText("…")).toBeNull();
});
