import { expect, test } from "vitest";

import { nextThemePreference, parseThemePreference } from "./theme-preference";

test("cycles system, light, dark", () => {
  expect(nextThemePreference("system")).toBe("light");
  expect(nextThemePreference("light")).toBe("dark");
  expect(nextThemePreference("dark")).toBe("system");
});

test("anything but light or dark means system", () => {
  expect(parseThemePreference("dark")).toBe("dark");
  expect(parseThemePreference("light")).toBe("light");
  expect(parseThemePreference(null)).toBe("system");
  expect(parseThemePreference("blue")).toBe("system");
});
