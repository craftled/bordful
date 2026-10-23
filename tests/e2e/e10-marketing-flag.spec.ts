import { expect, type Page, test } from "@playwright/test";

const MARKETING_PAGES = [
  "/pricing",
  "/showcase",
  "/changelog",
  "/about",
  "/privacy",
  "/terms",
];

const DEPLOY_PREFIX =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcraftled%2Fbordful%2Ftree%2Fv1";

function marketingBase(): string {
  if (process.env.E2E_MARKETING_BASE_URL) {
    return process.env.E2E_MARKETING_BASE_URL;
  }
  const port = process.env.APP_MARKETING_PORT ?? "3001";
  return `http://127.0.0.1:${port}`;
}

async function expectOneHeading(page: Page, url: string): Promise<void> {
  const response = await page.goto(url);
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
}

test.describe("E10 marketing-flag", { tag: ["@E10"] }, () => {
  test("fork serves the board and marketing serves the site", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await expect(page.getByTestId("job-list")).toBeVisible();
    await expect(page.getByTestId("marketing-home")).toHaveCount(0);

    const blocked = await Promise.all(
      MARKETING_PAGES.map((path) => request.get(path))
    );
    for (const response of blocked) {
      expect(response.status()).toBe(404);
    }

    const marketing = marketingBase();
    await page.goto(marketing);
    await expect(page.getByTestId("marketing-home")).toBeVisible();
    await expect(page.getByTestId("marketing-deploy-button")).toHaveAttribute(
      "href",
      new RegExp(`^${DEPLOY_PREFIX.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
    );
    await page.goto(new URL("/jobs", marketing).href);
    await expect(page.getByTestId("job-list")).toBeVisible();

    await expectOneHeading(page, new URL("/pricing", marketing).href);
    await expectOneHeading(page, new URL("/showcase", marketing).href);
    await expectOneHeading(page, new URL("/changelog", marketing).href);
    await expectOneHeading(page, new URL("/about", marketing).href);
    await expectOneHeading(page, new URL("/privacy", marketing).href);
    await expectOneHeading(page, new URL("/terms", marketing).href);
  });
});
