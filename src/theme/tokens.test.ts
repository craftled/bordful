import { expect, test } from "vitest";

import {
  DEFAULT_THEME_TOKENS,
  resolveThemeTokens,
  tokensToCssVariables,
} from "./tokens";

test("tokensToCssVariables emits the fixed variable list", () => {
  expect(tokensToCssVariables(DEFAULT_THEME_TOKENS)).toBe(
    "--background:#f5f5f4;--foreground:#161616;--primary:#161616;--primary-foreground:#ffffff;--muted:#f7f7f6;--muted-foreground:#5c5c5c;--accent:#f0f0ef;--accent-foreground:#161616;--border:#e4e4e3;--ring:#161616;--radius:0.5rem;--font-heading:var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;--font-body:var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;"
  );
});

test("default theme uses the Bordful 1.0 neutral palette", () => {
  expect(DEFAULT_THEME_TOKENS.colors.primary).toBe("#161616");
  expect(DEFAULT_THEME_TOKENS.colors.background).toBe("#f5f5f4");
  expect(DEFAULT_THEME_TOKENS.colors.foreground).toBe("#161616");
  expect(DEFAULT_THEME_TOKENS.radius).toBe(0.5);
  expect(DEFAULT_THEME_TOKENS.fontBody).toBe("sans");
  expect(DEFAULT_THEME_TOKENS.fontHeading).toBe("sans");
});

test("resolveThemeTokens keeps valid overrides and drops unsafe values", () => {
  expect(
    resolveThemeTokens({
      colors: { border: "red;}", primary: "#2563EB" },
      fontBody: "serif",
      radius: 9,
    })
  ).toEqual({
    ...DEFAULT_THEME_TOKENS,
    colors: { ...DEFAULT_THEME_TOKENS.colors, primary: "#2563eb" },
    fontBody: "serif",
  });
});
