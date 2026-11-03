// biome-ignore-all lint/performance/useTopLevelRegex: small build-time parser
// biome-ignore-all lint/style/useNamedCaptureGroup: positional groups are clearer here
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "vitest";

import { DOCS_SLUGS, firstSentence, readDoc } from "./docs-content";

test("every file in /docs is in the sidebar", () => {
  const files = readdirSync(join(process.cwd(), "docs"))
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/u, ""))
    .sort();
  expect([...DOCS_SLUGS].sort()).toEqual(files);
});

test("readDoc rejects unknown and traversal slugs", () => {
  expect(readDoc("../package")).toBeNull();
  expect(readDoc("nope")).toBeNull();
  expect(readDoc("deploy")).toContain("# Deploy");
});

test("firstSentence keeps the opening sentence whole", () => {
  expect(
    firstSentence("Defaults live in src/theme/tokens.ts. Site settings win.")
  ).toBe("Defaults live in src/theme/tokens.ts.");
  expect(firstSentence("Two places: a.ts and b. Then more.")).toBe(
    "Two places: a.ts and b."
  );
  expect(firstSentence("Upstream does not edit these places:")).toBe(
    "Upstream does not edit these places."
  );
  expect(firstSentence("No full stop")).toBe("No full stop");
});
