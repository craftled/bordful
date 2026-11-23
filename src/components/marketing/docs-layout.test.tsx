// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { DOCS_GROUPS, listDocs } from "@/components/marketing/docs-content";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

async function renderSidebar(active: string) {
  vi.stubEnv("BORDFUL_MARKETING", "true");
  const { DocsSidebar } = await import("./docs-layout");
  const { container } = render(
    <DocsSidebar active={active} entries={listDocs()} />
  );
  return container;
}

test("the sidebar links llms.txt and the active page's markdown", async () => {
  const container = await renderSidebar("deploy");
  const links = [...container.querySelectorAll("a")].map((link) => ({
    href: link.getAttribute("href"),
    text: link.textContent?.trim(),
  }));
  expect(links).toContainEqual({
    href: "/llms.txt",
    text: "llms.txt",
  });
  expect(links).toContainEqual({
    href: "/docs/deploy.md",
    text: "View as Markdown",
  });
});

test("the overview markdown link points at /docs.md", async () => {
  const container = await renderSidebar("");
  const markdown = [...container.querySelectorAll("a")].find(
    (link) => link.textContent?.trim() === "View as Markdown"
  );
  expect(markdown?.getAttribute("href")).toBe("/docs.md");
});

test("the docs pager root is human-only", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "true");
  const { DocsPager } = await import("./docs-layout");
  const { container } = render(
    <DocsPager
      next={{ href: "/docs/deploy", label: "Deploy" }}
      previous={{ href: "/docs", label: "Overview" }}
    />
  );

  const pager = container.firstElementChild;
  expect(pager?.hasAttribute("data-markdown-ignore")).toBe(true);
  // Only the pager root carries the marker. Nothing else in the document
  // body is ignored, so the surrounding content stays agent-readable.
  expect(document.body.querySelectorAll("[data-markdown-ignore]")).toHaveLength(
    1
  );
  expect(container.textContent).toContain("Overview");
  expect(container.textContent).toContain("Deploy");
});

test("every doc still links its HTML page in sidebar order", async () => {
  const container = await renderSidebar("");
  const hrefs = [...container.querySelectorAll("a")]
    .map((link) => link.getAttribute("href"))
    .filter((href): href is string => href !== null);
  const expected = [
    "/docs",
    ...DOCS_GROUPS.flatMap((group) =>
      group.slugs.map((slug) => `/docs/${slug}`)
    ),
    "/llms.txt",
    "/docs.md",
  ];
  expect(hrefs).toEqual(expected);
});
