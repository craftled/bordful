// biome-ignore-all lint/performance/useTopLevelRegex: small build-time parser
// biome-ignore-all lint/style/useNamedCaptureGroup: positional groups are clearer here
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "vitest";

import { DOCS_SLUGS, readDoc } from "./docs-content";

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
