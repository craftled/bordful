import { expect, type Page, test } from "@playwright/test";

import { ensureAdmin } from "./support/admin";
import { createJob } from "./support/seed";

const ROWS = [
  ["E2zq Full-time 1", "full-time", "remote"],
  ["E2zq Full-time 2", "full-time", "remote"],
  ["E2zq Full-time 3", "full-time", "remote"],
  ["E2zq Full-time 4", "full-time", "remote"],
  ["E2zq Full-time 5", "full-time", "remote"],
  ["E2zq Contract 1", "contract", "hybrid"],
  ["E2zq Contract 2", "contract", "hybrid"],
  ["E2zq Contract 3", "contract", "hybrid"],
  ["E2zq Contract 4", "contract", "hybrid"],
  ["E2zq Analyst", "part-time", "onsite"],
  ["E2zq Part-time 2", "part-time", "onsite"],
  ["E2zq Part-time 3", "part-time", "onsite"],
] as const;

async function search(page: Page, query: string): Promise<void> {
  await page.goto("/");
  await page.getByTestId("board-search-input").fill(query);
  await page.getByTestId("board-search-submit").click();
  await page.waitForLoadState("domcontentloaded");
}

async function walkRows(
  page: Page,
  seen: Set<string> = new Set()
): Promise<number> {
  const url = page.url();
  if (seen.has(url) || seen.size >= 20) {
    return 0;
  }
  seen.add(url);
  const rows = await page.getByTestId("job-row").count();
  const next = page.getByTestId("pagination-next");
  if ((await next.count()) === 0) {
    return rows;
  }
  const href = await next.getAttribute("href");
  if (href === null || href.length === 0) {
    return rows;
  }
  await next.click();
  await page.waitForLoadState("domcontentloaded");
  return rows + (await walkRows(page, seen));
}

test.describe("E2 browse-filter-search", { tag: ["@E2"] }, () => {
  test("filters, search and pagination agree on the seeded rows", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const admin = await ensureAdmin(request);
    await Promise.all(
      ROWS.map(([title, employmentType, workplaceType]) =>
        createJob(admin, {
          _status: "published",
          companyName: "E2zq Example Co",
          employmentType,
          origin: "manual",
          title,
          workplaceType,
        })
      )
    );
    await admin.dispose();

    await search(page, "E2zq");
    await expect(page.getByTestId("job-count")).toHaveAttribute(
      "data-count",
      "12"
    );
    await expect(page.getByTestId("job-row")).toHaveCount(12);

    await page.goto("/jobs/search?q=E2zq&per_page=10");
    await expect(page.getByTestId("job-row")).toHaveCount(10);
    const pagedCount = await page
      .getByTestId("job-count")
      .getAttribute("data-count");
    await page.getByTestId("pagination-next").click();
    await expect(page.getByTestId("job-row")).toHaveCount(2);
    expect(10 + 2).toBe(Number(pagedCount));

    await page.getByTestId("filter-type-full-time").click();
    await expect(page.getByTestId("job-count")).toHaveAttribute(
      "data-count",
      "5"
    );
    await expect(page.getByTestId("job-row")).toHaveCount(5);
    await expect(page.getByTestId("filter-type-full-time")).toHaveAttribute(
      "aria-current",
      "true"
    );

    await page.getByTestId("filter-remote").click();
    await expect(page.getByTestId("job-count")).toHaveAttribute(
      "data-count",
      "5"
    );
    await expect(page.getByTestId("job-row")).toHaveCount(5);

    await search(page, "E2zq Analyst");
    await expect(page.getByTestId("job-row")).toHaveCount(1);

    await page.getByTestId("filter-clear").click();
    await page.waitForLoadState("domcontentloaded");
    const total = await page
      .getByTestId("job-count")
      .getAttribute("data-count");
    const rows = await walkRows(page);
    expect(String(rows)).toBe(total);
  });
});
