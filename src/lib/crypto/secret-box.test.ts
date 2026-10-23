import { expect, test } from "vitest";

import { isEncryptedEnvelope } from "./secret-box";

test("isEncryptedEnvelope accepts only v1 envelopes", () => {
  expect(isEncryptedEnvelope("v1:0123456789abcdef:aa:bb:cc")).toBe(true);
  expect(isEncryptedEnvelope("bf_live_abc")).toBe(false);
  expect(isEncryptedEnvelope("")).toBe(false);
  expect(isEncryptedEnvelope("v1:XYZ:aa:bb:cc")).toBe(false);
});
