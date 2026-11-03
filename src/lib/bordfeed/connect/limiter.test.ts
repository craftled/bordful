import { describe, expect, test } from "vitest";

import { allowVerifyAttempt, clearVerifyAttempts } from "./limiter";

describe("verify limiter", () => {
  test("blocks after 10 attempts, then allows a new window or a clear", () => {
    const id = "reg_limiter_window";
    const start = 1_700_000_000_000;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(allowVerifyAttempt(id, start + attempt)).toBe(true);
    }

    expect(allowVerifyAttempt(id, start + 10)).toBe(false);
    expect(allowVerifyAttempt(id, start + 15 * 60 * 1000)).toBe(true);

    clearVerifyAttempts(id);
    expect(allowVerifyAttempt(id, start + 15 * 60 * 1000)).toBe(true);
  });
});
