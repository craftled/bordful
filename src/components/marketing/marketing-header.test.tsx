// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { DEPLOY_URL } from "./links";
import { MarketingHeader } from "./marketing-header";
import { MARKETING_HEADER_LINKS } from "./nav-links";
import { GITHUB_URL } from "./site";

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

test("header deploy button opens the Vercel clone flow", () => {
  render(<MarketingHeader />);

  const deploy = screen.getByRole("link", { name: "Deploy" });
  expect(deploy.getAttribute("href")).toBe(DEPLOY_URL);
  expect(deploy.getAttribute("target")).toBe("_blank");
  expect(deploy.getAttribute("rel")).toBe("noopener noreferrer");
});

test("header shows one GitHub button per menu and no GitHub icon link", () => {
  render(<MarketingHeader />);

  const github = screen.getAllByRole("link", { name: "GitHub" });
  expect(github.length).toBeGreaterThan(0);
  for (const link of github) {
    expect(link.getAttribute("href")).toBe(GITHUB_URL);
  }
  expect(
    screen.queryAllByRole("link", { name: "GitHub, craftled/bordful" })
  ).toHaveLength(0);
});
