import { expect, test } from "vitest";

import {
  isValidAgentName,
  isValidBoardName,
  looksLikeUrlOrDomain,
} from "./signup-names";

test("domains and URLs match the live rule, abbreviations and versions do not", () => {
  for (const value of [
    "evil.com",
    "www.example.com",
    "https://x",
    "evil .com",
    "evil [.] com",
  ]) {
    expect(looksLikeUrlOrDomain(value)).toBe(true);
  }
  for (const value of [
    "GPT 4.1",
    "Awwwards Bot",
    "Dr. Smith",
    "Fully Remote",
  ]) {
    expect(looksLikeUrlOrDomain(value)).toBe(false);
  }
});

test("agent names allow unicode letters and need a leading letter or digit", () => {
  expect(isValidAgentName("bordful")).toBe(true);
  expect(isValidAgentName("Agent (v2)")).toBe(true);
  expect(isValidAgentName("Žmogus")).toBe(true);
  expect(isValidAgentName("-bordful")).toBe(false);
  expect(isValidAgentName("a".repeat(65))).toBe(false);
});

test("board names are 1 to 80 characters with no control characters", () => {
  expect(isValidBoardName("Example Board")).toBe(true);
  expect(isValidBoardName("b".repeat(80))).toBe(true);
  expect(isValidBoardName("b".repeat(81))).toBe(false);
  expect(isValidBoardName("Line\nBreak")).toBe(false);
  expect(isValidBoardName("  ")).toBe(false);
});
