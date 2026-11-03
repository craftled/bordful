import { expect, test } from "@playwright/test";

import { loginInBrowser } from "./support/admin";

const RELEASE =
  "https://github.com/craftled/bordful/releases/tag/v1.0.0-beta.2";

test.describe("E11 update-notice", { tag: ["@E11"] }, () => {
  test("shows the newer release on the admin dashboard", async ({ page }) => {
    test.setTimeout(120_000);
    await loginInBrowser(page);
    const notice = page.getByTestId("update-notice");
    await expect(notice).toHaveAttribute("data-latest", "1.0.0-beta.2");
    await expect(notice).toHaveAttribute("data-current", "1.0.0-beta.1");
    await expect(notice.locator(`a[href="${RELEASE}"]`)).toHaveCount(1);
  });
});
