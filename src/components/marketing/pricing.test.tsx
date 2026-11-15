// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Pricing } from "./pricing";

afterEach(() => {
  cleanup();
});

test("section pricing plan names are headings", () => {
  render(<Pricing />);

  expect(
    screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent)
  ).toEqual(["Open Source", "Custom Setup"]);
});

test("standalone pricing plan names are headings", () => {
  render(<Pricing variant="standalone" />);

  expect(
    screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent)
  ).toEqual(["Open Source", "Custom Setup"]);
});

test("section pricing features and payment note are shown in order", () => {
  render(<Pricing />);

  expect(
    screen.getAllByRole("listitem").map((item) => item.textContent)
  ).toEqual([
    "✓Full job board features",
    "✓Bordfeed integration",
    "✓MIT license",
    "✓Community support",
    "✓Full installation",
    "✓1 year of Bordfeed Pro ($758 value)",
    "✓Bordfeed integration",
    "✓Custom domain setup",
    "✓1-hour consultation",
  ]);
  expect(
    screen.getByText(
      "Payments by Stripe. Prices in USD, VAT may apply. Bordfeed Pro is included with Custom Setup for 12 months."
    )
  ).toBeTruthy();
});

test("standalone pricing features are shown in order", () => {
  render(<Pricing variant="standalone" />);

  expect(
    screen.getAllByRole("listitem").map((item) => item.textContent)
  ).toEqual([
    "Next.js codebase",
    "Full job board features",
    "Bordfeed integration",
    "Self-hosted solution",
    "MIT license",
    "Community support",
    "Full installation service",
    "1 year of Bordfeed Pro ($758 value)",
    "Bordfeed integration",
    "Custom domain setup",
    "One-time payment",
    "1-hour consultation",
    "Community support",
  ]);
});
