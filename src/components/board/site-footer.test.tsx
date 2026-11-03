// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { FooterView } from "./footer-view";

afterEach(() => {
  cleanup();
});

function renderFooter(
  overrides: Partial<Parameters<typeof FooterView>[0]> = {}
) {
  return render(
    <FooterView
      columns={[
        {
          id: "location",
          items: [
            {
              href: "/jobs/location/remote",
              id: "l-remote",
              label: "Remote jobs",
            },
          ],
          title: "Jobs by location",
        },
        {
          id: "employers",
          items: [{ href: "/companies", id: "companies", label: "Companies" }],
          title: "Employers",
        },
      ]}
      logoUrl={null}
      name="Bordful"
      showAlert={false}
      showAttribution={false}
      social={{}}
      stats={{ companies: 48, openRoles: 143 }}
      tagline="Jobs, curated."
      {...overrides}
    />
  );
}

test("renders facet columns as real links", () => {
  renderFooter();

  expect(
    screen.getByRole("link", { name: "Remote jobs" }).getAttribute("href")
  ).toBe("/jobs/location/remote");
  expect(screen.getByRole("navigation", { name: "Employers" })).toBeTruthy();
});

test("shows Create alert only when alerts are enabled; RSS is always linked", () => {
  const { unmount } = renderFooter({ showAlert: false });
  expect(screen.queryByRole("link", { name: "Create alert" })).toBeNull();
  expect(screen.getByRole("link", { name: "RSS" }).getAttribute("href")).toBe(
    "/feed.xml"
  );
  unmount();

  renderFooter({ showAlert: true });
  expect(
    screen.getByRole("link", { name: "Create alert" }).getAttribute("href")
  ).toBe("/alerts");
});

test("bottom row shows real role and company counts", () => {
  renderFooter();
  expect(screen.getByTestId("footer-stats").textContent).toContain(
    "143 open roles from 48 companies"
  );
});

test("footer text uses opacity-free colors and social links match the footer", () => {
  const { container } = renderFooter({
    social: { github: "https://github.com/craftled/bordful" },
  });

  expect(container.querySelectorAll('[class*="text-subtle/"]')).toHaveLength(0);
  const github = screen.getByRole("link", {
    name: "GitHub (opens in new tab)",
  });
  expect(github.className).toContain("text-muted-foreground");
});

test("shows the Bordfeed credit only when attribution is on", () => {
  const { unmount } = renderFooter({ showAttribution: false });
  expect(screen.queryByTestId("bordfeed-credit")).toBeNull();
  unmount();

  renderFooter({ showAttribution: true });
  expect(screen.getByTestId("bordfeed-credit")).toBeTruthy();
});
