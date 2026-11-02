// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { MarketingHeader } from "./marketing-header";
import { MARKETING_HEADER_LINKS } from "./nav-links";
import { SOCIAL_LINKS } from "./site";

const MARKETING_HEADER_HREFS = MARKETING_HEADER_LINKS.map((link) => link.href);

afterEach(() => {
  cleanup();
});

test("marketing header nav links keep the old order", () => {
  render(<MarketingHeader />);

  const nav = screen.getByRole("navigation", { name: "Primary" });
  const hrefs = within(nav)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));

  expect(hrefs).toEqual(MARKETING_HEADER_HREFS);
});

test("mobile nav links use the same hrefs", () => {
  render(<MarketingHeader />);

  const nav = screen.getByRole("navigation", { name: "Mobile" });
  const hrefs = within(nav)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));

  expect(hrefs).toEqual(MARKETING_HEADER_HREFS);
});

test("header social icons carry accessible names", () => {
  render(<MarketingHeader />);

  for (const link of SOCIAL_LINKS) {
    const anchors = screen.getAllByRole("link", { name: link.name });
    expect(anchors.length).toBeGreaterThan(0);
    expect(anchors[0]?.getAttribute("href")).toBe(link.href);
  }
});
