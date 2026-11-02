// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { ProductStrip } from "./product-strip";

afterEach(() => {
  cleanup();
});

test("product strip shows its heading and five product links", () => {
  render(<ProductStrip />);

  expect(
    screen.getByRole("heading", { name: "Built for makers and founders" })
  ).toBeTruthy();

  const strip = screen.getByTestId("marketing-product-strip");
  const links = within(strip).getAllByRole("link");
  expect(links.map((link) => link.textContent)).toEqual([
    "Best Writing",
    "Marketful",
    "Pynions",
    "UI Things",
    "Growthlog",
  ]);
  for (const link of links) {
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  }
});
