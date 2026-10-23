// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { getNav } from "@/config/nav";

import { SiteFooter } from "./site-footer";

afterEach(() => {
  cleanup();
});

function renderFooter(
  overrides: Partial<Parameters<typeof SiteFooter>[0]> = {}
) {
  const nav = getNav({
    alertsEnabled: false,
    marketing: false,
    postJobEnabled: overrides.showCta ?? false,
  });
  return render(
    <SiteFooter
      columns={nav.footerColumns}
      durationDays={30}
      logoUrl={null}
      name="Bordful"
      priceLabel=""
      showAttribution={false}
      showCta={false}
      social={{}}
      tagline="Jobs, curated."
      {...overrides}
    />
  );
}

test("shows the Post a Job band only when postJob is enabled", () => {
  const { unmount } = renderFooter({ showCta: false });
  expect(screen.queryByText("Post a Job for 30 Days")).toBeNull();
  unmount();

  renderFooter({ showCta: true });
  expect(screen.getByText("Post a Job for 30 Days")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Post a job" }).getAttribute("href")
  ).toBe("/post");
});

test("lists feed formats and omits marketing pages in board-only mode", () => {
  renderFooter();

  expect(screen.getByRole("link", { name: "RSS" }).getAttribute("href")).toBe(
    "/feed.xml"
  );
  expect(screen.getByRole("link", { name: "Atom" }).getAttribute("href")).toBe(
    "/atom.xml"
  );
  expect(screen.getByRole("link", { name: "JSON" }).getAttribute("href")).toBe(
    "/feed.json"
  );
  expect(screen.queryByRole("link", { name: "Privacy" })).toBeNull();
  expect(screen.queryByRole("link", { name: "About" })).toBeNull();
});

test("shows the Bordfeed credit only when attribution is on", () => {
  const { unmount } = renderFooter({ showAttribution: false });
  expect(screen.queryByTestId("bordfeed-credit")).toBeNull();
  unmount();

  renderFooter({ showAttribution: true });
  expect(screen.getByTestId("bordfeed-credit")).toBeTruthy();
});
