// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { subscribeAction } from "@/app/(site)/alerts/actions";
import { EMPTY_JOB_ALERT_QUERY } from "@/lib/domain/job-vocab";

import { AlertsForm } from "./alerts-form";

vi.mock("@/app/(site)/alerts/actions", () => ({
  subscribeAction: vi.fn(),
}));

const SUBSCRIBE_UNAVAILABLE_MESSAGE =
  "Job alerts are not available on this board.";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

async function submitWithActionResult(result: {
  field?: "email";
  message: string;
  ok: boolean;
}) {
  vi.mocked(subscribeAction).mockResolvedValue(result);
  render(
    <AlertsForm
      defaultFrequency="weekly"
      jobsHref="/jobs"
      query={EMPTY_JOB_ALERT_QUERY}
    />
  );

  await act(() => fireEvent.submit(screen.getByTestId("alerts-form")));

  return {
    email: screen.getByTestId("alerts-email"),
    error: screen.getByRole("alert"),
  };
}

test("marks the email invalid for an email validation error", async () => {
  const { email, error } = await submitWithActionResult({
    field: "email",
    message: "Enter a valid email address.",
    ok: false,
  });

  expect(email.getAttribute("aria-invalid")).toBe("true");
  expect(error.textContent).toBe("Enter a valid email address.");
  expect(email.getAttribute("aria-describedby")).toBe(
    "alerts-privacy alerts-error"
  );
});

test("does not mark the email invalid for an unavailable service error", async () => {
  const { email, error } = await submitWithActionResult({
    message: SUBSCRIBE_UNAVAILABLE_MESSAGE,
    ok: false,
  });

  expect(email.hasAttribute("aria-invalid")).toBe(false);
  expect(error.textContent).toBe("Job alerts are not available on this board.");
});
