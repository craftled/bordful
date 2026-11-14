import { expect, test } from "vitest";

import { matchTextIndex } from "./text-index";

const index = [
  { id: "1", text: "shape the hiring flow.\nprototyping" },
  { id: "2", text: "equity of 0.5% for early hires.\na_b" },
  { id: "3", text: String.raw`reads files under c:\data every night.` },
];

test("matches summary or skills case-insensitively", () => {
  expect(matchTextIndex(index, "Hiring Flow")).toEqual(["1"]);
  expect(matchTextIndex(index, "PROTOTYP")).toEqual(["1"]);
  expect(matchTextIndex(index, "kubernetes")).toEqual([]);
});

test("treats q as a literal substring", () => {
  expect(matchTextIndex(index, "%")).toEqual(["2"]);
  expect(matchTextIndex(index, "a_b")).toEqual(["2"]);
  expect(matchTextIndex(index, String.raw`C:\data`)).toEqual(["3"]);
  expect(matchTextIndex(index, ".*")).toEqual([]);
});

test("an empty or blank q matches nothing", () => {
  expect(matchTextIndex(index, "")).toEqual([]);
  expect(matchTextIndex(index, "   ")).toEqual([]);
});
