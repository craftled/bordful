import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "vitest";

interface FlowEntry {
  enabled: boolean;
  file: string;
  id: string;
  requires: string[];
}

const e2eDir = path.resolve("tests/e2e");
const registry = JSON.parse(
  readFileSync(path.join(e2eDir, "flows.json"), "utf8")
) as { flows: FlowEntry[] };

const LANES = ["L1", "L2", "L3a", "L3b", "L4", "L5", "L6", "L7", "L8"];
const IDS = [
  "S0-smoke",
  "S0-admin-login",
  "E1",
  "E2",
  "E3",
  "E4",
  "E5",
  "E6",
  "E7",
  "E8",
  "E9",
  "E10",
  "E11",
  "E12",
  "E13",
];

test("flow ids are the S0 pair followed by E1 through E13", () => {
  expect(registry.flows.map((flow) => flow.id)).toEqual(IDS);
});

test("every e2e spec appears once", () => {
  const specs = readdirSync(e2eDir)
    .filter((name) => name.endsWith(".spec.ts"))
    .sort();
  const files = registry.flows.map((flow) => flow.file);
  expect([...files].sort()).toEqual(specs);
  expect(new Set(files).size).toBe(files.length);
});

test("listed files exist and requires names are lanes", () => {
  for (const flow of registry.flows) {
    expect(existsSync(path.join(e2eDir, flow.file))).toBe(true);
    for (const lane of flow.requires) {
      expect(LANES).toContain(lane);
    }
  }
});

test("spec sources do not skip, fixme, or only", () => {
  const specs = readdirSync(e2eDir).filter((name) => name.endsWith(".spec.ts"));
  for (const name of specs) {
    const source = readFileSync(path.join(e2eDir, name), "utf8");
    expect(source.includes(".skip(")).toBe(false);
    expect(source.includes(".fixme(")).toBe(false);
    expect(source.includes(".only(")).toBe(false);
  }
});
