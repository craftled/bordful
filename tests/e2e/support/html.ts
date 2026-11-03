import { createHash } from "node:crypto";

import type { Page } from "@playwright/test";

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const NONCE_VALUE = /(?:^|\s)nonce\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i;
const POLICY_NONCE = /'nonce-([^']+)'/;

export interface HtmlScript {
  attrs: string;
  body: string;
}

export function readScripts(html: string): HtmlScript[] {
  const pattern = new RegExp(SCRIPT_TAG.source, "gi");
  const scripts: HtmlScript[] = [];
  for (const match of html.matchAll(pattern)) {
    scripts.push({ attrs: match[1] ?? "", body: match[2] ?? "" });
  }
  return scripts;
}

export function nonceFromAttributes(attrs: string): string | null {
  const match = NONCE_VALUE.exec(attrs);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

export function sha256Base64(body: string): string {
  return createHash("sha256").update(body).digest("base64");
}

export function nonceFromPolicy(policy: string): string | null {
  const match = POLICY_NONCE.exec(policy);
  return match?.[1] ?? null;
}

export async function installCspProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const record = window as Window & { __cspViolations?: string[] };
    record.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      record.__cspViolations?.push(event.violatedDirective);
    });
  });
}

export function readCspViolations(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      (window as Window & { __cspViolations?: string[] }).__cspViolations ?? []
  );
}
