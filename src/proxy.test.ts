import { NextRequest } from "next/server";
import { expect, test } from "vitest";

import { PAYLOAD_MONACO_CDN } from "@/lib/csp/build-csp";

import {
  acceptsMarkdown,
  docsMarkdownRewrite,
  hasMalformedEncoding,
  hostnameFromHostHeader,
  isInternalDocsMarkdownPath,
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

const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

function run(path: string, host = "localhost:3100", headers = {}) {
  return proxy(
    new NextRequest(`http://localhost:3100${path}`, {
      headers: { host, ...headers },
    })
  );
}

function rewritePath(response: Response): string | null {
  const rewrite = response.headers.get("x-middleware-rewrite");
  return rewrite === null ? null : new URL(rewrite).pathname;
}

function styleSrc(csp: string | null): string {
  return (
    csp?.split("; ").find((directive) => directive.startsWith("style-src ")) ??
    ""
  );
}

function imgSrc(csp: string | null): string {
  return (
    csp?.split("; ").find((directive) => directive.startsWith("img-src ")) ?? ""
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

test("only marketing CSP allows Top Boilerplates badge images", () => {
  withMarketing("true", () => {
    expect(imgSrc(run("/").headers.get("Content-Security-Policy"))).toBe(
      "img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com https://img.logo.dev https://topboilerplates.com"
    );
  });

  withMarketing("false", () => {
    expect(imgSrc(run("/").headers.get("Content-Security-Policy"))).toBe(
      "img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com https://img.logo.dev"
    );
  });
});

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

test("acceptsMarkdown parses media ranges and q values", () => {
  expect(acceptsMarkdown(null)).toBe(false);
  expect(acceptsMarkdown(BROWSER_ACCEPT)).toBe(false);
  expect(acceptsMarkdown("*/*")).toBe(false);
  expect(acceptsMarkdown("text/markdown")).toBe(true);
  expect(acceptsMarkdown("text/markdown, text/html;q=0.9")).toBe(true);
  expect(acceptsMarkdown("text/markdown;q=0.5")).toBe(true);
  expect(acceptsMarkdown("text/html, text/markdown;q=0")).toBe(false);
  expect(acceptsMarkdown("text/plain;q=1, text/markdown;q=0.001")).toBe(true);
});

test("docsMarkdownRewrite maps public docs URLs to the internal route", () => {
  expect(docsMarkdownRewrite("/docs.md", null)).toBe("/docs-md");
  expect(docsMarkdownRewrite("/docs/deploy.md", null)).toBe("/docs-md/deploy");
  expect(docsMarkdownRewrite("/docs/nope.md", null)).toBe("/docs-md/nope");
  expect(docsMarkdownRewrite("/docs", "text/markdown")).toBe("/docs-md");
  expect(docsMarkdownRewrite("/docs/deploy", "text/markdown")).toBe(
    "/docs-md/deploy"
  );
  expect(docsMarkdownRewrite("/docs", BROWSER_ACCEPT)).toBeNull();
  expect(docsMarkdownRewrite("/docs/deploy", BROWSER_ACCEPT)).toBeNull();
  expect(docsMarkdownRewrite("/docs/Deploy.md", null)).toBeNull();
  expect(docsMarkdownRewrite("/docs/a/b.md", null)).toBeNull();
  expect(docsMarkdownRewrite("/docs-md/deploy", "text/markdown")).toBeNull();
});

test("isInternalDocsMarkdownPath matches only the internal route", () => {
  expect(isInternalDocsMarkdownPath("/docs-md")).toBe(true);
  expect(isInternalDocsMarkdownPath("/docs-md/deploy")).toBe(true);
  expect(isInternalDocsMarkdownPath("/docs-md/")).toBe(true);
  expect(isInternalDocsMarkdownPath("/docs")).toBe(false);
  expect(isInternalDocsMarkdownPath("/docs/deploy.md")).toBe(false);
  expect(isInternalDocsMarkdownPath("/docsmd")).toBe(false);
});

test("rewrites markdown URLs to the internal route when marketing is on", () => {
  withMarketing("true", () => {
    for (const [path, expected] of [
      ["/docs.md", "/docs-md"],
      ["/docs/deploy.md", "/docs-md/deploy"],
      ["/docs/nope.md", "/docs-md/nope"],
    ] as const) {
      expect(rewritePath(run(path))).toBe(expected);
    }
    for (const path of ["/docs", "/docs/deploy"]) {
      expect(
        rewritePath(run(path, "localhost:3100", { accept: "text/markdown" }))
      ).toBe(path === "/docs" ? "/docs-md" : "/docs-md/deploy");
    }
  });
});

test("browser Accept on docs pages passes through with the CSP", () => {
  withMarketing("true", () => {
    for (const path of ["/docs", "/docs/deploy"]) {
      const response = run(path, "localhost:3100", {
        accept: BROWSER_ACCEPT,
      });
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("Content-Security-Policy")).toContain(
        "default-src 'self'"
      );
    }
  });
});

test("rsc-bearing client navigations are never rewritten", () => {
  withMarketing("true", () => {
    const response = run("/docs", "localhost:3100", {
      accept: "text/markdown",
      rsc: "1",
    });
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

test("blocks direct hits on the internal route", () => {
  for (const value of ["true", "false"] as const) {
    withMarketing(value, () => {
      for (const path of ["/docs-md", "/docs-md/deploy"]) {
        const response = run(path);
        expect(rewritePath(response)).toBe(MALFORMED_PATH_REWRITE);
        expect(response.headers.get("Content-Security-Policy")).toContain(
          "default-src 'self'"
        );
      }
    });
  }
});

test("a fork never rewrites markdown URLs", () => {
  withMarketing("false", () => {
    for (const path of ["/docs/deploy.md", "/docs.md"]) {
      expect(rewritePath(run(path))).toBeNull();
      expect(run(path).headers.get("x-middleware-next")).toBe("1");
    }
    const response = run("/docs", "localhost:3100", {
      accept: "text/markdown",
    });
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
