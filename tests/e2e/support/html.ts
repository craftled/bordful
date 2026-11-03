import { createHash } from "node:crypto";

import type { Page } from "@playwright/test";

const SCRIPT_TAG = /<script\b(?<attrs>[^>]*)>(?<body>[\s\S]*?)<\/script>/giu;
const NONCE_VALUE =
  /(?:^|\s)nonce\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)'|(?<bare>[^\s"'>]+))/iu;
const POLICY_NONCE = /'nonce-(?<nonce>[^']+)'/u;

export interface HtmlScript {
  attrs: string;
  body: string;
}

export function readScripts(html: string): HtmlScript[] {
  const pattern = new RegExp(SCRIPT_TAG.source, "giu");
  const scripts: HtmlScript[] = [];
  for (const match of html.matchAll(pattern)) {
    scripts.push({
      attrs: match.groups?.attrs ?? "",
      body: match.groups?.body ?? "",
    });
  }
  return scripts;
}

export function nonceFromAttributes(attrs: string): string | null {
  const match = NONCE_VALUE.exec(attrs);
  return (
    match?.groups?.double ??
    match?.groups?.single ??
    match?.groups?.bare ??
    null
  );
}

export function sha256Base64(body: string): string {
  return createHash("sha256").update(body).digest("base64");
}

export function nonceFromPolicy(policy: string): string | null {
  const match = POLICY_NONCE.exec(policy);
  return match?.groups?.nonce ?? null;
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
