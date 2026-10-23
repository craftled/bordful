import { createHash } from "node:crypto";

import { expect, test } from "@playwright/test";

const ADMIN_HOME = /\/admin\/?$/;
const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const NONCE_ATTR = /(?:^|\s)nonce\s*=/i;

test("an admin can register and sign in without CSP violations", async ({
  page,
  request,
}) => {
  const registered = await request.post("/api/users/first-register", {
    data: {
      email: "admin@example.com",
      password: "Example-Passw0rd-123",
    },
  });
  expect(registered.status()).toBeLessThan(500);

  const loginDocument = await request.get("/admin/login");
  expect(loginDocument.ok()).toBe(true);
  const policy = loginDocument.headers()["content-security-policy"] ?? "";
  const html = await loginDocument.text();
  const scripts = [...html.matchAll(SCRIPT_TAG)];
  expect(scripts.length).toBeGreaterThan(0);

  for (const script of scripts) {
    const attrs = script[1] ?? "";
    const body = script[2] ?? "";
    const hasNonce = NONCE_ATTR.test(attrs);
    const digest = createHash("sha256").update(body).digest("base64");
    expect(hasNonce || policy.includes(`sha256-${digest}`)).toBe(true);
  }

  const consoleMessages: string[] = [];
  page.on("console", (message) => {
    consoleMessages.push(message.text());
  });
  await page.addInitScript(() => {
    const record = window as Window & { __cspViolations?: string[] };
    record.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      record.__cspViolations?.push(event.violatedDirective);
    });
  });

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.locator("input[name='password']").fill("Example-Passw0rd-123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(ADMIN_HOME);
  await expect(page.getByRole("navigation").first()).toBeVisible();

  const cspViolations = consoleMessages.filter(
    (message) =>
      message.includes("Content Security Policy") ||
      message.includes("Refused to")
  );
  expect(cspViolations).toEqual([]);

  const recorded = await page.evaluate(
    () =>
      (window as Window & { __cspViolations?: string[] }).__cspViolations ?? []
  );
  expect(recorded).toEqual([]);

  const admin = await request.get("/admin");
  expect(admin.headers()["content-security-policy"]).toContain("nonce-");
});
