import { expect, test } from "@playwright/test";

import { bordfeedRequests } from "./support/mock";

const CREDIT_URL =
  "https://bordfeed.com/?ref=bordful&utm_source=bordful&utm_medium=credit&utm_campaign=board";
const NOINDEX = /noindex/;

test.describe("E1 fresh-deploy-sample", { tag: ["@E1"] }, () => {
  test("shows 20 sample jobs, the credit, and noindex detail pages", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    const samples = page.locator(
      '[data-testid="job-row"][data-origin="bordfeed_sample"]'
    );
    await expect(samples).toHaveCount(20);
    await expect(page.getByTestId("job-count")).toHaveAttribute(
      "data-count",
      "20"
    );
    const credit = page.getByTestId("bordfeed-credit");
    await expect(credit).toHaveText("Jobs by Bordfeed");
    await expect(credit).toHaveAttribute("href", CREDIT_URL);

    const href = await samples
      .first()
      .getByTestId("job-row-link")
      .getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href ?? "/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      NOINDEX
    );
    await expect(
      page.locator('script[type="application/ld+json"]')
    ).toHaveCount(0);

    const recorded = await bordfeedRequests();
    const preview = recorded.find(
      (entry) => entry.path === "/api/v1/templates/engineering-it/preview"
    );
    expect(preview?.["x-bordfeed-client"]).toBe("bordful/1.0.0-beta.1");
  });
});
