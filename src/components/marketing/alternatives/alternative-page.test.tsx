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
    const answer = screen.getByText(item.answer, { exact: false });
    expect(answer.textContent?.startsWith(item.answer)).toBe(true);
    expect(answer.querySelectorAll('a[href^="#source-"]')).toHaveLength(
      item.sources.length
    );
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
    expect(table.querySelector("thead")?.className).toContain("max-md:sr-only");
    for (const row of table.querySelectorAll("tbody tr")) {
      expect(row.getAttribute("role")).toBe("row");
      expect(row.querySelector('[role="rowheader"]')).toBeTruthy();
      expect(row.querySelectorAll('[role="cell"]')).toHaveLength(2);
      expect(row.querySelector('[role="cell"]')?.textContent).toContain(
        "WP Job Manager"
      );
      expect(row.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    }
    for (const cell of table.querySelectorAll("th, td")) {
      expect(["columnheader", "rowheader", "cell"]).toContain(
        cell.getAttribute("role")
      );
    }

    for (const cell of table.querySelectorAll("tbody td")) {
      const markerNumbers = [...cell.querySelectorAll('a[href^="#source-"]')]
        .map((link) => Number(link.textContent?.replace(/\D/gu, "")))
        .filter(Number.isFinite);
      expect(markerNumbers).toEqual([...markerNumbers].sort((a, b) => a - b));
    }
  }

  expect(
    document.querySelectorAll('a[href^="#source-"]').length
  ).toBeGreaterThan(0);
});

test("the shared template derives competitor labels from the page", () => {
  render(
    <AlternativeView page={{ ...wpJobManager, name: "Example Plugin" }} />
  );

  expect(
    screen.getByRole("heading", { name: "Stay on Example Plugin when" })
  ).toBeTruthy();
  expect(
    screen.getByRole("table", { name: "Example Plugin and Bordful compared" })
  ).toBeTruthy();
  expect(
    screen.getAllByRole("columnheader", { name: "Example Plugin" })
  ).toHaveLength(2);
  expect(
    screen.getByRole("heading", {
      name: "Moving from Example Plugintakes a little work.",
    })
  ).toBeTruthy();
});
