import { type APIResponse, expect, test } from "@playwright/test";

const MARKDOWN_TYPE = "text/markdown";

function marketingBase(): string {
  if (process.env.E2E_MARKETING_BASE_URL) {
    return process.env.E2E_MARKETING_BASE_URL;
  }
  const port = process.env.APP_MARKETING_PORT ?? "3001";
  return `http://127.0.0.1:${port}`;
}

// The absolute site URL the marketing server was started with, so prompts
// and canonical links can be compared against it.
function siteOrigin(): string {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    return process.env.PLAYWRIGHT_BASE_URL;
  }
  const port = process.env.APP_PORT ?? "3000";
  return `http://127.0.0.1:${port}`;
}

function marketingUrl(path: string): string {
  return new URL(path, marketingBase()).href;
}

const DOC_H1S = [
  "# Deploy",
  "# Configuration",
  "# Customization",
  "# Theming",
  "# Bordfeed",
  "# Post a Job",
  "# Job alerts",
];

// No job posting URL is ever listed in llms.txt.
const JOB_POSTING_URL =
  /\/jobs\/(?!types\.md|levels\.md|locations\.md|languages\.md)[a-z0-9-]+\.md/u;

async function fetchAll(
  request: { get: (url: string, options?: object) => Promise<APIResponse> },
  paths: readonly string[],
  options?: object
): Promise<Record<string, APIResponse>> {
  const responses = await Promise.all(
    paths.map((path) => request.get(marketingUrl(path), options))
  );
  return Object.fromEntries(
    paths.map((path, index) => [path, responses[index] as APIResponse])
  );
}

test.describe("E17 agent docs", { tag: ["@E17"] }, () => {
  // Chromium needs the clipboard grants for the copy test.
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("llms.txt lists the public site and links llms-full.txt", async ({
    request,
  }) => {
    const response = await request.get(marketingUrl("/llms.txt"));
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("text/plain");
    const text = await response.text();

    expect(text).toContain("# Bordful");
    expect(text).toContain("/llms-full.txt");
    expect(text).toContain("/docs.md");
    expect(text).toContain("/docs/deploy.md");
    expect(text).toContain("/pricing.md");
    expect(text).toContain("/companies.md");
    expect(text).toContain("/index.md");
    expect(text).toContain("/jobs/types.md");
    // The home page's markdown URL is /index.md, never /.md.
    expect(text).not.toContain("(/.md)");
    expect(text).not.toMatch(JOB_POSTING_URL);
  });

  test("llms-full.txt carries every docs page in one file", async ({
    request,
  }) => {
    const response = await request.get(marketingUrl("/llms-full.txt"));
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("text/plain");
    const text = await response.text();

    expect(text).toContain("# Bordful docs");
    expect(text).toContain("/docs.md");
    for (const h1 of DOC_H1S) {
      expect(text).toContain(h1);
    }
    // Each page rides behind a Source line.
    expect(text).toContain("Source: ");
  });

  test("the markdown URLs serve markdown with Vary: Accept", async ({
    request,
  }) => {
    const responses = await fetchAll(request, [
      "/docs.md",
      "/docs/deploy.md",
      "/pricing.md",
      "/index.md",
      "/companies.md",
      "/jobs.md",
      "/jobs/types.md",
      "/alternatives/wp-job-manager.md",
    ]);
    const bodies = await Promise.all(
      Object.entries(responses).map(async ([path, response]) => {
        expect(response.ok(), path).toBe(true);
        expect(response.headers()["content-type"], path).toContain(
          MARKDOWN_TYPE
        );
        expect(response.headers().vary, path).toContain("Accept");
        return [path, await response.text()] as const;
      })
    );
    for (const [path, body] of bodies) {
      expect(body.startsWith("# "), path).toBe(true);
      expect(body, path).toContain("/llms.txt");
    }
  });

  test("docs and marketing pages negotiate on Accept", async ({ request }) => {
    const paths = ["/docs/deploy", "/pricing"];
    const markdown = await fetchAll(request, paths, {
      headers: { Accept: "text/markdown" },
    });
    const html = await fetchAll(request, paths);
    const checks = await Promise.all(
      paths.map(async (path) => {
        const mdResponse = markdown[path] as APIResponse;
        const htmlResponse = html[path] as APIResponse;
        return {
          html: await htmlResponse.text(),
          htmlContentType: htmlResponse.headers()["content-type"],
          htmlStatus: htmlResponse.status(),
          csp: htmlResponse.headers()["content-security-policy"],
          htmlVary: htmlResponse.headers().vary,
          md: await mdResponse.text(),
          mdContentType: mdResponse.headers()["content-type"],
          mdStatus: mdResponse.status(),
          path,
        };
      })
    );
    for (const { path, ...check } of checks) {
      expect(check.mdStatus, path).toBe(200);
      expect(check.mdContentType, path).toContain(MARKDOWN_TYPE);
      expect(check.md, path).toContain("# ");

      expect(check.htmlStatus, path).toBe(200);
      expect(check.htmlContentType, path).toContain("text/html");
      // The CSP block travels with the HTML page.
      expect(check.csp, path).toContain("default-src 'self'");
      // The app router owns Vary on HTML responses; it is present and
      // carries the router state tokens (the Accept token rides in the
      // next.config.ts header entry, applied on the Vercel edge).
      expect(check.htmlVary, path).toContain("rsc");
    }
  });

  test("unknown .md URLs 404 in plain text", async ({ request }) => {
    const responses = await fetchAll(request, [
      "/docs/not-a-page.md",
      "/not-a-page.md",
    ]);
    const bodies = await Promise.all(
      Object.entries(responses).map(async ([path, response]) => {
        expect(response.status(), path).toBe(404);
        expect(response.headers()["content-type"], path).toContain(
          "text/plain"
        );
        return [path, await response.text()] as const;
      })
    );
    for (const [path, body] of bodies) {
      expect(body, path).toBe("Not found\n");
    }
  });

  test("docs pages offer the markdown and AI actions", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => errors.push(String(error)));

    await page.goto(marketingUrl("/docs/deploy"));

    const copy = page.getByRole("button", {
      name: "Copy page as Markdown",
    });
    const chatgpt = page.getByRole("link", {
      name: "Open in ChatGPT (opens in a new tab)",
    });
    const claude = page.getByRole("link", {
      name: "Open in Claude (opens in a new tab)",
    });

    // All three controls are visible and keyboard reachable (no tabindex
    // overrides: they sit in the page's natural tab order).
    const controls = [copy, chatgpt, claude];
    const tabindices = await Promise.all(
      controls.map((control) => control.getAttribute("tabindex"))
    );
    expect(tabindices).toEqual([null, null, null]);
    const visible = await Promise.all(
      controls.map(async (control) => control.isVisible())
    );
    expect(visible).toEqual([true, true, true]);

    // They sit inside the aside, in order.
    const aside = page.getByRole("complementary", {
      name: "Use this page with AI",
    });
    await expect(aside.locator("button")).toHaveCount(1);
    await expect(aside.getByRole("link")).toHaveCount(2);

    // The AI prompts point at the page's absolute markdown URL.
    const mdUrl = `${siteOrigin()}/docs/deploy.md`;
    const prompt = `Read ${mdUrl} and help me with questions about it.`;
    const query = new URLSearchParams({ q: prompt }).toString();
    await expect(chatgpt).toHaveAttribute(
      "href",
      `https://chatgpt.com/?hints=search&${query}`
    );
    await expect(claude).toHaveAttribute(
      "href",
      `https://claude.ai/new?${query}`
    );
    const linkAttributes = await Promise.all(
      [chatgpt, claude].map(async (link) => ({
        rel: await link.getAttribute("rel"),
        target: await link.getAttribute("target"),
      }))
    );
    expect(linkAttributes).toEqual([
      { rel: "noopener noreferrer", target: "_blank" },
      { rel: "noopener noreferrer", target: "_blank" },
    ]);

    // Copy works against the real route: the button flips to Copied and
    // the live region announces it.
    await copy.click();
    await expect(copy).toContainText("Copied");
    await expect(page.getByRole("status")).toHaveText(
      "Copied page as Markdown."
    );
    // The markdown body itself landed on the clipboard.
    const clipped = await page.evaluate(() =>
      globalThis.navigator.clipboard.readText()
    );
    expect(clipped).toContain("# Deploy");

    expect(errors).toEqual([]);
  });

  test("the phone layout keeps the actions on their own row", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 812, width: 375 });
    await page.goto(marketingUrl("/docs/deploy"));

    const aside = page.getByRole("complementary", {
      name: "Use this page with AI",
    });
    await expect(aside).toBeVisible();
    // Nothing overflows the viewport.
    const box = await aside.boundingBox();
    expect(box?.x, "aside starts inside the viewport").toBeGreaterThanOrEqual(
      0
    );
    expect(
      (box?.x ?? 0) + (box?.width ?? 0),
      "aside ends inside the viewport"
    ).toBeLessThanOrEqual(375);

    const controls = aside.locator("button, a");
    expect(await controls.count()).toBe(3);
    const boxes = await Promise.all(
      (await controls.all()).map((control) => control.boundingBox())
    );
    for (const [index, controlBox] of boxes.entries()) {
      expect(
        (controlBox?.x ?? 0) + (controlBox?.width ?? 0),
        `control ${index} ends inside the viewport`
      ).toBeLessThanOrEqual(375);
    }
  });
});
