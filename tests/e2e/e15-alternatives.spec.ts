import { expect, test } from "@playwright/test";

const HUB_HEADING = /Job board software/u;
const DEPLOY_HREF = /^https:\/\/vercel\.com\/new\/clone/u;
const CHILD_PATH = /\/alternatives\/wp-job-manager$/u;
const CHILD_HEADING = /WP Job Manager alternative/u;
const FAQ_HEADING = /Frequently asked/u;

function marketingBase(): string {
  if (process.env.E2E_MARKETING_BASE_URL) {
    return process.env.E2E_MARKETING_BASE_URL;
  }
  const port = process.env.APP_MARKETING_PORT ?? "3001";
  return `http://127.0.0.1:${port}`;
}

test.describe("E15 alternatives", { tag: ["@E15"] }, () => {
  test("hub, comparison, footer, schema and route behavior", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const origin = marketingBase();
    await page.goto(origin);
    await page.goto(new URL("/alternatives", origin).href);

    await expect(
      page.getByRole("heading", { level: 1, name: HUB_HEADING })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Bordful vs WP Job Manager" })
    ).toHaveAttribute("href", "/alternatives/wp-job-manager");
    await expect(
      page.getByRole("link", { name: "Deploy to Vercel" })
    ).toHaveAttribute("href", DEPLOY_HREF);
    await expect(
      page.getByRole("link", { name: "Custom Setup, $999 once" })
    ).toHaveAttribute("href", "https://buy.stripe.com/14A5kE3sN6D34HL6X2dnW0r");
    await page.getByRole("link", { name: "Bordful vs WP Job Manager" }).click();

    await expect(page).toHaveURL(CHILD_PATH);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: CHILD_HEADING,
      })
    ).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(2);
    const faqDetails = page
      .getByRole("heading", { name: FAQ_HEADING })
      .locator("xpath=ancestor::section[1]")
      .locator("details");
    await expect(faqDetails).toHaveCount(6);
    await expect(
      page.getByText("Facts last checked: 16 November 2026, Europe/Madrid.")
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Deploy to Vercel" })
    ).toHaveCount(2);
    await expect(
      page.getByRole("link", { name: "Custom Setup, $999 once" })
    ).toHaveCount(2);

    const canonical = page.locator('link[rel="canonical"]');
    const canonicalHref = await canonical.getAttribute("href");
    expect(new URL(canonicalHref ?? "", origin).pathname).toBe(
      "/alternatives/wp-job-manager"
    );
    const graph = await page
      .locator('script[type="application/ld+json"]')
      .evaluate((script) => JSON.parse(script.textContent ?? "{}"));
    expect(
      graph["@graph"].map((node: { "@type": string }) => node["@type"])
    ).toEqual(["WebPage", "BreadcrumbList", "FAQPage"]);
    expect(graph["@graph"][2].mainEntity).toHaveLength(
      await faqDetails.count()
    );

    await page.setViewportSize({ height: 812, width: 375 });
    const dataRows = await page.locator("table tbody tr").all();
    await Promise.all(
      dataRows.map(async (row) => {
        const productLabels = row.locator('[aria-hidden="true"]');
        await expect(productLabels).toHaveCount(2);
        await Promise.all([
          expect(productLabels.nth(0)).toHaveText("WP Job Manager"),
          expect(productLabels.nth(0)).toBeVisible(),
          expect(productLabels.nth(1)).toHaveText("Bordful"),
          expect(productLabels.nth(1)).toBeVisible(),
        ]);
      })
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(375);

    const missing = await page.request.get(
      new URL("/alternatives/niceboard", origin).href
    );
    expect(missing.status()).toBe(404);
    await page.goto(new URL("/alternatives/", origin).href);
    await expect(page).toHaveURL(new URL("/alternatives", origin).href);

    await page.goto(origin);
    const footerLink = page
      .getByTestId("marketing-footer")
      .getByRole("link", { name: "Alternatives" });
    await footerLink.click();
    await expect(page).toHaveURL(new URL("/alternatives", origin).href);
  });
});
