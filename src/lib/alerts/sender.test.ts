import { afterEach, expect, test } from "vitest";

import { resendSender } from "./sender";

const MISSING_API_KEY = /Missing API key/;

const previousKey = process.env.RESEND_API_KEY;

afterEach(() => {
  if (previousKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = previousKey;
  }
});

test("resendSender waits to construct the client until a send", async () => {
  delete process.env.RESEND_API_KEY;
  const sender = resendSender("");
  await expect(
    sender.send(
      {
        from: "Example Board <alerts@board.example>",
        headers: {},
        html: "<p>Hello</p>",
        subject: "Hello",
        text: "Hello",
        to: "ada@example.com",
      },
      "alerts-confirm-1-abc"
    )
  ).rejects.toThrow(MISSING_API_KEY);
});
