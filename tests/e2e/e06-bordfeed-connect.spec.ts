import { expect, test } from "@playwright/test";
import type { BordfeedRequestLog } from "../mocks/bordfeed";
import { loginInBrowser } from "./support/admin";
import { bordfeedRequests, resetMock } from "./support/mock";

const INSTALL_ID = /^[a-f0-9]{64}$/;
const CONNECTED_MESSAGE = /^Connected\. Synced 25 jobs/;
const FEED_JOBS_PATH = /^\/api\/v1\/feeds\/[^/]+\/jobs$/;

function queryValues(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function registerBodies(
  requests: BordfeedRequestLog[]
): Record<string, unknown>[] {
  return requests
    .filter((entry) => entry.path === "/api/agent/register")
    .map((entry) =>
      entry.body !== null && typeof entry.body === "object"
        ? (entry.body as Record<string, unknown>)
        : {}
    );
}

test.describe("E6 bordfeed-connect", { tag: ["@E6"] }, () => {
  test("connects through the code and workspace steps", async ({ page }) => {
    test.setTimeout(180_000);
    await resetMock();
    await loginInBrowser(page);
    const card = page.getByTestId("bordfeed-connect-card");
    await expect(card).toHaveAttribute("data-state", "sample");

    await page.getByTestId("bordfeed-email").fill("limited@example.com");
    await page.getByTestId("bordfeed-board-name").fill("Example Board");
    await page.getByTestId("bordfeed-register-submit").click();
    await expect(page.getByTestId("bordfeed-error")).toContainText(
      "5 signups per hour"
    );
    await expect(page.getByTestId("bordfeed-paste-key")).toBeVisible();
    await expect(card).toHaveAttribute("data-state", "sample");

    await page.getByTestId("bordfeed-email").fill("workspace@example.com");
    await page.getByTestId("bordfeed-board-name").fill("Example Board");
    await page.getByTestId("bordfeed-register-submit").click();
    await expect(card).toHaveAttribute("data-state", "awaiting_code");

    await page.getByTestId("bordfeed-code").fill("424242");
    await page.getByTestId("bordfeed-verify-submit").click();
    const workspace = page.getByTestId("bordfeed-workspace-select");
    await expect(
      workspace.locator("option[value='example-workspace']")
    ).toHaveCount(1);
    await workspace.selectOption("example-workspace");
    await page.getByTestId("bordfeed-register-submit").click();
    await page.getByTestId("bordfeed-code").fill("424242");
    await page.getByTestId("bordfeed-verify-submit").click();
    await expect(card).toHaveAttribute("data-state", "connected");
    await expect(page.getByTestId("bordfeed-message")).toHaveText(
      CONNECTED_MESSAGE
    );

    const recorded = await bordfeedRequests();
    const bodies = registerBodies(recorded);
    expect(bodies).toHaveLength(3);
    const last = bodies[2] ?? {};
    expect(last.workspace).toBe("example-workspace");
    for (const body of bodies) {
      expect(body.ref).toBe("bordful");
      expect(body.utm_source).toBe("bordful");
      expect(body.utm_medium).toBe("admin");
      expect(body.utm_campaign).toBe("connect");
      expect(body.agent_name).toBe("bordful");
      expect(body.template_id).toBe("engineering-it");
      expect(body.install_id).toMatch(INSTALL_ID);
    }
    for (const entry of recorded) {
      expect(entry["x-bordfeed-client"]).toBe("bordful/1.0.0-beta.1");
    }
    const feedJobs = recorded.filter((entry) =>
      FEED_JOBS_PATH.test(entry.path)
    );
    expect(feedJobs.length).toBeGreaterThan(0);
    for (const entry of feedJobs) {
      expect(queryValues(entry.query.include)).toContain("description_html");
    }

    await page.goto("/jobs/search?q=Mock+Feed+Engineer");
    await expect(page.getByTestId("job-count")).toHaveAttribute(
      "data-count",
      "25"
    );
    await page.goto("/jobs/search?q=Sample+Platform+Engineer");
    await expect(page.getByTestId("board-empty")).toBeVisible();

    await page.goto("/admin");
    const toggle = page.getByTestId("bordfeed-show-attribution");
    await toggle.uncheck();
    const attributionForm = page
      .locator("form")
      .filter({ has: page.getByTestId("bordfeed-show-attribution") });
    if ((await attributionForm.locator("button[type='submit']").count()) > 0) {
      await attributionForm.locator("button[type='submit']").click();
    }
    await page.goto("/");
    await expect(page.getByTestId("bordfeed-credit")).toHaveCount(0);

    await page.goto("/admin");
    await page.getByTestId("bordfeed-show-attribution").check();
    const restoreForm = page
      .locator("form")
      .filter({ has: page.getByTestId("bordfeed-show-attribution") });
    if ((await restoreForm.locator("button[type='submit']").count()) > 0) {
      await restoreForm.locator("button[type='submit']").click();
    }
  });
});
