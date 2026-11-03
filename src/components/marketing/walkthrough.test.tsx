// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Walkthrough } from "./walkthrough";

afterEach(() => {
  cleanup();
});

const LABELS = [
  "Browse and filter",
  "Read a role",
  "Come back with alerts",
  "Take paid posts",
  "Make it yours",
];

test("walkthrough renders five tabs with one panel visible", () => {
  render(<Walkthrough />);

  expect(screen.getAllByRole("tab")).toHaveLength(5);
  expect(
    LABELS.map((label) => screen.getByRole("tab", { name: label }))
  ).toHaveLength(5);

  const selected = screen.getByRole("tab", { selected: true });
  expect(selected.getAttribute("aria-labelledby")).toBeTruthy();
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
    selected.id
  );
});

test("clicking a tab selects it and shows its panel", () => {
  render(<Walkthrough />);

  const tab = screen.getByRole("tab", { name: "Make it yours" });
  fireEvent.click(tab);

  expect(tab.getAttribute("aria-selected")).toBe("true");
  expect(tab.getAttribute("tabindex")).toBe("0");
  expect(screen.getByRole("tabpanel").id).toBe(
    tab.getAttribute("aria-controls")
  );
});

test("arrow keys move selection and focus, wrapping at the ends", () => {
  render(<Walkthrough />);

  const first = screen.getByRole("tab", { name: "Browse and filter" });
  fireEvent.click(first);
  fireEvent.keyDown(first, { key: "ArrowUp" });

  const last = screen.getByRole("tab", { name: "Make it yours" });
  expect(last.getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(last);

  fireEvent.keyDown(last, { key: "Home" });
  expect(first.getAttribute("aria-selected")).toBe("true");
});
