// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Bento } from "./bento";
import { FinalCta } from "./final-cta";
import { TechStack } from "./tech-stack";

afterEach(() => {
  cleanup();
});

const STAR_LINK = /Star on GitHub/u;

const TITLES = [
  "Visitors come back on their own",
  "Your colors, not ours",
  "Found on Google from day one",
  "Employers pay to post",
];

test("bento renders each card for phones and for desktop", () => {
  render(<Bento />);

  for (const title of TITLES) {
    expect(screen.getAllByRole("heading", { name: title })).toHaveLength(2);
  }
});

test("the JobPosting sample wraps instead of clipping", () => {
  const { container } = render(<Bento />);
  const pre = container.querySelector("pre");

  expect(pre?.className).toContain("whitespace-pre-wrap");
  expect(pre?.className).not.toContain("overflow-x-auto");
});

test("tech stack lists the same eight names as chips and as a grid", () => {
  render(<TechStack />);

  expect(screen.getAllByRole("list")).toHaveLength(2);
  expect(screen.getAllByText("Tailwind CSS")).toHaveLength(2);
});

test("final CTA has a phone close and the desktop band", () => {
  render(<FinalCta />);

  expect(screen.getByRole("link", { name: "Clone now" })).toBeTruthy();
  expect(screen.getByRole("link", { name: STAR_LINK })).toBeTruthy();
});
