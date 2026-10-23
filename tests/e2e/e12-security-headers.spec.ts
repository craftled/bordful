import type { APIResponse } from "@playwright/test";
import { expect, type Page, test } from "@playwright/test";

import { ensureAdmin } from "./support/admin";
import {
  installCspProbe,
  nonceFromAttributes,
  nonceFromPolicy,
  readCspViolations,
  readScripts,
  sha256Base64,
} from "./support/html";
import { createJob, docString } from "./support/seed";

function headerValue(headers: Record<string, string>, name: string): string {
  const value = headers[name];
  return value === undefined ? "" : value;
}

function expectSecurityHeaders(headers: Record<string, string>): void {
  const policy = headerValue(headers, "content-security-policy");
  expect(policy).toContain("'nonce-");
  expect(policy).toContain("'strict-dynamic'");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(headers["strict-transport-security"]).toBeTruthy();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toBeTruthy();
  expect(headers["x-frame-options"]).toBe("DENY");
}

function expectScriptsCarryNonce(html: string, policy: string): void {
  const nonce = nonceFromPolicy(policy);
  expect(nonce).toBeTruthy();
  const scripts = readScripts(html);
  expect(scripts.length).toBeGreaterThan(0);
  for (const script of scripts) {
    expect(nonceFromAttributes(script.attrs)).toBe(nonce);
  }
}

function expectLoginScripts(html: string, policy: string): void {
  const scripts = readScripts(html);
  expect(scripts.length).toBeGreaterThan(0);
  for (const script of scripts) {
    const nonce = nonceFromAttributes(script.attrs);
    if (nonce === null) {
      expect(policy.includes(`sha256-${sha256Base64(script.body)}`)).toBe(true);
    } else {
      expect(policy).toContain(`'nonce-${nonce}'`);
    }
  }
}

async function documentOf(response: APIResponse): Promise<{
  headers: Record<string, string>;
  html: string;
}> {
  return { headers: response.headers(), html: await response.text() };
}

async function openQuietly(page: Page, path: string): Promise<void> {
  await page.goto(path);
  expect(await readCspViolations(page)).toEqual([]);
}

test.describe("E12 security-headers", { tag: ["@E12"] }, () => {
  test("sends CSP headers, unique nonces, and rejects SVG images", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    const admin = await ensureAdmin(request);
    const created = await createJob(admin, {
      _status: "published",
      companyName: "E12zq Example Co",
      origin: "manual",
      title: "E12zq Security Role",
    });
    await admin.dispose();
    const jobPath = `/jobs/${docString(created, "slug")}`;

    const home = await documentOf(await request.get("/"));
    const job = await documentOf(await request.get(jobPath));
    const adminPage = await documentOf(await request.get("/admin"));
    const login = await documentOf(await request.get("/admin/login"));
    expectSecurityHeaders(home.headers);
    expectSecurityHeaders(job.headers);
    expectSecurityHeaders(adminPage.headers);
    expectScriptsCarryNonce(
      home.html,
      headerValue(home.headers, "content-security-policy")
    );
    expectScriptsCarryNonce(
      job.html,
      headerValue(job.headers, "content-security-policy")
    );
    expectLoginScripts(
      login.html,
      headerValue(login.headers, "content-security-policy")
    );

    const again = await request.get("/");
    expect(
      nonceFromPolicy(headerValue(home.headers, "content-security-policy"))
    ).not.toBe(
      nonceFromPolicy(headerValue(again.headers(), "content-security-policy"))
    );

    const messages: string[] = [];
    page.on("console", (message) => {
      messages.push(message.text());
    });
    await installCspProbe(page);
    await openQuietly(page, "/");
    await openQuietly(page, jobPath);
    await openQuietly(page, "/admin/login");
    expect(
      messages.filter((message) => message.includes("Content Security Policy"))
    ).toEqual([]);

    const image = await request.get(
      "/_next/image?url=%2Fmarketing%2Flogos%2Fbordful.svg&w=64&q=75"
    );
    expect(image.status()).toBe(400);
  });
});
