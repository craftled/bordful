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

const { AppLink } = await import("./app-link");

afterEach(() => {
  cleanup();
  seen.length = 0;
});

test("links do not prefetch unless asked to", () => {
  render(
    <>
      <AppLink href="/jobs/search?categories=sales">Sales</AppLink>
      <AppLink href="/jobs">Jobs</AppLink>
      <AppLink href="/companies" prefetch>
        Forced
      </AppLink>
    </>
  );
  expect(seen).toEqual([false, false, true]);
});
