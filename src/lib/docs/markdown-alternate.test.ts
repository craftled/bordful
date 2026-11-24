import { expect, test } from "vitest";

import { boardMarkdownAlternate } from "./markdown-alternate";

test("links the markdown version only when marketing is on", () => {
  expect(
    boardMarkdownAlternate("/companies", { BORDFUL_MARKETING: "true" })
  ).toEqual({ "text/markdown": "/companies.md" });
  expect(
    boardMarkdownAlternate("/jobs/types", { BORDFUL_MARKETING: "true" })
  ).toEqual({ "text/markdown": "/jobs/types.md" });
  expect(boardMarkdownAlternate("/companies", {})).toBeUndefined();
  expect(
    boardMarkdownAlternate("/companies", { BORDFUL_MARKETING: "false" })
  ).toBeUndefined();
});
