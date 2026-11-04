import { spawnSync } from "node:child_process";

import { expect, type Page, test } from "@playwright/test";

import { ensureAdmin, loginInBrowser } from "./support/admin";
import { mockOrigin } from "./support/mock";
import { createJob, lexicalParagraph, readGlobal } from "./support/seed";

const KEYWORD = "Sample Platform Engineer";
const BOARD_SEARCH = "/jobs/search?q=Sample+Platform";
const MANUAL_SEARCH = "/jobs/search?q=Sample+Platform+E14zq";

// `bordful sample` imports the Bordfeed preview through the normal sync, so
// this flow starts from imported jobs whatever earlier flows left behind.
function importSample(): void {
  const run = spawnSync("bun", ["run", "bordful", "sample"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, BORDFEED_BASE_URL: mockOrigin() },
    timeout: 120_000,
  });
  expect(run.status, run.stderr ?? "").toBe(0);
}

async function boardCount(page: Page, path: string): Promise<number> {
  await page.goto(path);
  const count = await page.getByTestId("job-count").getAttribute("data-count");
  return Number(count ?? "0");
}

test.describe("E14 import-blocklist", { tag: ["@E14"] }, () => {
  test("saving the blocklist in the admin unpublishes matching imports only", async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);
    const admin = await ensureAdmin(request);
    await createJob(admin, {
      _status: "published",
      applyUrl: "https://apply.example/e14zq",
      companyName: "E14zq Example Co",
      description: lexicalParagraph("Example description for E14zq."),
      employmentType: "full-time",
      origin: "manual",
      title: "Sample Platform E14zq Manual Role",
      workplaceType: "remote",
    });
    importSample();

    const manual = await boardCount(page, MANUAL_SEARCH);
    expect(manual).toBeGreaterThan(0);
    const before = await boardCount(page, BOARD_SEARCH);
    expect(before).toBeGreaterThan(manual);

    await loginInBrowser(page);
    await page.goto("/admin/globals/import-blocklist");
    const keywords = page.locator("textarea[name='keywords']");
    await expect(keywords).toBeVisible();
    await keywords.fill(KEYWORD);
    await page.getByRole("button", { name: "Save" }).click();
    await expect
      .poll(
        async () => (await readGlobal(admin, "import-blocklist")).keywords,
        {
          timeout: 30_000,
        }
      )
      .toBe(KEYWORD);
    await page.reload();
    await expect(page.locator("textarea[name='keywords']")).toHaveValue(
      KEYWORD
    );

    // The imported jobs come down. The manual job stays up.
    expect(await boardCount(page, BOARD_SEARCH)).toBe(manual);
    await expect(
      page.getByText("Sample Platform E14zq Manual Role").first()
    ).toBeVisible();

    // A sync while the keyword is blocked does not bring them back.
    importSample();
    expect(await boardCount(page, BOARD_SEARCH)).toBe(manual);

    // Clear the list so a local rerun starts from an empty blocklist.
    await page.goto("/admin/globals/import-blocklist");
    await page.locator("textarea[name='keywords']").fill("");
    await page.getByRole("button", { name: "Save" }).click();
    await expect
      .poll(
        async () =>
          (await readGlobal(admin, "import-blocklist")).keywords ?? "",
        { timeout: 30_000 }
      )
      .toBe("");
    await admin.dispose();
  });
});
