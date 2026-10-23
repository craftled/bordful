import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

import { ensureAdmin } from "./support/admin";
import { createCompany, createJob, docString } from "./support/seed";

async function expectArchive(page: Page, path: string): Promise<void> {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId("taxonomy-heading")).toBeVisible();
}

async function redirectTo(
  request: APIRequestContext,
  path: string
): Promise<string> {
  const response = await request.get(path, { maxRedirects: 0 });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  const location = response.headers().location ?? "";
  return new URL(location, "http://127.0.0.1").pathname;
}

test.describe("E4 taxonomy-and-companies", { tag: ["@E4"] }, () => {
  test("serves taxonomy archives and the company page", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const admin = await ensureAdmin(request);
    const company = await createCompany(admin, {
      domain: "e4.example",
      name: "E4zq Example Co",
      website: "https://e4.example",
    });
    await createJob(admin, {
      _status: "published",
      careerLevel: ["Senior"],
      company: company.id,
      companyName: "E4zq Example Co",
      countryCode: "DE",
      employmentType: "full-time",
      languages: [{ value: "en" }],
      origin: "manual",
      seniority: "senior",
      title: "E4zq Senior Role",
      workplaceType: "remote",
    });
    await admin.dispose();
    const companySlug = docString(company, "slug");

    await page.goto("/jobs");
    await expect(page.getByTestId("taxonomy-hub")).toBeVisible();
    expect(await page.getByTestId("taxonomy-link").count()).toBeGreaterThan(0);

    await expectArchive(page, "/jobs/type/full-time");
    await expectArchive(page, "/jobs/level/senior");
    await expectArchive(page, "/jobs/location/remote");
    await expectArchive(page, "/jobs/location/de");
    await expectArchive(page, "/jobs/language/en");

    const missing = await request.get("/jobs/type/volunteer");
    expect(missing.status()).toBe(404);
    expect(await redirectTo(request, "/jobs/type/full-time/page/1")).toBe(
      "/jobs/type/full-time"
    );
    expect(await redirectTo(request, "/jobs/page/1")).toBe("/");

    await page.goto("/companies");
    await expect(
      page.locator(
        `[data-testid="company-row"][data-company-slug="${companySlug}"]`
      )
    ).toBeVisible();
    const companyPage = await page.goto(`/companies/${companySlug}`);
    expect(companyPage?.status()).toBe(200);
    expect(await page.getByTestId("job-row").count()).toBeGreaterThan(0);
  });
});
