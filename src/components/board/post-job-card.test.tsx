// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { PostJobCard } from "./post-job-card";

afterEach(() => {
  cleanup();
});

test("shows the price in the button when a price is set", () => {
  render(<PostJobCard durationDays={30} priceLabel="$99" />);

  expect(
    screen.getByRole("link", { name: "Post a job ($99)" }).getAttribute("href")
  ).toBe("/post");
  expect(screen.getByText("30-day listing")).toBeTruthy();
});

test("omits the price when none is set", () => {
  render(<PostJobCard durationDays={30} priceLabel="" />);

  expect(screen.getByRole("link", { name: "Post a job" })).toBeTruthy();
});
