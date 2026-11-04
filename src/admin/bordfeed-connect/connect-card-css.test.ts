import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { expect, test } from "vitest";

const css = readFileSync(
  path.join(import.meta.dirname, "connect-card.module.css"),
  "utf8"
);
const payloadCss = readFileSync(
  createRequire(import.meta.url).resolve("@payloadcms/ui/css"),
  "utf8"
);

// A declaration that reads a --theme-* variable, and the --color-* fallback.
const THEME_USE = /var\(--theme-[\w-]+(?<rest>[^;]*);/gu;
const COLOR_FALLBACK = /var\((?<name>--color-[\w-]+)\)/u;

// Payload 4 no longer defines --theme-*, so each one needs a fallback.
test("every --theme-* value falls back to a variable Payload defines", () => {
  const uses = [...css.matchAll(THEME_USE)];
  expect(uses.length).toBeGreaterThan(0);

  for (const use of uses) {
    const fallback = use.groups?.rest?.match(COLOR_FALLBACK)?.groups?.name;
    expect(fallback).toBeDefined();
    expect(payloadCss).toContain(`${fallback}:`);
  }
});
