import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "vitest";

import { PAYLOAD_MONACO_CDN } from "./build-csp";

const MONACO_CDN =
  /https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@[^/"']+\/min\/vs/gu;

test("the admin CSP allows the Monaco folder Payload's code editor loads", () => {
  const client = join(
    process.cwd(),
    "node_modules/@payloadcms/ui/dist/exports/client"
  );
  const found = new Set<string>();
  for (const file of readdirSync(client)) {
    if (file.endsWith(".js")) {
      for (const match of readFileSync(join(client, file), "utf8").matchAll(
        MONACO_CDN
      )) {
        found.add(`${match[0]}/`);
      }
    }
  }

  expect([...found]).toEqual([PAYLOAD_MONACO_CDN]);
});
