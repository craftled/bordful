import { appendFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

import { ensureAdmin } from "./support/admin";
import { createCompany, createJob, deleteWhere } from "./support/seed";

const COLOR_SCHEMES = ["light", "dark"] as const;
type Scheme = (typeof COLOR_SCHEMES)[number];

// The desktop project viewport keeps the original test names; phone adds a suffix.
const VIEWPORTS = [
  { label: "", name: "desktop", size: null },
  { label: " on phone", name: "phone", size: { height: 812, width: 375 } },
] as const;
type Viewport = (typeof VIEWPORTS)[number];

const APP_PAGES = [
  { name: "app home", path: "/" },
  { name: "jobs", path: "/jobs" },
  { name: "alerts", path: "/alerts" },
  { name: "post", path: "/post" },
];
const MARKETING_PAGES = [
  { name: "alternatives hub", path: "/alternatives" },
  {
    name: "alternatives wp-job-manager",
    path: "/alternatives/wp-job-manager",
  },
];
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// Every row this spec creates carries the marker, so cleanup finds them all.
const SEED_MARK = "A11yzq";
const SEED_DOMAIN = "a11yzq";
// Short titles over a company link failed target-size before the row fix,
// and a two-letter company name checks the link's 24px width.
const SEED_COMPANIES = [
  { domain: `${SEED_DOMAIN}-example.test`, name: `${SEED_MARK} Example Co` },
  { domain: `${SEED_DOMAIN}-ax.test`, name: "Ax" },
];
const SEED_JOBS = [
  { company: 0, title: `${SEED_MARK} Senior Role` },
  { company: 1, title: `${SEED_MARK} Designer` },
  {
    company: 0,
    salaryCurrency: "USD",
    salaryMax: 160_000,
    salaryMin: 120_000,
    title: `${SEED_MARK} Backend Engineer, Payments and Billing Infrastructure`,
  },
];

function marketingBase(): string {
  if (process.env.E2E_MARKETING_BASE_URL) {
    return process.env.E2E_MARKETING_BASE_URL;
  }
  const port = process.env.APP_MARKETING_PORT ?? "3001";
  return `http://127.0.0.1:${port}`;
}

async function open(
  page: Page,
  scheme: Scheme,
  viewport: Viewport,
  url: string
) {
  if (viewport.size) {
    await page.setViewportSize(viewport.size);
  }
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto(url);
}

async function scan(
  page: Page,
  pageName: string,
  scheme: Scheme,
  viewport: Viewport
) {
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
      `${pageName} ${scheme} ${viewport.name}: ${violation.id}, ${violation.impact}, ${violation.nodes} nodes`
    );
  }

  if (process.env.AXE_RESULTS_FILE) {
    await appendFile(
      process.env.AXE_RESULTS_FILE,
      `${JSON.stringify({ page: pageName, scheme, viewport: viewport.name, violations })}\n`
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
    `${pageName} (${scheme}, ${viewport.name}) serious or critical axe violations:\n${details}`
  ).toEqual([]);
}

async function removeSeededRows(request: APIRequestContext): Promise<void> {
  const admin = await ensureAdmin(request);
  try {
    await deleteWhere(admin, "jobs", `where[title][like]=${SEED_MARK}`);
    await deleteWhere(admin, "companies", `where[domain][like]=${SEED_DOMAIN}`);
  } finally {
    await admin.dispose();
  }
}

test.describe("S0 accessibility", { tag: ["@S0-a11y"] }, () => {
  // The scans need a known board: only the sample jobs, plus the rows this
  // spec seeds and removes itself. A crashed earlier run may leave those.
  test.beforeAll(async ({ browser, request }, testInfo) => {
    await removeSeededRows(request);
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

  for (const viewport of VIEWPORTS) {
    for (const scheme of COLOR_SCHEMES) {
      for (const appPage of APP_PAGES) {
        test(`${appPage.name} in ${scheme} mode${viewport.label}`, async ({
          page,
        }) => {
          await open(page, scheme, viewport, appPage.path);
          await scan(page, appPage.name, scheme, viewport);
        });
      }

      test(`job detail in ${scheme} mode${viewport.label}`, async ({
        page,
      }) => {
        await page.goto("/");
        const detailHref = await page
          .locator('[data-testid="job-row-link"]')
          .first()
          .getAttribute("href");
        if (!detailHref) {
          throw new Error("No job detail link found on the board home");
        }
        await open(
          page,
          scheme,
          viewport,
          new URL(detailHref, page.url()).href
        );
        await scan(page, "job detail", scheme, viewport);
      });

      test(`marketing home in ${scheme} mode${viewport.label}`, async ({
        page,
      }) => {
        await open(page, scheme, viewport, new URL("/", marketingBase()).href);
        await scan(page, "marketing home", scheme, viewport);
      });

      for (const marketingPage of MARKETING_PAGES) {
        test(`${marketingPage.name} in ${scheme} mode${viewport.label}`, async ({
          page,
        }) => {
          await open(
            page,
            scheme,
            viewport,
            new URL(marketingPage.path, marketingBase()).href
          );
          await scan(page, marketingPage.name, scheme, viewport);
        });
      }
    }
  }

  test.describe("board rows with company links", () => {
    test.describe.configure({ mode: "serial" });

    test.beforeAll(async ({ request }) => {
      await removeSeededRows(request);
      const admin = await ensureAdmin(request);
      try {
        const companies = await Promise.all(
          SEED_COMPANIES.map((company) =>
            createCompany(admin, {
              ...company,
              website: `https://${company.domain}`,
            })
          )
        );
        await Promise.all(
          SEED_JOBS.map(({ company, ...job }) =>
            createJob(admin, {
              ...job,
              _status: "published",
              company: companies[company]?.id,
              companyName: SEED_COMPANIES[company]?.name,
              employmentType: "full-time",
              origin: "manual",
              workplaceType: "remote",
            })
          )
        );
      } finally {
        await admin.dispose();
      }
    });

    // Later flows such as E1 count the sample rows on a fresh board.
    test.afterAll(async ({ browser, request }, testInfo) => {
      await removeSeededRows(request);
      const page = await browser.newPage({
        baseURL: testInfo.project.use.baseURL,
      });
      await page.goto("/");
      await expect(
        page.locator('[data-testid="job-row"]', { hasText: SEED_MARK }),
        "seeded rows are gone from the board home"
      ).toHaveCount(0);
      await page.close();
    });

    // The board home renders the "board" row variant; a taxonomy archive
    // renders "archive". Every seeded job is full-time, so it lists them all.
    const seededPages = [
      { name: "board home", path: "/", scanName: "app home" },
      {
        name: "full-time archive",
        path: "/jobs/type/full-time",
        scanName: "full-time archive",
      },
    ];

    for (const viewport of VIEWPORTS) {
      for (const scheme of COLOR_SCHEMES) {
        for (const seededPage of seededPages) {
          test(`${seededPage.name} with company links in ${scheme} mode${viewport.label}`, async ({
            page,
          }) => {
            await open(page, scheme, viewport, seededPage.path);
            await expect(
              page
                .locator('[data-testid="job-row"]', { hasText: SEED_MARK })
                .locator('a[href^="/companies/"]')
            ).toHaveCount(SEED_JOBS.length);
            await scan(
              page,
              `${seededPage.scanName} with company links`,
              scheme,
              viewport
            );
          });
        }
      }
    }
  });
});
