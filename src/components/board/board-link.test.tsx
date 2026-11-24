// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const seen: unknown[] = [];

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    href,
    children,
  }: {
    children?: React.ReactNode;
    href: string;
    prefetch?: unknown;
  }) => {
    seen.push(prefetch);
    return <a href={href}>{children}</a>;
  },
}));

const { BoardLink, isSearchHref } = await import("./board-link");

afterEach(() => {
  cleanup();
  seen.length = 0;
});

test("isSearchHref matches /jobs/search with or without a query", () => {
  expect(isSearchHref("/jobs/search")).toBe(true);
  expect(isSearchHref("/jobs/search?categories=sales")).toBe(true);
  expect(isSearchHref({ pathname: "/jobs/search", query: { q: "x" } })).toBe(
    true
  );
  expect(isSearchHref("/jobs")).toBe(false);
  expect(isSearchHref("/jobs/searching")).toBe(false);
  expect(isSearchHref("/jobs/location/remote")).toBe(false);
});

test("search links do not prefetch; other links keep the default", () => {
  render(
    <>
      <BoardLink href="/jobs/search?categories=sales">Sales</BoardLink>
      <BoardLink href="/jobs">Jobs</BoardLink>
      <BoardLink href="/jobs/search" prefetch>
        Forced
      </BoardLink>
    </>
  );
  expect(seen).toEqual([false, undefined, true]);
});
