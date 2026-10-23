import { expect, test } from "vitest";

import { contrastRatio, pairedColorKey } from "./contrast";

test("contrastRatio uses the WCAG formula rounded to two decimals", () => {
  expect(contrastRatio("#171717", "#fafafa")).toBe(17.18);
  expect(contrastRatio("#ffffff", "#000000")).toBe(21);
  expect(contrastRatio("#2563eb", "#ffffff")).toBe(5.17);
  expect(contrastRatio("#ffff00", "#ffffff")).toBe(1.07);
  expect(contrastRatio("red", "#ffffff")).toBeNull();
});

test("pairedColorKey returns the other color in a contrast pair", () => {
  expect(pairedColorKey("primaryForeground")).toBe("primary");
  expect(pairedColorKey("border")).toBeNull();
});
