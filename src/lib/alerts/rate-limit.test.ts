import { expect, test } from "vitest";

import { allowSubscribeIp, subscribeRateLimitSize } from "./rate-limit";

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
