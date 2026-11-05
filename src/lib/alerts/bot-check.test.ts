import { expect, test, vi } from "vitest";

import { isLikelyBot } from "./bot-check";

test("isLikelyBot skips the check off Vercel", async () => {
  const check = vi.fn(async () => ({ isBot: true }));
  await expect(isLikelyBot({ check, env: {} })).resolves.toBe(false);
  expect(check).not.toHaveBeenCalled();
});

test("isLikelyBot returns the Vercel check result", async () => {
  const human = vi.fn(async () => ({ isBot: false }));
  const bot = vi.fn(async () => ({ isBot: true }));

  await expect(
    isLikelyBot({ check: human, env: { NEXT_PUBLIC_VERCEL_ENV: "production" } })
  ).resolves.toBe(false);
  await expect(
    isLikelyBot({ check: bot, env: { NEXT_PUBLIC_VERCEL_ENV: "production" } })
  ).resolves.toBe(true);
  expect(human).toHaveBeenCalledOnce();
  expect(bot).toHaveBeenCalledOnce();
});

test("isLikelyBot fails closed when the Vercel check throws", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  await expect(
    isLikelyBot({
      check: () => {
        throw new Error("x-vercel-oidc-token header is missing");
      },
      env: { NEXT_PUBLIC_VERCEL_ENV: "production" },
    })
  ).resolves.toBe(true);
  expect(error).toHaveBeenCalledWith(
    "BotID check failed; treating the signup as a bot."
  );
  error.mockRestore();
});
