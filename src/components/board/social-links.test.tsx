// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { SocialLinks } from "./social-links";

afterEach(() => {
  cleanup();
});

test("RSS is always linked and no other network appears unless configured", () => {
  render(<SocialLinks links={{}} />);

  expect(
    screen.getByRole("link", { name: "RSS feed" }).getAttribute("href")
  ).toBe("/feed.xml");
  expect(screen.getAllByRole("link")).toHaveLength(1);
});

test("configured networks open in a new tab without leaking the opener", () => {
  render(
    <SocialLinks
      links={{
        bluesky: "https://bsky.app/profile/bordful",
        x: "https://x.com/bordful",
      }}
    />
  );

  const x = screen.getByRole("link", { name: "X (opens in new tab)" });
  expect(x.getAttribute("href")).toBe("https://x.com/bordful");
  expect(x.getAttribute("target")).toBe("_blank");
  expect(x.getAttribute("rel")).toBe("noopener noreferrer");
  expect(
    screen.getByRole("link", { name: "Bluesky (opens in new tab)" })
  ).toBeTruthy();
});
