import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "vitest";

const css = readFileSync(path.join(import.meta.dirname, "globals.css"), "utf8");
const WRAP_ANYWHERE = /overflow-wrap:\s*anywhere/u;
const SHRINKS = /min-width:\s*0/u;

// The top-level declarations of .bordful-prose, before its nested rules.
function proseRoot(): string {
  const start = css.indexOf(".bordful-prose {");
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("> :first-child", start));
}

// Imported descriptions use no-break spaces (U+00A0, U+202F) and long URLs,
// which made job pages 510px wide at a 390px viewport.
test("job descriptions wrap unbreakable runs instead of widening the page", () => {
  const root = proseRoot();

  expect(root).toMatch(WRAP_ANYWHERE);
  expect(root).toMatch(SHRINKS);
});
