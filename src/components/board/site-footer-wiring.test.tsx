// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import type { FooterColumn } from "@/config/nav";
import { getSiteSettings, listPublishedJobs } from "@/lib/read";
import { SiteFooter } from "./site-footer";

vi.mock("@/lib/read", () => ({
  getSiteSettings: vi.fn(),
  listPublishedJobs: vi.fn(),
}));

vi.mock("./tab-bar", () => ({
  TabBar: () => null,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

async function renderSiteFooter() {
  vi.mocked(listPublishedJobs).mockResolvedValue({
    items: [],
    page: 1,
    totalDocs: 0,
    totalPages: 1,
  });
  vi.mocked(getSiteSettings).mockResolvedValue({
    alerts: { enabled: false },
    board: { description: "" },
  } as Awaited<ReturnType<typeof getSiteSettings>>);

  const footer = await SiteFooter({
    columns: [] as FooterColumn[],
    logoUrl: null,
    name: "Bordful",
    showAttribution: false,
    showCta: false,
    social: {},
    tagline: "",
  });
  return render(footer);
}

test("SiteFooter wires the Logo.dev credit to publishable-token configuration", async () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");
  const { unmount } = await renderSiteFooter();
  const credit = screen.getByRole("link", {
    name: "Logos provided by Logo.dev",
  });
  expect(credit.getAttribute("href")).toBe("https://logo.dev");
  unmount();

  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "sk_test");
  const secretTokenRender = await renderSiteFooter();
  expect(
    screen.queryByRole("link", { name: "Logos provided by Logo.dev" })
  ).toBeNull();
  secretTokenRender.unmount();

  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "");
  await renderSiteFooter();
  expect(
    screen.queryByRole("link", { name: "Logos provided by Logo.dev" })
  ).toBeNull();
});
