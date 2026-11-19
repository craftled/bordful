import { expect, test } from "@playwright/test";

import { ensureAdmin } from "./support/admin";
import { installCspProbe, readCspViolations } from "./support/html";
import { createCompany, createJob, deleteWhere } from "./support/seed";

// An employer ATS host, like the myworkdayjobs.com logos Bordfeed samples
// carry. CSP img-src does not allow it, so the row must not render it.
const BLOCKED_LOGO = "https://example.myworkdayjobs.com/logo.png";
const COMPANY = "E15zq Workday Co";
const TITLE = "E15zq Blocked Logo Role";

test.describe("E15 logo-fallback", { tag: ["@E15"] }, () => {
  test("a job whose logo URL is blocked by CSP shows the letter tile", async ({
    page,
    request,
  }, testInfo) => {
    test.setTimeout(120_000);
    const admin = await ensureAdmin(request);
    try {
      await deleteWhere(admin, "jobs", `where[title][equals]=${TITLE}`);
      await deleteWhere(admin, "companies", `where[name][equals]=${COMPANY}`);
      const company = await createCompany(admin, {
        logoUrl: BLOCKED_LOGO,
        name: COMPANY,
      });
      await createJob(admin, {
        _status: "published",
        company: company.id,
        companyName: COMPANY,
        employmentType: "full-time",
        origin: "manual",
        title: TITLE,
        workplaceType: "remote",
      });

      await installCspProbe(page);
      await page.setViewportSize({ height: 900, width: 1440 });

      // The search page is a /jobs list too, and it keeps the seeded row on
      // page one whatever else the board holds.
      await page.goto("/jobs/search?q=E15zq");
      const row = page.getByTestId("job-row").filter({ hasText: TITLE });
      await expect(row).toHaveCount(1);
      await page.screenshot({ path: testInfo.outputPath("jobs-rows.png") });
      await expect(row.locator("img")).toHaveCount(0);
      await expect(row.getByTestId("job-row-logo")).toHaveText("E");
      await row.screenshot({ path: testInfo.outputPath("blocked-row.png") });

      expect(await readCspViolations(page)).not.toContain("img-src");
    } finally {
      await deleteWhere(admin, "jobs", `where[title][equals]=${TITLE}`);
      await deleteWhere(admin, "companies", `where[name][equals]=${COMPANY}`);
      await admin.dispose();
    }
  });
});
