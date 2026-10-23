import { expect, test } from "@playwright/test";

const ADMIN_HOME = /\/admin\/?$/;

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

  const consoleMessages: string[] = [];
  page.on("console", (message) => {
    consoleMessages.push(message.text());
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

  const admin = await request.get("/admin");
  expect(admin.headers()["content-security-policy"]).toContain("nonce-");
});
