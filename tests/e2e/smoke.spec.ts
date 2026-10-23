import { expect, test } from "@playwright/test";

test("home returns 200 and a CSP nonce", async ({ request }) => {
  const response = await request.get("/");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-security-policy"]).toContain("nonce-");
});
