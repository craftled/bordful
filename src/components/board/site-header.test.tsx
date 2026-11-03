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
  // biome-ignore lint/style/useDomQuerySelector: React useId values contain colons, which a #id selector would misparse
  expect(document.getElementById(panelId ?? "")?.hasAttribute("hidden")).toBe(
    false
  );

  fireEvent.keyDown(document, { key: "Escape" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  // biome-ignore lint/style/useDomQuerySelector: React useId values contain colons, which a #id selector would misparse
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

test("mobile menu closes on a tap outside it", () => {
  renderHeader();

  const toggle = screen.getByRole("button", { name: "Menu" });
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");

  fireEvent.pointerDown(screen.getByRole("navigation", { name: "Mobile" }));
  expect(toggle.getAttribute("aria-expanded")).toBe("true");

  fireEvent.pointerDown(document.body);
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

test("view pills show the board counts and ⌘K focuses the search", () => {
  render(
    <SiteHeader
      cta={CTA}
      homeHref="/"
      logoUrl={null}
      name="Bordful"
      navItems={NAV}
      search={
        <input data-testid="board-search-input" id="board-search-input" />
      }
      social={SOCIAL}
      views={{
        allCount: 143,
        allHref: "/",
        remoteCount: 38,
        remoteHref: "/jobs/location/remote",
      }}
    />
  );

  const views = screen.getByRole("navigation", { hidden: true, name: "Views" });
  const all = within(views).getByRole("link", {
    hidden: true,
    name: "All 143",
  });
  expect(all.getAttribute("aria-current")).toBe("page");
  expect(
    within(views)
      .getByRole("link", { hidden: true, name: "Remote 38" })
      .getAttribute("href")
  ).toBe("/jobs/location/remote");
  expect(
    within(views)
      .getByRole("link", { hidden: true, name: "Saved" })
      .getAttribute("href")
  ).toBe("/saved");

  fireEvent.keyDown(document, { key: "k", metaKey: true });
  expect(document.activeElement).toBe(screen.getByTestId("board-search-input"));
});

test("keeps the All view selected on the board search", () => {
  pathname = "/jobs/search";
  render(
    <SiteHeader
      cta={CTA}
      homeHref="/"
      logoUrl={null}
      name="Bordful"
      navItems={NAV}
      social={SOCIAL}
      views={{
        allCount: 20,
        allHref: "/",
        remoteCount: 5,
        remoteHref: "/jobs/location/remote",
      }}
    />
  );

  const views = screen.getByRole("navigation", { hidden: true, name: "Views" });
  expect(
    within(views)
      .getByRole("link", { hidden: true, name: "All 20" })
      .getAttribute("aria-current")
  ).toBe("page");
  expect(
    within(views)
      .getByRole("link", { hidden: true, name: "Remote 5" })
      .hasAttribute("aria-current")
  ).toBe(false);
});

test.each([
  ["/jobs/staff-product-designer", "page"],
  ["/jobs/levels", "page"],
  ["/jobs/level/senior", "page"],
  ["/jobs/locations", "page"],
  ["/jobs/language/english/page/2", "page"],
  ["/alerts", "page"],
  ["/post", "page"],
  ["/post/thanks", "page"],
  ["/jobs/location/remote", null],
  ["/saved", null],
  ["/companies", null],
])("All view on %s is %s", (path, current) => {
  pathname = path;
  render(
    <SiteHeader
      cta={CTA}
      homeHref="/jobs"
      logoUrl={null}
      name="Bordful"
      navItems={NAV}
      social={SOCIAL}
      views={{
        allCount: 20,
        allHref: "/jobs",
        remoteCount: 5,
        remoteHref: "/jobs/location/remote",
      }}
    />
  );

  const views = screen.getByRole("navigation", { hidden: true, name: "Views" });
  expect(
    within(views)
      .getByRole("link", { hidden: true, name: "All 20" })
      .getAttribute("aria-current")
  ).toBe(current);
});
