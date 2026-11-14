import { appendFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const COLOR_SCHEMES = ["light", "dark"] as const;
const APP_PAGES = [
  { name: "app home", path: "/" },
  { name: "jobs", path: "/jobs" },
  { name: "alerts", path: "/alerts" },
  { name: "post", path: "/post" },
];
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function marketingBase(): string {
  if (process.env.E2E_MARKETING_BASE_URL) {
    return process.env.E2E_MARKETING_BASE_URL;
  }
  const port = process.env.APP_MARKETING_PORT ?? "3001";
  return `http://127.0.0.1:${port}`;
}

async function scan(
  page: Page,
  pageName: string,
  scheme: (typeof COLOR_SCHEMES)[number],
  url: string
) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto(url);

  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const violations = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? null,
    nodes: violation.nodes.length,
    targets: violation.nodes.flatMap((node) => node.target).slice(0, 3),
  }));
  const moderateAndMinor = violations.filter(
    (violation) =>
      violation.impact === "moderate" || violation.impact === "minor"
  );

  for (const violation of moderateAndMinor) {
    console.log(
      `${pageName} ${scheme}: ${violation.id}, ${violation.impact}, ${violation.nodes} nodes`
    );
  }

  if (process.env.AXE_RESULTS_FILE) {
    await appendFile(
      process.env.AXE_RESULTS_FILE,
      `${JSON.stringify({ page: pageName, scheme, violations })}\n`
    );
  }

  const seriousOrCritical = violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical"
  );
  const details = seriousOrCritical
    .map(
      (violation) =>
        `${violation.id}: ${violation.targets.join(", ") || "no target"}`
    )
    .join("\n");
  expect(
    seriousOrCritical,
    `${pageName} (${scheme}) serious or critical axe violations:\n${details}`
  ).toEqual([]);
}

test.describe("S0 accessibility", { tag: ["@S0-a11y"] }, () => {
  // Rows seeded by later specs carry company links, which still fail
  // target-size (a known finding), so the scan needs the fresh sample board.
  test.beforeAll(async ({ browser }, testInfo) => {
    const page = await browser.newPage({
      baseURL: testInfo.project.use.baseURL,
    });
    await page.goto("/");
    const rows = page.locator('[data-testid="job-row"]');
    await expect(rows.first()).toBeVisible();
    const origins = await rows.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-origin"))
    );
    expect(
      origins.filter((origin) => origin !== "bordfeed_sample"),
      "a11y needs a fresh database with only the sample jobs"
    ).toEqual([]);
    await page.close();
  });

  for (const appPage of APP_PAGES) {
    for (const scheme of COLOR_SCHEMES) {
      test(`${appPage.name} in ${scheme} mode`, async ({ page }) => {
        await scan(page, appPage.name, scheme, appPage.path);
      });
    }
  }

  for (const scheme of COLOR_SCHEMES) {
    test(`job detail in ${scheme} mode`, async ({ page }) => {
      await page.goto("/");
      const detailHref = await page
        .locator('[data-testid="job-row-link"]')
        .first()
        .getAttribute("href");
      if (!detailHref) {
        throw new Error("No job detail link found on the board home");
      }
      await scan(
        page,
        "job detail",
        scheme,
        new URL(detailHref, page.url()).href
      );
    });

    test(`marketing home in ${scheme} mode`, async ({ page }) => {
      await scan(
        page,
        "marketing home",
        scheme,
        new URL("/", marketingBase()).href
      );
    });
  }
});
