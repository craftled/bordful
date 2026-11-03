// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { BrandMark } from "./brand-mark";

afterEach(() => {
  cleanup();
});

test("a fork without a logo gets the generic mark", () => {
  render(<BrandMark />);
  expect(screen.queryByTestId("bordful-mark")).toBeNull();
});

test("bordful.com gets the Bordful mark, inverted in dark mode", () => {
  render(<BrandMark bordful />);
  const mark = screen.getByTestId("bordful-mark");
  expect(mark.getAttribute("src")).toBe("/marketing/logos/bordful.svg");
  expect(mark.className).toContain("dark:invert");
});
