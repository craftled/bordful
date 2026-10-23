import { expect, test } from "vitest";

import { resolveCronNow } from "./now";

const FIXED = "2026-11-20T09:00:00.000Z";

function requestWith(now?: string): Request {
  const url = new URL("http://localhost/api/cron/expire");
  if (now !== undefined) {
    url.searchParams.set("now", now);
  }

  return new Request(url);
}

test("an unset test clock ignores now", () => {
  const before = Date.now();
  const resolved = resolveCronNow(requestWith(FIXED), {});
  const after = Date.now();

  expect(resolved.toISOString()).not.toBe(FIXED);
  expect(resolved.getTime()).toBeGreaterThanOrEqual(before);
  expect(resolved.getTime()).toBeLessThanOrEqual(after);
});

test("a true test clock returns the now instant", () => {
  expect(
    resolveCronNow(requestWith(FIXED), {
      BORDFUL_TEST_CLOCK: "true",
    }).toISOString()
  ).toBe(FIXED);
});

test("an invalid ISO falls back to real time", () => {
  const before = Date.now();
  const resolved = resolveCronNow(requestWith("not-a-date"), {
    BORDFUL_TEST_CLOCK: "true",
  });
  const after = Date.now();

  expect(resolved.getTime()).toBeGreaterThanOrEqual(before);
  expect(resolved.getTime()).toBeLessThanOrEqual(after);
});
