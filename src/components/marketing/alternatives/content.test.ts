import { expect, test } from "vitest";

import {
  ALTERNATIVE_SLUGS,
  ALTERNATIVES,
  formatCheckedOn,
  staleSources,
} from "./registry";
import type { Alternative, Claim } from "./types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const DASH_PATTERN = /[\u2013\u2014]/u;

function allClaims(page: Alternative): Claim[] {
  return [
    page.lede,
    page.hub.summary,
    ...page.stay,
    ...page.switch,
    ...page.limits,
    ...page.comparison.flatMap((row) => [row.competitor, row.bordful]),
    ...page.pricing.flatMap((row) => [row.competitor, row.bordful]),
    ...page.migration.moves,
    ...page.migration.staysBehind,
    ...page.migration.steps.filter(
      (step): step is Claim => typeof step !== "string"
    ),
  ];
}

test("alternative slugs are unique lowercase kebab case", () => {
  expect(ALTERNATIVE_SLUGS).toEqual(["wp-job-manager"]);
  expect(new Set(ALTERNATIVES.map((page) => page.slug)).size).toBe(
    ALTERNATIVES.length
  );
  for (const page of ALTERNATIVES) {
    expect(page.slug).toMatch(SLUG_PATTERN);
  }
});

test("all sources have a unique id, valid HTTPS URL, date, title and fact", () => {
  for (const page of ALTERNATIVES) {
    expect(new Set(page.sources.map((source) => source.id)).size).toBe(
      page.sources.length
    );

    for (const source of page.sources) {
      expect(new URL(source.url).protocol).toBe("https:");
      expect(source.checkedOn).toMatch(ISO_DATE_PATTERN);
      expect(new Date(`${source.checkedOn}T00:00:00Z`).toISOString()).toContain(
        source.checkedOn
      );
      expect(source.title.trim()).not.toBe("");
      expect(source.fact.trim()).not.toBe("");
    }
  }
});

test("every claim points to a source and every source is cited", () => {
  for (const page of ALTERNATIVES) {
    const sourceIds = new Set<string>(page.sources.map((source) => source.id));
    const citedIds = new Set<string>();

    for (const claim of allClaims(page)) {
      expect(claim.sources.length).toBeGreaterThan(0);
      for (const id of claim.sources) {
        expect(sourceIds.has(id), `unknown source ${id}`).toBe(true);
        citedIds.add(id);
      }
    }

    expect(citedIds).toEqual(sourceIds);

    for (const row of [...page.comparison, ...page.pricing]) {
      expect(
        row.competitor.sources.some((id) => {
          const url =
            page.sources.find((source) => source.id === id)?.url ?? "";
          const host = new URL(url).hostname;
          return (
            host !== "bordful.com" &&
            url !== "https://github.com/craftled/bordful"
          );
        })
      ).toBe(true);
      expect(
        row.bordful.sources.some((id) => {
          const url =
            page.sources.find((source) => source.id === id)?.url ?? "";
          return (
            new URL(url).hostname === "bordful.com" ||
            url === "https://github.com/craftled/bordful"
          );
        })
      ).toBe(true);
    }
  }
});

test("stay list and FAQ requirements are met", () => {
  for (const page of ALTERNATIVES) {
    expect(page.stay.length).toBeGreaterThan(0);
    expect(page.faq.length).toBeGreaterThanOrEqual(4);
    expect(page.faq.length).toBeLessThanOrEqual(6);
    expect(
      page.faq.some((item) =>
        item.question.toLowerCase().includes("alternative")
      )
    ).toBe(true);
    expect(page.faq.some((item) => item.question.includes(" vs "))).toBe(true);
  }
});

// ALTERNATIVES_FACTS_NOW freezes a snapshot for the freshness test, not to silence stale facts.
test("sources are no more than 45 days old", () => {
  const now = process.env.ALTERNATIVES_FACTS_NOW
    ? new Date(`${process.env.ALTERNATIVES_FACTS_NOW}T00:00:00Z`)
    : new Date();

  for (const page of ALTERNATIVES) {
    expect(staleSources(page, now)).toEqual([]);
  }
});

test("freshness helper reports a source that is 46 days old", () => {
  const [page] = ALTERNATIVES;
  if (!page) {
    throw new Error("Expected a registered alternative");
  }
  const now = new Date("2026-12-02T00:00:00Z");
  const stalePage = {
    ...page,
    sources: page.sources.map((source, index) => ({
      ...source,
      checkedOn: index === 0 ? ("2026-10-17" as const) : source.checkedOn,
    })),
  };

  expect(staleSources(stalePage, now).map((source) => source.id)).toContain(
    page.sources[0]?.id
  );
});

test("registry has no em dash or en dash and dates format in UTC", () => {
  expect(JSON.stringify(ALTERNATIVES)).not.toMatch(DASH_PATTERN);
  expect(formatCheckedOn("2026-11-16")).toBe("16 November 2026");
});
