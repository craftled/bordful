// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import NotFound from "./not-found";

const previous = process.env.BORDFUL_MARKETING;

afterEach(() => {
  cleanup();

  if (previous === undefined) {
    delete process.env.BORDFUL_MARKETING;
  } else {
    process.env.BORDFUL_MARKETING = previous;
  }
});

test("marketing not found is the plain stub when the flag is off", () => {
  process.env.BORDFUL_MARKETING = "false";
  render(<NotFound />);

  expect(screen.getByRole("heading", { name: "Page not found" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe(
    "/"
  );
  expect(screen.queryByText("Sorry, we could not find that page.")).toBeNull();
  expect(screen.queryByTestId("marketing-header")).toBeNull();
});

test("marketing not found is branded when the flag is on", () => {
  process.env.BORDFUL_MARKETING = "true";
  render(<NotFound />);

  expect(screen.getByRole("heading", { name: "404" })).toBeTruthy();
  expect(screen.getByText("Sorry, we could not find that page.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe(
    "/"
  );
});
