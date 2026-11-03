import { expect, test } from "vitest";

import {
  DEFAULT_THEME_TOKENS,
  resolveThemeTokens,
  tokensToCssVariables,
} from "./tokens";

test("tokensToCssVariables emits the fixed variable list", () => {
  expect(tokensToCssVariables(DEFAULT_THEME_TOKENS)).toBe(
    "--background:#ffffff;--foreground:#18181b;--primary:#164e63;--primary-foreground:#ffffff;--muted:#f9fafb;--muted-foreground:#52525b;--accent:#f4f4f5;--accent-foreground:#18181b;--border:#e4e4e7;--ring:#164e63;--radius:0.5rem;--font-heading:var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;--font-body:var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;"
  );
});

test("default theme uses the old Bordful zinc look with cyan primary", () => {
  expect(DEFAULT_THEME_TOKENS.colors.primary).toBe("#164e63");
  expect(DEFAULT_THEME_TOKENS.colors.background).toBe("#ffffff");
  expect(DEFAULT_THEME_TOKENS.colors.foreground).toBe("#18181b");
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
