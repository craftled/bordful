import { expect, test } from "vitest";

import { toUsd } from "./fx";

test("converts known currencies and rejects unknown codes", () => {
  expect(toUsd(100_000, "EUR")).toBe(110_000);
  expect(toUsd(100_000, "USD")).toBe(100_000);
  expect(toUsd(1, "XXX")).toBeNull();
});
