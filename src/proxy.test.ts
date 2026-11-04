import { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";

import { PAYLOAD_MONACO_CDN } from "@/lib/csp/build-csp";

import { hasMalformedEncoding, MALFORMED_PATH_REWRITE, proxy } from "./proxy";

const MALFORMED = [
  "/jobs/%E0%A4%A",
  "/jobs/%ZZ",
  "/companies/%E0%A4%A",
  "/docs/%E0%A4%A",
  "/jobs/page/%E0",
  "/jobs/type/%E0%A4%A",
];

function run(path: string) {
  return proxy(new NextRequest(`http://localhost:3100${path}`));
}

function styleSrc(csp: string | null): string {
  return (
    csp?.split("; ").find((directive) => directive.startsWith("style-src ")) ??
    ""
  );
}

test("detects paths with a broken percent escape", () => {
  for (const path of MALFORMED) {
    expect(hasMalformedEncoding(path)).toBe(true);
  }
  expect(hasMalformedEncoding("/jobs/caf%C3%A9")).toBe(false);
  expect(hasMalformedEncoding("/jobs/example-role")).toBe(false);
});

test("rewrites a malformed path to the not-found page with the CSP", () => {
  for (const path of MALFORMED) {
    const response = run(path);
    const rewrite = response.headers.get("x-middleware-rewrite");

    expect(rewrite).not.toBeNull();
    expect(new URL(rewrite ?? "").pathname).toBe(MALFORMED_PATH_REWRITE);
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "default-src 'self'"
    );
  }
});

test("passes a well-formed path through untouched", () => {
  const response = run("/jobs/example-role");

  expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  expect(response.headers.get("x-middleware-next")).toBe("1");
});

test("only admin pages allow the code editor stylesheet", () => {
  for (const path of ["/admin", "/admin/globals/bordfeed-connection"]) {
    expect(
      styleSrc(run(path).headers.get("Content-Security-Policy"))
    ).toContain(PAYLOAD_MONACO_CDN);
  }
  for (const path of ["/", "/jobs", "/administrator", "/api/jobs"]) {
    expect(styleSrc(run(path).headers.get("Content-Security-Policy"))).toBe(
      "style-src 'self' 'unsafe-inline'"
    );
  }
});

test("bordful.com sends /favicon.ico to the Bordful mark", () => {
  vi.stubEnv("BORDFUL_MARKETING", "true");
  try {
    const response = run("/favicon.ico");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3100/marketing/icon.svg"
    );
  } finally {
    vi.unstubAllEnvs();
  }
});

test("a fork leaves /favicon.ico alone", () => {
  vi.stubEnv("BORDFUL_MARKETING", "false");
  try {
    const response = run("/favicon.ico");
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  } finally {
    vi.unstubAllEnvs();
  }
});
