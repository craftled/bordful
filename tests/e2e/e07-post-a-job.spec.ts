import { expect, test } from "@playwright/test";

import { ensureAdmin } from "./support/admin";
import { runCron } from "./support/cron";
import { createJob, docString, updateGlobal } from "./support/seed";

const DAY_MS = 86_400_000;

test.describe("E7 post-a-job", { tag: ["@E7"] }, () => {
  test("lists a paid job until the expire cron passes validThrough", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const admin = await ensureAdmin(request);
    await updateGlobal(admin, "site-settings", {
      postJob: {
        durationDays: 30,
        enabled: true,
        paymentLinkUrl: "https://buy.stripe.com/test_e2e",
        priceLabel: "$99",
      },
    });

    await page.goto("/");
    await expect(page.getByTestId("site-nav")).toContainText("Post a job");
    await page.goto("/post");
    await expect(page.getByTestId("post-job-cta")).toHaveAttribute(
      "href",
      "https://buy.stripe.com/test_e2e"
    );
    await expect(page.getByTestId("post-job-price")).toHaveText("$99");
    await expect(page.getByTestId("post-job-duration")).toHaveText(
      "Listed for 30 days"
    );

    const created = await createJob(admin, {
      _status: "published",
      companyName: "E7zq Example Co",
      origin: "paid",
      paymentReference: "test_ref_e7",
      title: "E7zq Paid Role",
    });
    const id = docString(created, "id");
    const storedResponse = await admin.get(`/api/jobs/${id}`);
    expect(storedResponse.ok()).toBe(true);
    const stored = (await storedResponse.json()) as Record<string, unknown>;
    const publishedAt = docString(stored, "publishedAt");
    const validThrough = docString(stored, "validThrough");
    const slug = docString(stored, "slug");
    expect(new Date(validThrough).getTime()).toBe(
      new Date(publishedAt).getTime() + 30 * DAY_MS
    );

    await page.goto("/jobs/search?q=E7zq");
    await expect(page.getByTestId("job-row")).toHaveCount(1);

    const early = new Date(
      new Date(validThrough).getTime() - 60_000
    ).toISOString();
    await runCron(request, "expire", early);
    await page.goto("/jobs/search?q=E7zq");
    await expect(page.getByTestId("job-row")).toHaveCount(1);

    const late = new Date(
      new Date(validThrough).getTime() + 60_000
    ).toISOString();
    const expired = await runCron(request, "expire", late);
    expect(expired.ok()).toBe(true);
    const body = (await expired.json()) as { unpublished?: number };
    expect(body.unpublished ?? 0).toBeGreaterThanOrEqual(1);
    await page.goto("/jobs/search?q=E7zq");
    await expect(page.getByTestId("board-empty")).toBeVisible();
    const gone = await request.get(`/jobs/${slug}`);
    expect(gone.status()).toBe(404);
    await admin.dispose();
  });
});
