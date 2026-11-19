// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { AlternativesHub } from "./alternatives-hub";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

test("the hub summary shows its first source and check date", () => {
  render(<AlternativesHub />);

  expect(
    screen
      .getByRole("link", { name: "WP Job Manager homepage" })
      .getAttribute("href")
  ).toBe("https://wpjobmanager.com/");
  expect(screen.getByText("Source:", { exact: false }).textContent).toContain(
    "checked 16 November 2026."
  );
});
