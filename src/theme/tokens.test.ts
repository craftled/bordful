import { expect, test } from "vitest";

import {
  DEFAULT_THEME_TOKENS,
  resolveThemeTokens,
  tokensToCssVariables,
} from "./tokens";

test("tokensToCssVariables emits the fixed variable list", () => {
  expect(tokensToCssVariables(DEFAULT_THEME_TOKENS)).toBe(
    "--background:#ffffff;--foreground:#0a0a0a;--primary:#171717;--primary-foreground:#fafafa;--muted:#f5f5f5;--muted-foreground:#737373;--accent:#f5f5f5;--accent-foreground:#171717;--border:#e5e5e5;--ring:#a3a3a3;--radius:0.625rem;--font-heading:system-ui, sans-serif;--font-body:system-ui, sans-serif;"
  );
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
