// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { BoardShell } from "@/components/board/board-shell";
import { MarketingShell } from "@/components/marketing/marketing-shell";

import { MAIN_CONTENT_ID, SkipLink } from "./skip-link";

// The shells' headers, footers and data are not under test here.
vi.mock("@/components/board/site-header", () => ({
  SiteHeader: () => <header>Board header</header>,
}));
vi.mock("@/components/board/site-footer", () => ({
  SiteFooter: () => <footer>Board footer</footer>,
}));
vi.mock("@/components/board/board-search-form", () => ({
  BoardSearchForm: () => null,
  searchHiddenFields: () => [],
}));
vi.mock("@/components/marketing/marketing-header", () => ({
  MarketingHeader: () => <header>Marketing header</header>,
}));
vi.mock("@/components/marketing/marketing-footer", () => ({
  MarketingFooter: () => <footer>Marketing footer</footer>,
}));
vi.mock("@/components/marketing/fonts", () => ({ marketingFontVariables: "" }));
vi.mock("@/lib/board/pool", () => ({ loadBoardPool: async () => [] }));
vi.mock("@/lib/read", () => ({
  getBordfeedConnectionPublic: async () => ({ showAttribution: false }),
  getSiteSettings: async () => ({
    alerts: { enabled: false },
    logoUrl: null,
    name: "Board",
    postJob: { durationDays: 30, enabled: false, priceLabel: "" },
    tagline: "",
  }),
}));

afterEach(() => {
  cleanup();
});

function expectSkipLinkFirst(container: HTMLElement) {
  const link = screen.getByRole("link", { name: "Skip to content" });
  expect(container.querySelector("a, button, input, summary")).toBe(link);
  expect(link.getAttribute("href")).toBe(`#${MAIN_CONTENT_ID}`);
  expect(screen.getByRole("main").id).toBe(MAIN_CONTENT_ID);
}

test("the skip link stays hidden until it is focused", () => {
  render(<SkipLink />);

  const link = screen.getByRole("link", { name: "Skip to content" });
  expect(link.className).toContain("sr-only");
  expect(link.className).toContain("focus:not-sr-only");
});

test("the board shell opens with a skip link to its main landmark", async () => {
  const { container } = render(
    await BoardShell({ children: <a href="/jobs">A job</a> })
  );

  expectSkipLinkFirst(container);
});

test("the marketing shell opens with a skip link to its main landmark", () => {
  const { container } = render(
    <MarketingShell>
      <a href="/docs">Docs</a>
    </MarketingShell>
  );

  expectSkipLinkFirst(container);
});
