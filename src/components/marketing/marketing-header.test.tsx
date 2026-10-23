// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { MarketingHeader } from "./marketing-header";

afterEach(() => {
  cleanup();
});

test("marketing header nav links stay in contract order", () => {
  render(<MarketingHeader />);

  const nav = screen.getByRole("navigation", { name: "Primary" });
  const hrefs = within(nav)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));

  expect(hrefs).toEqual(["/jobs", "/pricing", "/showcase", "/changelog"]);
});

test("mobile nav links use the same hrefs", () => {
  render(<MarketingHeader />);

  const nav = screen.getByRole("navigation", { name: "Mobile" });
  const hrefs = within(nav)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));

  expect(hrefs).toEqual(["/jobs", "/pricing", "/showcase", "/changelog"]);
});
