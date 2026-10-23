// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";

import { MarketingHeader } from "./marketing-header";

test("marketing header nav links stay in contract order", () => {
  render(<MarketingHeader />);

  const nav = screen.getByRole("navigation", { name: "Primary" });
  const hrefs = within(nav)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));

  expect(hrefs).toEqual(["/jobs", "/pricing", "/showcase", "/changelog"]);
});
