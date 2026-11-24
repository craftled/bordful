import { expect, test } from "vitest";

import {
  AGENT_PAGE_PATHS,
  BOARD_AGENT_PAGE_PATHS,
  DOCS_MARKDOWN_ROUTE,
  docsHtmlPath,
  docsMarkdownPath,
  htmlPathFor,
  LLMS_FULL_TXT_PATH,
  LLMS_TXT_PATH,
  markdownPathFor,
  NO_MARKDOWN,
  PAGES_MARKDOWN_ROUTE,
  pagesMarkdownRoutePath,
} from "./agent-docs-paths";

test("the route constants are stable paths", () => {
  expect(LLMS_TXT_PATH).toBe("/llms.txt");
  expect(LLMS_FULL_TXT_PATH).toBe("/llms-full.txt");
  expect(DOCS_MARKDOWN_ROUTE).toBe("/docs-md");
  expect(PAGES_MARKDOWN_ROUTE).toBe("/pages-md");
});

test("markdownPathFor maps the home page to /index.md", () => {
  expect(markdownPathFor("/")).toBe("/index.md");
  expect(markdownPathFor("/pricing")).toBe("/pricing.md");
  expect(markdownPathFor("/alternatives/wp-job-manager")).toBe(
    "/alternatives/wp-job-manager.md"
  );
});

test("htmlPathFor is the inverse of markdownPathFor", () => {
  expect(htmlPathFor("/index.md")).toBe("/");
  expect(htmlPathFor("/pricing.md")).toBe("/pricing");
  expect(htmlPathFor("/alternatives/wp-job-manager.md")).toBe(
    "/alternatives/wp-job-manager"
  );
  // Not a page markdown URL.
  expect(htmlPathFor("/pricing")).toBeNull();
  expect(htmlPathFor("/pricing.html")).toBeNull();
  expect(htmlPathFor("/.md")).toBeNull();
  expect(htmlPathFor("/index.md/extra")).toBeNull();
  for (const path of AGENT_PAGE_PATHS) {
    expect(htmlPathFor(markdownPathFor(path))).toBe(path);
    if (path !== "/") {
      expect(markdownPathFor(htmlPathFor(`${path}.md`) ?? "/")).toBe(
        `${path}.md`
      );
    }
  }
});

test("pagesMarkdownRoutePath never leaves a trailing slash", () => {
  expect(pagesMarkdownRoutePath("/")).toBe("/pages-md/index");
  expect(pagesMarkdownRoutePath("/pricing")).toBe("/pages-md/pricing");
  expect(pagesMarkdownRoutePath("/jobs/types")).toBe("/pages-md/jobs/types");
});

test("the page lists cover the whole public site", () => {
  expect(AGENT_PAGE_PATHS).toContain("/");
  expect(AGENT_PAGE_PATHS).toContain("/pricing");
  expect(AGENT_PAGE_PATHS).toContain("/alternatives/wp-job-manager");
  expect(BOARD_AGENT_PAGE_PATHS).toEqual([
    "/jobs",
    "/companies",
    "/jobs/types",
    "/jobs/levels",
    "/jobs/locations",
    "/jobs/languages",
  ]);
});

test("every page without markdown has a written reason", () => {
  expect(NO_MARKDOWN["/post"]).toBeTruthy();
  expect(NO_MARKDOWN["/alerts"]).toBeTruthy();
});

test("docsHtmlPath builds the page URL", () => {
  expect(docsHtmlPath(null)).toBe("/docs");
  expect(docsHtmlPath("deploy")).toBe("/docs/deploy");
});

test("docsMarkdownPath builds the markdown URL", () => {
  expect(docsMarkdownPath(null)).toBe("/docs.md");
  expect(docsMarkdownPath("deploy")).toBe("/docs/deploy.md");
});
