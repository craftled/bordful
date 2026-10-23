import { expect, test } from "vitest";

import { resolvePayloadSecret } from "./payload-secret";

const productionMessage =
  "PAYLOAD_SECRET must be set to at least 32 characters in production.";

test("production requires a secret of at least 32 characters", () => {
  expect(() => resolvePayloadSecret({ NODE_ENV: "production" })).toThrow(
    productionMessage
  );
  expect(() =>
    resolvePayloadSecret({ NODE_ENV: "production", PAYLOAD_SECRET: "short" })
  ).toThrow(productionMessage);
  expect(
    resolvePayloadSecret({
      NODE_ENV: "production",
      PAYLOAD_SECRET: "x".repeat(32),
    })
  ).toBe("x".repeat(32));
});

test("other environments require a secret of any length", () => {
  expect(() => resolvePayloadSecret({})).toThrow("PAYLOAD_SECRET is not set.");
  expect(resolvePayloadSecret({ PAYLOAD_SECRET: "dev" })).toBe("dev");
});
