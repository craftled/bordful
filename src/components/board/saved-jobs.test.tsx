// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { useCallback } from "react";
import { afterEach, beforeEach, expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { parseJobListMeta, useJobList, useJobListMeta } from "./saved-jobs";
import { SavedJobsView, savedEntries, savedSummary } from "./saved-jobs-view";

const NOW = Date.parse("2026-11-03T12:00:00Z");

function card(slug: string, overrides: Partial<JobListItem> = {}): JobListItem {
  return {
    careerLevel: [],
    categories: [],
    companyLogoUrl: null,
    companyName: "Acme",
    companySlug: "acme",
    countryCode: null,
    employmentType: null,
    featured: false,
    id: slug,
    indexable: true,
    languages: [],
    locationDisplay: null,
    origin: "manual",
    publishedAt: null,
    remoteRegion: null,
    salaryCurrency: "USD",
    salaryMax: 190_000,
    salaryMaxUsd: null,
    salaryMin: 150_000,
    salaryMinUsd: null,
    seniority: null,
    slug,
    title: `Role ${slug}`,
    validThrough: null,
    visaSponsorship: null,
    workplaceType: "remote",
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

test("meta parsing keeps valid fields and drops junk", () => {
  expect(parseJobListMeta(null)).toEqual({});
  expect(parseJobListMeta("not json")).toEqual({});
  expect(parseJobListMeta("[1,2]")).toEqual({});
  expect(
    parseJobListMeta(
      JSON.stringify({
        a: { addedAt: 5, snapshot: { title: "T", validThrough: 3 } },
        b: "x",
        c: { addedAt: "soon", snapshot: { title: 1 } },
      })
    )
  ).toEqual({
    a: {
      addedAt: 5,
      snapshot: {
        companyName: "",
        location: "",
        salary: "",
        title: "T",
        validThrough: null,
      },
    },
    c: {},
  });
});

test("summary names closed jobs only when there are some", () => {
  expect(savedSummary(5, 1)).toBe("5 roles, 1 closed.");
  expect(savedSummary(1, 0)).toBe("1 role.");
});

test("entries keep saved order and fall back to the snapshot", () => {
  const entries = savedEntries(["b", "a"], new Map([["a", card("a")]]), {
    b: { addedAt: 1 },
  });
  expect(
    entries.map((entry) => [entry.slug, entry.card?.slug ?? null])
  ).toEqual([
    ["b", null],
    ["a", "a"],
  ]);
  expect(entries[0]?.addedAt).toBe(1);
});

function Harness() {
  const list = useJobList("saved");
  const { meta } = useJobListMeta("saved");
  const { add, remove } = list;
  const onAdd = useCallback(() => add("x"), [add]);
  const onRemove = useCallback(() => remove("x"), [remove]);
  return (
    <div>
      <button onClick={onAdd} type="button">
        add
      </button>
      <button onClick={onRemove} type="button">
        remove
      </button>
      <output data-testid="meta">{JSON.stringify(meta)}</output>
    </div>
  );
}

test("adding records when, removing forgets, and the list stays a string array", () => {
  render(<Harness />);
  act(() => screen.getByText("add").click());
  expect(window.localStorage.getItem("bordful:saved-jobs")).toBe('["x"]');
  const stored = JSON.parse(
    window.localStorage.getItem("bordful:saved-jobs-meta") ?? "{}"
  ) as { x?: { addedAt?: number } };
  expect(typeof stored.x?.addedAt).toBe("number");

  act(() => screen.getByText("remove").click());
  expect(window.localStorage.getItem("bordful:saved-jobs")).toBe("[]");
  expect(window.localStorage.getItem("bordful:saved-jobs-meta")).toBe("{}");
});

test("the page lists open and closed jobs and clears the closed ones", () => {
  render(
    <SavedJobsView
      alertsEnabled={false}
      boardHref="/jobs"
      cards={[card("a")]}
      kind="saved"
      now={NOW}
    />
  );
  // The store caches reads, so load the fixture the way another tab would.
  act(() => {
    window.localStorage.setItem(
      "bordful:saved-jobs",
      JSON.stringify(["a", "gone"])
    );
    window.localStorage.setItem(
      "bordful:saved-jobs-meta",
      JSON.stringify({
        gone: {
          snapshot: {
            companyName: "Neon",
            location: "Remote",
            salary: "$160k-190k",
            title: "Head of Design",
            validThrough: "2026-10-12T00:00:00Z",
          },
        },
      })
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: "bordful:saved-jobs" })
    );
  });

  expect(screen.getByTestId("job-count").textContent).toBe(
    "2 roles, 1 closed."
  );
  expect(screen.getAllByTestId("job-row")).toHaveLength(2);
  expect(screen.getByText("Head of Design")).toBeTruthy();
  expect(screen.getAllByText("Closed Oct 12").length).toBeGreaterThan(0);
  expect(screen.queryByText("Create alert")).toBeNull();

  act(() => screen.getByTestId("saved-tab-open").click());
  expect(screen.getAllByTestId("job-row")).toHaveLength(1);

  act(() => screen.getAllByTestId("saved-clear-closed")[0]?.click());
  expect(window.localStorage.getItem("bordful:saved-jobs")).toBe('["a"]');
  expect(screen.getByTestId("job-count").textContent).toBe("1 role.");
});

test("an empty list keeps the empty state", () => {
  render(
    <SavedJobsView
      alertsEnabled
      boardHref="/jobs"
      cards={[]}
      kind="saved"
      now={NOW}
    />
  );
  act(() => {
    window.localStorage.clear();
    window.dispatchEvent(
      new StorageEvent("storage", { key: "bordful:saved-jobs" })
    );
  });
  expect(screen.getByTestId("board-empty").textContent).toBe(
    "No saved jobs yet"
  );
  expect(screen.getByText("Create alert")).toBeTruthy();
});
