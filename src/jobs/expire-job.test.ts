import { expect, test } from "vitest";

import { computeValidThrough } from "./expire-job";

const publishedAt = "2026-10-20T09:00:00.000Z";

test("paid listings last durationDays from publishedAt", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "paid",
      publishedAt,
      validThrough: null,
    })
  ).toBe("2026-11-19T09:00:00.000Z");
  expect(
    computeValidThrough({
      durationDays: 1,
      origin: "paid",
      publishedAt,
      validThrough: null,
    })
  ).toBe("2026-10-21T09:00:00.000Z");
  expect(
    computeValidThrough({
      durationDays: 365,
      origin: "paid",
      publishedAt,
      validThrough: null,
    })
  ).toBe("2027-10-20T09:00:00.000Z");
});

test("an owner-set validThrough is kept for paid listings", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "paid",
      publishedAt,
      validThrough: "2026-12-01T00:00:00.000Z",
    })
  ).toBe("2026-12-01T00:00:00.000Z");
});

test("a paid draft without publishedAt has no validThrough", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "paid",
      publishedAt: null,
      validThrough: null,
    })
  ).toBeNull();
});

test("non-paid origins keep the given validThrough", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "manual",
      publishedAt,
      validThrough: null,
    })
  ).toBeNull();
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "bordfeed",
      publishedAt,
      validThrough: "2026-11-01T00:00:00.000Z",
    })
  ).toBe("2026-11-01T00:00:00.000Z");
});

test("an invalid publishedAt leaves validThrough unchanged", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "paid",
      publishedAt: "not-a-date",
      validThrough: null,
    })
  ).toBeNull();
});
