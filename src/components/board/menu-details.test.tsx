// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";

import { parseBoardQuery } from "@/lib/board/query";

import { BoardToolbar } from "./board-toolbar";
import { MenuDetails } from "./menu-details";

const OPTIONS = { defaultPerPage: 10 };

// jsdom cannot navigate; the menus only need to see the click.
function stopNavigation(event: Event) {
  event.preventDefault();
}

beforeEach(() => {
  document.addEventListener("click", stopNavigation);
});

afterEach(() => {
  document.removeEventListener("click", stopNavigation);
  cleanup();
});

function renderToolbar() {
  render(
    <BoardToolbar
      marketing={false}
      options={OPTIONS}
      query={parseBoardQuery(new URLSearchParams(""), OPTIONS)}
      showControls
      total={12}
    />
  );
  return {
    perPage: screen.getByTestId("per-page-menu") as HTMLDetailsElement,
    sort: screen.getByTestId("sort-menu") as HTMLDetailsElement,
  };
}

// Opening fires the native toggle event, which jsdom may queue as a task.
async function open(details: HTMLDetailsElement) {
  await act(async () => {
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
    await Promise.resolve();
  });
}

test("Escape closes the open menu and returns focus to its summary", async () => {
  const { sort } = renderToolbar();
  await open(sort);

  fireEvent.keyDown(document, { key: "Escape" });

  expect(sort.open).toBe(false);
  expect(document.activeElement).toBe(sort.querySelector("summary"));
});

test("opening a menu closes the one already open", async () => {
  const { perPage, sort } = renderToolbar();
  await open(perPage);
  await open(sort);

  expect(perPage.open).toBe(false);
  expect(sort.open).toBe(true);
});

test("a click outside closes the menu, a click inside keeps it open", async () => {
  const { sort } = renderToolbar();
  await open(sort);

  fireEvent.pointerDown(sort.querySelector("ul") as HTMLElement);
  expect(sort.open).toBe(true);

  fireEvent.pointerDown(document.body);
  expect(sort.open).toBe(false);
});

test("picking an option closes the menu", async () => {
  const { sort } = renderToolbar();
  await open(sort);

  fireEvent.click(screen.getByRole("link", { name: "Oldest" }));

  expect(sort.open).toBe(false);
});

test("keeps the details element and the props it is given", () => {
  render(
    <MenuDetails className="group" data-testid="menu">
      <summary>Type</summary>
    </MenuDetails>
  );

  const menu = screen.getByTestId("menu");
  expect(menu.tagName).toBe("DETAILS");
  expect(menu.className).toBe("group");
  expect(menu.hasAttribute("data-menu")).toBe(true);
});
