// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { DOCS_SLUGS, readDoc } from "./docs-content";
import { DocsMarkdown, extractHeadings, resolveDocHref } from "./docs-markdown";

afterEach(() => {
  cleanup();
});

const BASE = "https://example.com/blob/main";

test("relative doc links become /docs routes", () => {
  expect(resolveDocHref("deploy.md", BASE)).toBe("/docs/deploy");
  expect(resolveDocHref("bordfeed.md#credits-per-sync", BASE)).toBe(
    "/docs/bordfeed#credits-per-sync"
  );
  expect(resolveDocHref("../UPGRADING.md", BASE)).toBe(`${BASE}/UPGRADING.md`);
  expect(resolveDocHref("https://a.test", BASE)).toBe("https://a.test");
});

test("renders headings, lists, tables, code and escapes markup", () => {
  const source = [
    "# Title",
    "",
    "## Step one",
    "",
    "Use `RESEND_API_KEY` and <script>alert(1)</script> see [Deploy](deploy.md).",
    "",
    "1. First",
    "2. Second",
    "",
    "| A | B |",
    "| --- | --- |",
    "| `x` | y |",
    "",
    "```bash",
    "bun run dev",
    "```",
  ].join("\n");
  const { container } = render(
    <DocsMarkdown repoBase={BASE} source={source} />
  );

  expect(screen.getByRole("heading", { level: 2, name: "Step one" }).id).toBe(
    "step-one"
  );
  expect(
    screen.getByRole("link", { name: "Deploy" }).getAttribute("href")
  ).toBe("/docs/deploy");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByRole("table")).toBeTruthy();
  expect(screen.getByText("Scroll sideways for all columns")).toBeTruthy();
  expect(container.querySelector("pre")?.textContent).toBe("bun run dev");
  expect(container.querySelector("script")).toBeNull();
  expect(container.textContent).toContain("<script>alert(1)</script>");
  expect(extractHeadings(source).map((h) => h.text)).toEqual(["Step one"]);
});

test("every repo doc is listed and renders", () => {
  for (const slug of DOCS_SLUGS) {
    const source = readDoc(slug);
    expect(source, slug).not.toBeNull();
    const { container } = render(
      <DocsMarkdown repoBase={BASE} source={source ?? ""} />
    );
    expect(container.textContent?.length, slug).toBeGreaterThan(100);
    cleanup();
  }
});
