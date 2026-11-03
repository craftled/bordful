// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";

import { isBoardHref, useSavedSearches } from "./saved-searches";

beforeEach(() => {
  window.localStorage.clear();
});

test("only board paths can be saved", () => {
  expect(isBoardHref("/")).toBe(true);
  expect(isBoardHref("/jobs/search?categories=design")).toBe(true);
  expect(isBoardHref("https://evil.example/jobs")).toBe(false);
  expect(isBoardHref("javascript:alert(1)")).toBe(false);
});

test("saves, replaces by href and removes searches in localStorage", () => {
  const { result } = renderHook(() => useSavedSearches());

  act(() =>
    result.current.save("  Design  ", "/jobs/search?categories=design")
  );
  expect(result.current.searches).toHaveLength(1);
  expect(result.current.searches[0]?.name).toBe("Design");

  act(() =>
    result.current.save("Design jobs", "/jobs/search?categories=design")
  );
  expect(result.current.searches).toHaveLength(1);
  expect(result.current.find("/jobs/search?categories=design")?.name).toBe(
    "Design jobs"
  );
  expect(window.localStorage.getItem("bordful:saved-searches")).toContain(
    "Design jobs"
  );

  const id = result.current.searches[0]?.id ?? "";
  act(() => result.current.remove(id));
  expect(result.current.searches).toHaveLength(0);
});
