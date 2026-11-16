// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { CUSTOM_SETUP_URL, DEPLOY_URL } from "@/components/marketing/links";

import { AlternativeView } from "./alternative-page";
import { wpJobManager } from "./wp-job-manager";

const ALTERNATIVE_HEADING = /WP Job Manager alternative/u;

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

test("renders the sourced WP Job Manager comparison page", () => {
  render(<AlternativeView page={wpJobManager} />);

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: ALTERNATIVE_HEADING,
    })
  ).toBeTruthy();
  expect(
    screen.getByRole("table", { name: "WP Job Manager and Bordful compared" })
  ).toBeTruthy();
  expect(screen.getByRole("table", { name: "Pricing compared" })).toBeTruthy();

  for (const item of wpJobManager.faq) {
    expect(screen.getByText(item.answer)).toBeTruthy();
  }

  expect(
    screen.getByText("Facts last checked: 16 November 2026, Europe/Madrid.")
  ).toBeTruthy();
  expect(screen.getByLabelText("Breadcrumb")).toBeTruthy();
  expect(document.querySelector('[aria-current="page"]')?.textContent).toBe(
    "WP Job Manager"
  );
  expect(
    screen
      .getAllByRole("link", { name: "Deploy to Vercel" })
      .map((link) => link.getAttribute("href"))
  ).toEqual([DEPLOY_URL, DEPLOY_URL]);
  expect(
    screen
      .getAllByRole("link", { name: "Custom Setup, $999 once" })
      .map((link) => link.getAttribute("href"))
  ).toEqual([CUSTOM_SETUP_URL, CUSTOM_SETUP_URL]);

  const related = screen.getByRole("link", { name: "All alternatives" });
  expect(related.getAttribute("href")).toBe("/alternatives");
  expect(
    document.querySelector(
      'a[href="/alternatives/niceboard"], a[href="/alternatives/jboard"], a[href="/alternatives/job-boardly"]'
    )
  ).toBeNull();

  for (const table of screen.getAllByRole("table")) {
    const region = table.parentElement;
    expect(region?.tagName).toBe("SECTION");
    expect(region?.getAttribute("tabindex")).toBe("0");
    expect(region?.getAttribute("aria-label")).toBeTruthy();
  }

  expect(
    document.querySelectorAll('a[href^="#source-"]').length
  ).toBeGreaterThan(0);
});
