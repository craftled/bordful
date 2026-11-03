import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { ensureAdmin, loginInBrowser } from "./support/admin";
import { writeTinyPng } from "./support/png";
import { updateGlobal } from "./support/seed";

const LOGO_SRC = /\/api\/media\/file\//;
const SAVED_TOAST = /updated successfully/i;

test.describe("E9 theme-rebrand", { tag: ["@E9"] }, () => {
  test("applies a saved color, radius and logo without a restart", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    await loginInBrowser(page);
    await page.goto("/admin/globals/site-settings");
    await page.getByTestId("color-field-primary-input").fill("#2563eb");
    await page.locator("input[name='theme.radius']").fill("1");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(SAVED_TOAST)).toBeVisible();

    const admin = await ensureAdmin(request);
    const filePath = writeTinyPng("e9-logo.png");
    const uploaded = await admin.post("/api/media", {
      multipart: {
        _payload: JSON.stringify({ alt: "E9 logo" }),
        file: {
          buffer: readFileSync(filePath),
          mimeType: "image/png",
          name: "e9-logo.png",
        },
      },
    });
    expect(uploaded.ok()).toBe(true);
    const media = (await uploaded.json()) as { doc?: { id?: unknown } };
    const id = media.doc?.id;
    expect(id).toBeTruthy();
    await updateGlobal(admin, "site-settings", { logo: id });
    await admin.dispose();

    await page.goto("/");
    const html = await page.content();
    expect(html).toContain("--primary:#2563eb");
    expect(html).toContain("--radius:1rem");
    await expect(page.getByTestId("site-logo")).toHaveAttribute(
      "src",
      LOGO_SRC
    );
  });
});
