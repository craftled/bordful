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
  expect(
    screen.queryByText("Sorry, we couldn't find the page you're looking for.")
  ).toBeNull();
  expect(screen.queryByTestId("marketing-header")).toBeNull();
});

test("marketing not found is branded when the flag is on", () => {
  process.env.BORDFUL_MARKETING = "true";
  render(<NotFound />);

  expect(screen.getByRole("heading", { name: "404" })).toBeTruthy();
  expect(
    screen.getByText("Sorry, we couldn't find the page you're looking for.")
  ).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Go Home" }).getAttribute("href")
  ).toBe("/");
});

test("marketing not found links phones to the homepage, Docs, Pricing and Showcase", () => {
  process.env.BORDFUL_MARKETING = "true";
  render(<NotFound />);

  expect(
    screen
      .getByRole("link", { name: "Go to the homepage" })
      .getAttribute("href")
  ).toBe("/");
  expect(
    screen.getByRole("link", { name: "Read the docs" }).getAttribute("href")
  ).toBe("/docs");
  for (const [label, href] of [
    ["Docs", "/docs"],
    ["Pricing", "/pricing"],
    ["Showcase", "/showcase"],
  ] as const) {
    expect(
      screen
        .getByRole("link", { name: new RegExp(`^${label}`, "u") })
        .getAttribute("href")
    ).toBe(href);
  }
});
