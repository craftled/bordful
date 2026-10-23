import { expect, test } from "vitest";

import { boardHomePath, getNav } from "./nav";

test("fork nav with both features off", () => {
  expect(
    getNav({ alertsEnabled: false, marketing: false, postJobEnabled: false })
  ).toEqual({
    footer: [{ href: "/feed.xml", id: "feed", label: "RSS" }],
    header: [
      { href: "/", id: "jobs", label: "Jobs" },
      { href: "/companies", id: "companies", label: "Companies" },
    ],
  });
});

test("fork nav adds alerts then post a job", () => {
  expect(
    getNav({ alertsEnabled: true, marketing: false, postJobEnabled: true })
  ).toEqual({
    footer: [{ href: "/feed.xml", id: "feed", label: "RSS" }],
    header: [
      { href: "/", id: "jobs", label: "Jobs" },
      { href: "/companies", id: "companies", label: "Companies" },
      { href: "/alerts", id: "alerts", label: "Job alerts" },
      { href: "/post", id: "post", label: "Post a job" },
    ],
  });
});

test("marketing nav points at the marketing routes", () => {
  expect(
    getNav({ alertsEnabled: false, marketing: true, postJobEnabled: false })
  ).toEqual({
    footer: [
      { href: "/about", id: "about", label: "About" },
      { href: "/privacy", id: "privacy", label: "Privacy" },
      { href: "/terms", id: "terms", label: "Terms" },
      { href: "/feed.xml", id: "feed", label: "RSS" },
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
