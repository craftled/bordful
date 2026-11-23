import { expect, test } from "vitest";

import {
  DOCS_MARKDOWN_ROUTE,
  docsHtmlPath,
  docsMarkdownPath,
  LLMS_TXT_PATH,
} from "./agent-docs-paths";

test("LLMS_TXT_PATH and DOCS_MARKDOWN_ROUTE are stable paths", () => {
  expect(LLMS_TXT_PATH).toBe("/llms.txt");
  expect(DOCS_MARKDOWN_ROUTE).toBe("/docs-md");
});

test("docsHtmlPath builds the page URL", () => {
  expect(docsHtmlPath(null)).toBe("/docs");
  expect(docsHtmlPath("deploy")).toBe("/docs/deploy");
});

test("docsMarkdownPath builds the markdown URL", () => {
  expect(docsMarkdownPath(null)).toBe("/docs.md");
  expect(docsMarkdownPath("deploy")).toBe("/docs/deploy.md");
});
