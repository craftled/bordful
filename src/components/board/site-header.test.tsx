// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import type { NavItem } from "@/config/nav";

import { SiteHeader } from "./site-header";

let pathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

const NAV: NavItem[] = [
  { href: "/", id: "jobs", label: "Jobs" },
  { href: "/companies", id: "companies", label: "Companies" },
];
const CTA: NavItem = { href: "/post", id: "post", label: "Post a job" };
const SOCIAL = { github: "https://github.com/craftled/bordful" };

function renderHeader(cta: NavItem | null = CTA) {
  return render(
    <SiteHeader
      cta={cta}
      homeHref="/"
      logoUrl={null}
      name="Bordful"
      navItems={NAV}
      social={SOCIAL}
    />
  );
}

beforeEach(() => {
  pathname = "/";
});

afterEach(() => {
  cleanup();
});

test("renders the Post a job CTA only when a cta is given", () => {
  const { unmount } = renderHeader(CTA);
  expect(
    screen.getByRole("link", { name: "Post a job" }).getAttribute("href")
  ).toBe("/post");
  unmount();

  renderHeader(null);
  expect(screen.queryByRole("link", { name: "Post a job" })).toBeNull();
});

test("marks the active nav link with aria-current", () => {
  pathname = "/companies/acme";
  renderHeader();

  const nav = screen.getByRole("navigation", { name: "Primary" });
  expect(
    within(nav)
      .getByRole("link", { name: "Companies" })
      .getAttribute("aria-current")
  ).toBe("page");
  expect(
    within(nav).getByRole("link", { name: "Jobs" }).hasAttribute("aria-current")
  ).toBe(false);
});

test("always offers RSS and any configured social profile with a label", () => {
  renderHeader();

  expect(
    screen.getByRole("link", { name: "RSS feed" }).getAttribute("href")
  ).toBe("/feed.xml");
  expect(
    screen
      .getByRole("link", { name: "GitHub (opens in new tab)" })
      .getAttribute("href")
  ).toBe("https://github.com/craftled/bordful");
  expect(screen.queryByRole("link", { name: "X" })).toBeNull();
});

test("mobile menu toggles aria-expanded and closes on Escape", () => {
  renderHeader();

  const toggle = screen.getByRole("button", { name: "Menu" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  const panelId = toggle.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();

  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(document.getElementById(panelId ?? "")?.hasAttribute("hidden")).toBe(
    false
  );

  fireEvent.keyDown(document, { key: "Escape" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(document.getElementById(panelId ?? "")?.hasAttribute("hidden")).toBe(
    true
  );
});

test("mobile menu closes when a link is chosen and items are links", () => {
  renderHeader();

  const toggle = screen.getByRole("button", { name: "Menu" });
  fireEvent.click(toggle);

  const mobile = screen.getByRole("navigation", { name: "Mobile" });
  expect(within(mobile).getByRole("link", { name: "Jobs" })).toBeTruthy();
  expect(within(mobile).getByRole("link", { name: "Companies" })).toBeTruthy();

  fireEvent.click(within(mobile).getByRole("link", { name: "Companies" }));
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
});

test("mobile menu closes when focus leaves it", () => {
  renderHeader();

  const toggle = screen.getByRole("button", { name: "Menu" });
  fireEvent.click(toggle);
  const mobile = screen.getByRole("navigation", { name: "Mobile" });

  fireEvent.focusOut(within(mobile).getByRole("link", { name: "Jobs" }), {
    relatedTarget: document.body,
  });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
});
