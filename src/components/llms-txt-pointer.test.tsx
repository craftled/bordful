// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

test("renders a hidden llms.txt link when marketing is on", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "true");
  const { LlmsTxtPointer } = await import("./llms-txt-pointer");
  const { container, getByTestId } = render(<LlmsTxtPointer />);
  expect(getByTestId("llms-txt-pointer")).toBeTruthy();
  const link = container.querySelector("a");
  expect(link).not.toBeNull();
  expect(link?.getAttribute("href")).toBe("/llms.txt");
  expect(link?.getAttribute("tabindex")).toBe("-1");
});

test("renders nothing when marketing is off", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "false");
  const { LlmsTxtPointer } = await import("./llms-txt-pointer");
  const { container } = render(<LlmsTxtPointer />);
  expect(container.textContent).toBe("");
});
