import { expect, test } from "vitest";

import { boardHomePath, getNav } from "./nav";

const BOARD_FEEDS = {
  id: "feeds",
  items: [
    { href: "/feed.xml", id: "feed-rss", label: "RSS" },
    { href: "/atom.xml", id: "feed-atom", label: "Atom" },
    { href: "/feed.json", id: "feed-json", label: "JSON" },
  ],
  title: "Job feeds",
};

test("fork nav with both features off", () => {
  expect(
    getNav({ alertsEnabled: false, marketing: false, postJobEnabled: false })
  ).toEqual({
    cta: null,
    footer: [{ href: "/feed.xml", id: "feed", label: "RSS" }],
    footerColumns: [
      {
        id: "jobs",
        items: [
          { href: "/", id: "all-jobs", label: "All jobs" },
          { href: "/jobs#job-types", id: "job-types", label: "Job types" },
          { href: "/jobs#locations", id: "locations", label: "Locations" },
          { href: "/jobs#levels", id: "levels", label: "Levels" },
          { href: "/jobs#languages", id: "languages", label: "Languages" },
          { href: "/companies", id: "companies", label: "Companies" },
        ],
        title: "Jobs",
      },
      BOARD_FEEDS,
    ],
    header: [
      { href: "/", id: "jobs", label: "Jobs" },
      { href: "/companies", id: "companies", label: "Companies" },
    ],
  });
});

test("post a job is the cta, not a header link, when enabled", () => {
  const nav = getNav({
    alertsEnabled: true,
    marketing: false,
    postJobEnabled: true,
  });

  expect(nav.cta).toEqual({ href: "/post", id: "post", label: "Post a job" });
  expect(nav.header).toEqual([
    { href: "/", id: "jobs", label: "Jobs" },
    { href: "/companies", id: "companies", label: "Companies" },
    { href: "/alerts", id: "alerts", label: "Job alerts" },
  ]);
});

test("board-only footer omits marketing pages", () => {
  const { footerColumns } = getNav({
    alertsEnabled: false,
    marketing: false,
    postJobEnabled: true,
  });
  const hrefs = footerColumns.flatMap((column) =>
    column.items.map((item) => item.href)
  );

  expect(footerColumns.map((column) => column.title)).toEqual([
    "Jobs",
    "Job feeds",
  ]);
  for (const page of ["/about", "/privacy", "/terms", "/pricing"]) {
    expect(hrefs).not.toContain(page);
  }
});

test("marketing nav points at the marketing routes", () => {
  expect(
    getNav({ alertsEnabled: false, marketing: true, postJobEnabled: false })
  ).toEqual({
    cta: null,
    footer: [
      { href: "/about", id: "about", label: "About" },
      { href: "/privacy", id: "privacy", label: "Privacy" },
      { href: "/terms", id: "terms", label: "Terms" },
      { href: "/feed.xml", id: "feed", label: "RSS" },
    ],
    footerColumns: [
      {
        id: "jobs",
        items: [
          { href: "/jobs", id: "all-jobs", label: "All jobs" },
          { href: "/companies", id: "companies", label: "Companies" },
        ],
        title: "Jobs",
      },
      BOARD_FEEDS,
      {
        id: "company",
        items: [
          { href: "/about", id: "about", label: "About" },
          { href: "/pricing", id: "pricing", label: "Pricing" },
          { href: "/changelog", id: "changelog", label: "Changelog" },
        ],
        title: "Company",
      },
      {
        id: "legal",
        items: [
          { href: "/privacy", id: "privacy", label: "Privacy" },
          { href: "/terms", id: "terms", label: "Terms" },
        ],
        title: "Legal",
      },
    ],
    header: [
      { href: "/jobs", id: "jobs", label: "Jobs" },
      { href: "/pricing", id: "pricing", label: "Pricing" },
      { href: "/showcase", id: "showcase", label: "Showcase" },
      { href: "/changelog", id: "changelog", label: "Changelog" },
    ],
  });
});

test("board home path follows the mode", () => {
  expect(boardHomePath(false)).toBe("/");
  expect(boardHomePath(true)).toBe("/jobs");
});
