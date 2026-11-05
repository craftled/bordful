import { NextRequest } from "next/server";
import { expect, test } from "vitest";

import { PAYLOAD_MONACO_CDN } from "@/lib/csp/build-csp";

import {
  hasMalformedEncoding,
  hostnameFromHostHeader,
  MALFORMED_PATH_REWRITE,
  proxy,
  shouldRedirectVercelAppHost,
} from "./proxy";

const MALFORMED = [
  "/jobs/%E0%A4%A",
  "/jobs/%ZZ",
  "/companies/%E0%A4%A",
  "/docs/%E0%A4%A",
  "/jobs/page/%E0",
  "/jobs/type/%E0%A4%A",
];

function run(path: string, host = "localhost:3100") {
  return proxy(
    new NextRequest(`http://localhost:3100${path}`, { headers: { host } })
  );
}

function styleSrc(csp: string | null): string {
  return (
    csp?.split("; ").find((directive) => directive.startsWith("style-src ")) ??
    ""
  );
}

function withMarketing(value: "true" | "false", runTest: () => void) {
  const previous = process.env.BORDFUL_MARKETING;
  process.env.BORDFUL_MARKETING = value;
  try {
    runTest();
  } finally {
    if (previous === undefined) {
      delete process.env.BORDFUL_MARKETING;
    } else {
      process.env.BORDFUL_MARKETING = previous;
    }
  }
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

test("bordful.com rewrites /favicon.ico to the Bordful mark", () => {
  withMarketing("true", () => {
    const response = run("/favicon.ico");
    const rewrite = response.headers.get("x-middleware-rewrite");

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(rewrite).not.toBeNull();
    expect(new URL(rewrite ?? "").pathname).toBe("/marketing/icon.svg");
  });
});

test("redirects vercel.app hosts to bordful.com when marketing is on", () => {
  withMarketing("true", () => {
    for (const host of [
      "bordful.vercel.app",
      "bordful-v1.vercel.app",
      "bordful-git-fix-abc123.vercel.app",
      "bordful.vercel.app:443",
    ]) {
      const response = run("/jobs/example-role?q=design", host);
      expect(response.status).toBe(301);
      expect(response.headers.get("location")).toBe(
        "https://bordful.com/jobs/example-role?q=design"
      );
    }
  });
});

test("a fork on vercel.app is not redirected to bordful.com", () => {
  withMarketing("false", () => {
    const response = run("/jobs/example-role?q=design", "myboard.vercel.app");
    expect(response.status).not.toBe(301);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });
});

test("api paths on vercel.app are not redirected when marketing is on", () => {
  withMarketing("true", () => {
    for (const path of ["/api", "/api/cron/bordfeed", "/api/jobs?page=2"]) {
      const response = run(path, "bordful.vercel.app");
      expect(response.status).not.toBe(301);
      expect(response.headers.get("location")).toBeNull();
    }
    // Paths that only look like /api still redirect.
    const response = run("/apiary", "bordful.vercel.app");
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://bordful.com/apiary");
  });
});

test("does not redirect canonical, local, or demo hosts", () => {
  expect(hostnameFromHostHeader(null)).toBeNull();
  expect(hostnameFromHostHeader("")).toBeNull();
  expect(shouldRedirectVercelAppHost(null)).toBe(false);
  expect(shouldRedirectVercelAppHost("")).toBe(false);

  withMarketing("true", () => {
    for (const host of [
      "bordful.com",
      "www.bordful.com",
      "bordful.com:443",
      "localhost",
      "localhost:3100",
      "127.0.0.1",
      "127.0.0.1:3100",
      "[::1]:3100",
      "demo.bordful.com",
    ]) {
      expect(shouldRedirectVercelAppHost(host)).toBe(false);
      const response = run("/jobs?page=2", host);
      expect(response.status).not.toBe(301);
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("location")).toBeNull();
    }
  });
});

test("a fork leaves /favicon.ico alone", () => {
  withMarketing("false", () => {
    const response = run("/favicon.ico");
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
