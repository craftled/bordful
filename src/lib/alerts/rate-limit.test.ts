import { expect, test } from "vitest";

import {
  allowSubscribeIp,
  clientIp,
  subscribeRateLimitSize,
} from "./rate-limit";

function headers(values: Record<string, string>) {
  const list = new Headers(values);
  return { get: (name: string) => list.get(name) };
}

test("clientIp prefers the Vercel edge address over a spoofed forwarded header", () => {
  expect(
    clientIp(
      headers({
        "x-forwarded-for": "198.51.100.9",
        "x-real-ip": "198.51.100.8",
        "x-vercel-forwarded-for": "203.0.113.10, 198.51.100.1",
      }),
      true
    )
  ).toBe("203.0.113.10");
});

test("clientIp ignores x-vercel-forwarded-for off Vercel", () => {
  expect(
    clientIp(
      headers({
        "x-real-ip": "203.0.113.40",
        "x-vercel-forwarded-for": "198.51.100.66",
      }),
      false
    )
  ).toBe("203.0.113.40");
});

test("clientIp uses x-real-ip when the Vercel header is absent", () => {
  expect(
    clientIp(
      headers({
        "x-forwarded-for": "198.51.100.9",
        "x-real-ip": "203.0.113.20",
      })
    )
  ).toBe("203.0.113.20");
});

test("clientIp falls back to the first x-forwarded-for value", () => {
  expect(
    clientIp(headers({ "x-forwarded-for": "203.0.113.30, 198.51.100.1" }))
  ).toBe("203.0.113.30");
});

test("clientIp returns unknown when no address header is present", () => {
  expect(clientIp(headers({}))).toBe("unknown");
  expect(clientIp({ get: () => "  " })).toBe("unknown");
});

const WINDOW_MS = 10 * 60 * 1000;

test("allowSubscribeIp blocks the sixth hit inside the window", () => {
  const now = 1_700_000_000_000;
  const ip = "203.0.113.10";
  for (let hit = 0; hit < 5; hit += 1) {
    expect(allowSubscribeIp(ip, now + hit)).toBe(true);
  }
  expect(allowSubscribeIp(ip, now + 5)).toBe(false);
  expect(allowSubscribeIp(ip, now + WINDOW_MS + 5)).toBe(true);
});

test("allowSubscribeIp sweeps expired addresses and caps the map", () => {
  const expiredAt = 1_800_000_000_000;
  const freshAt = expiredAt + WINDOW_MS;
  for (let index = 0; index < 10_000; index += 1) {
    expect(allowSubscribeIp(`expired-${index}`, expiredAt)).toBe(true);
  }

  expect(allowSubscribeIp("fresh-ip", freshAt)).toBe(true);
  expect(subscribeRateLimitSize()).toBe(1);

  const crowdedAt = freshAt + WINDOW_MS;
  for (let hit = 0; hit < 5; hit += 1) {
    expect(allowSubscribeIp("keeper", crowdedAt)).toBe(true);
  }
  expect(allowSubscribeIp("keeper", crowdedAt)).toBe(false);
  for (let index = 0; index < 10_000; index += 1) {
    expect(allowSubscribeIp(`crowded-${index}`, crowdedAt + 1)).toBe(true);
  }
  expect(subscribeRateLimitSize()).toBeLessThanOrEqual(10_000);
  expect(allowSubscribeIp("keeper", crowdedAt + 1)).toBe(true);
  expect(subscribeRateLimitSize()).toBeLessThanOrEqual(10_000);
});
