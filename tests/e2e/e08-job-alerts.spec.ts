import { expect, test } from "@playwright/test";
import type { StoredEmail } from "../mocks/resend";
import { ensureAdmin } from "./support/admin";
import { runCron } from "./support/cron";
import { resendEmails, resetMock } from "./support/mock";
import { createJob, docString, readGlobal, updateGlobal } from "./support/seed";

const DAY_MS = 86_400_000;

function emailSource(email: StoredEmail): string {
  return `${email.text}\n${email.html}`.replaceAll("&amp;", "&");
}

function linkWith(email: StoredEmail, path: string): string {
  const source = emailSource(email);
  const absolute = new RegExp(`https?:\\/\\/[^\\s"'<>]+${path}[^\\s"'<>]*`);
  const found = absolute.exec(source);
  if (found !== null) {
    return found[0];
  }
  const relative = new RegExp(`${path}[^\\s"'<>]*`);
  const rel = relative.exec(source);
  if (rel === null) {
    throw new Error(`missing ${path}`);
  }
  return rel[0];
}

test.describe("E8 job-alerts", { tag: ["@E8"] }, () => {
  test("confirms, sends one digest, then unsubscribes", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    await resetMock();
    const admin = await ensureAdmin(request);
    await updateGlobal(admin, "site-settings", {
      alerts: {
        defaultFrequency: "weekly",
        enabled: true,
        fromEmail: "alerts@board.example",
        fromName: "Example Board Alerts",
      },
    });
    const settings = await readGlobal(admin, "site-settings");
    const siteName = docString(settings, "name");

    await page.goto("/alerts");
    await expect(page.getByTestId("alerts-frequency")).toHaveValue("weekly");
    await page.getByTestId("alerts-email").fill("ada@example.com");
    await page.getByTestId("alerts-remote").check();
    await page.getByTestId("alerts-submit").click();
    await expect(page.getByTestId("alerts-status")).toHaveText(
      "Check your inbox to confirm your job alerts."
    );

    const confirmEmails = (await resendEmails()).filter(
      (email) => email.to === "ada@example.com"
    );
    expect(confirmEmails).toHaveLength(1);
    expect(confirmEmails[0]?.subject).toBe(
      `Confirm your job alerts on ${siteName}`
    );
    const [confirmEmail] = confirmEmails;
    if (confirmEmail === undefined) {
      throw new Error("missing confirm email");
    }
    await page.goto(linkWith(confirmEmail, "/alerts/confirm"));
    await page.getByTestId("alerts-confirm-button").click();
    await expect(page.getByTestId("alerts-confirmed")).toBeVisible();

    const created = await createJob(admin, {
      _status: "published",
      companyName: "E8zq Example Co",
      origin: "manual",
      title: "E8zq Remote Role",
      workplaceType: "remote",
    });
    const slug = docString(created, "slug");
    const later = new Date(Date.now() + 8 * DAY_MS).toISOString();
    const digestRun = await runCron(request, "alerts", later);
    expect(digestRun.ok()).toBe(true);

    const emails = (await resendEmails()).filter(
      (email) => email.to === "ada@example.com"
    );
    expect(emails).toHaveLength(2);
    const [, digest] = emails;
    if (digest === undefined) {
      throw new Error("missing digest");
    }
    expect(digest.subject).toBe(`1 new job on ${siteName}`);
    expect(digest.text).toContain(`/jobs/${slug}`);
    expect(digest.headers["List-Unsubscribe"]).toBeTruthy();
    expect(digest.headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click"
    );

    await page.goto(linkWith(digest, "/alerts/unsubscribe"));
    await page.getByTestId("alerts-unsubscribe-button").click();
    await expect(page.getByTestId("alerts-unsubscribed")).toBeVisible();

    const before = (await resendEmails()).length;
    const muchLater = new Date(Date.now() + 16 * DAY_MS).toISOString();
    await runCron(request, "alerts", muchLater);
    expect(await resendEmails()).toHaveLength(before);
    await admin.dispose();
  });
});
