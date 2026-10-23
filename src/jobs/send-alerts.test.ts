import { afterEach, expect, test } from "vitest";

import { sendAlertsTask, takeAlertDigestResult } from "./send-alerts";

const previousKey = process.env.RESEND_API_KEY;

afterEach(() => {
  if (previousKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = previousKey;
  }
});

test("sendAlertsTask with an empty key skips before building a sender", async () => {
  delete process.env.RESEND_API_KEY;
  let lookedUpJobs = false;
  const payload = {
    find: () => {
      lookedUpJobs = true;
      throw new Error("jobs should not be loaded when alerts are not ready");
    },
    findGlobal: () => ({
      alerts: {
        defaultFrequency: "weekly",
        enabled: true,
        fromEmail: "alerts@board.example",
        fromName: "Example Board",
      },
      name: "Example Board",
    }),
    logger: {
      error: () => undefined,
      fatal: () => undefined,
    },
  };

  const { handler } = sendAlertsTask;
  if (typeof handler !== "function") {
    throw new Error("sendAlertsTask handler must be a function");
  }

  const result = await handler({
    input: {},
    job: { id: "empty-key" },
    req: { payload },
  } as never);

  expect(result).toEqual({ output: { skipped: "not_ready" } });
  expect(takeAlertDigestResult("empty-key")).toEqual({ skipped: "not_ready" });
  expect(lookedUpJobs).toBe(false);
});
