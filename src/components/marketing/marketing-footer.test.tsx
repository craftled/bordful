// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { MarketingFooter, MarketingSlimFooter } from "./marketing-footer";

afterEach(() => {
  cleanup();
});

test("marketing footer shows the Top Boilerplates badge", () => {
  render(<MarketingFooter />);

  const link = screen.getByTestId("top-boilerplates-badge");
  expect(link.getAttribute("href")).toBe(
    "https://topboilerplates.com/bordful?ref=badge"
  );
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener");

  const images = link.querySelectorAll("img");
  expect(images).toHaveLength(2);

  const [lightImage, darkImage] = Array.from(images);
  expect(lightImage?.getAttribute("src")).toBe(
    "https://topboilerplates.com/badge/bordful.svg"
  );
  expect(lightImage?.className).toContain("dark:hidden");
  expect(darkImage?.getAttribute("src")).toBe(
    "https://topboilerplates.com/badge/bordful.svg?theme=dark"
  );
  expect(darkImage?.className).toContain("dark:block");

  for (const image of [lightImage, darkImage]) {
    expect(image?.getAttribute("width")).toBe("224");
    expect(image?.getAttribute("height")).toBe("56");
    expect(image?.getAttribute("loading")).toBe("lazy");
    expect(image?.getAttribute("alt")).toBe("Listed on Top Boilerplates");
  }
  expect(link.querySelector("source")).toBeNull();
});

test("marketing slim footer does not show the Top Boilerplates badge", () => {
  render(<MarketingSlimFooter />);

  expect(
    screen.queryByRole("link", { name: "Listed on Top Boilerplates" })
  ).toBeNull();
});
