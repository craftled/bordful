// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { perPageChoices, showingLabel } from "./board-toolbar";

afterEach(() => {
  cleanup();
});

test("shows the page size and the total in the count label", () => {
  expect(showingLabel(10, 143)).toBe("Showing 10 of 143 positions");
  expect(showingLabel(1, 1)).toBe("Showing 1 of 1 position");
  expect(showingLabel(0, 0)).toBe("Showing 0 of 0 positions");
});

test("adds a non-standard default page size to the per-page choices", () => {
  expect(perPageChoices(10)).toEqual([10, 20, 50, 100]);
  expect(perPageChoices(7)).toEqual([7, 10, 20, 50, 100]);
});

test("the count element keeps its data attributes", () => {
  render(
    <p data-count={143} data-testid="job-count">
      {showingLabel(10, 143)}
    </p>
  );

  const count = screen.getByTestId("job-count");
  expect(count.getAttribute("data-count")).toBe("143");
  expect(count.textContent).toBe("Showing 10 of 143 positions");
});
