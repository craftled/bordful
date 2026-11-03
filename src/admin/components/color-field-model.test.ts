import { expect, test } from "vitest";

import { colorFieldModel } from "./color-field-model";

test("colorFieldModel uses the typed color when it is a hex value", () => {
  expect(colorFieldModel("#2563eb", "#ffffff", "primary")).toEqual({
    lowContrast: false,
    ratio: 5.17,
    swatch: "#2563eb",
  });
});

test("colorFieldModel falls back to the default pair when both values are empty", () => {
  expect(colorFieldModel("", "", "primary")).toEqual({
    lowContrast: false,
    ratio: 9.11,
    swatch: "#164e63",
  });
});

test("colorFieldModel flags a pair below 4.5", () => {
  expect(colorFieldModel("#ffff00", "#ffffff", "primary").lowContrast).toBe(
    true
  );
});
