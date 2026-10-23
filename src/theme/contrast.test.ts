import { expect, test } from "vitest";

import {
  contrastRatio,
  pairedColorKey,
  THEME_CONTRAST_PAIRS,
} from "./contrast";
import { DEFAULT_THEME_TOKENS } from "./tokens";

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

test("every default contrast pair passes WCAG AA for normal text", () => {
  for (const [left, right] of THEME_CONTRAST_PAIRS) {
    const ratio = contrastRatio(
      DEFAULT_THEME_TOKENS.colors[left],
      DEFAULT_THEME_TOKENS.colors[right]
    );
    expect(ratio, `${left} on ${right}`).toBeGreaterThanOrEqual(4.5);
  }
});
