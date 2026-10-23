import { expect, test } from "vitest";

import { createResendMock } from "../mocks/resend";

const message = {
  from: "alerts@board.example",
  html: "<p>Hi</p>",
  subject: "Hello",
  text: "Hi",
  to: "ada@example.com",
};

test("the same idempotency key twice stores one email", async () => {
  const mock = createResendMock();

  function send(): Promise<Response> {
    return mock.handle(
      new Request("http://127.0.0.1/emails", {
        body: JSON.stringify(message),
        headers: {
          "content-type": "application/json",
          "idempotency-key": "alerts-ada-weekly-2026-W43",
        },
        method: "POST",
      })
    );
  }

  const first = await send();
  const second = await send();
  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  const firstBody = (await first.json()) as { id: string };
  const secondBody = (await second.json()) as { id: string };
  expect(firstBody.id).toBe("email_mock_0001");
  expect(secondBody.id).toBe(firstBody.id);
  expect(mock.state.emails).toHaveLength(1);
  expect(mock.state.emails[0]?.idempotencyKey).toBe(
    "alerts-ada-weekly-2026-W43"
  );
  expect(mock.state.emails[0]?.to).toBe("ada@example.com");
});
