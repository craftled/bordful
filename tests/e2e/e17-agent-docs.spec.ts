import type { APIResponse } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { ensureAdmin } from "./support/admin";
import { createJob, deleteWhere, readGlobal } from "./support/seed";

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

// Deployed-target mode: E2E_MARKETING_BASE_URL points at a real deployment
// instead of the loopback marketing server the Playwright config defaults it
// to. Nothing has been deployed from this branch, so no run in this round
// ever activates it; a later post-deploy run opts in by exporting
// E2E_MARKETING_BASE_URL=<deployment URL>.
function isDeployedTarget(): boolean {
  const explicit = process.env.E2E_MARKETING_BASE_URL;
  if (!explicit) {
    return false;
  }
  try {
    const { hostname } = new URL(explicit);
    return (
      hostname !== "127.0.0.1" &&
      hostname !== "localhost" &&
      hostname !== "::1" &&
      hostname !== "[::1]"
    );
  } catch {
    return false;
  }
}

// The overflow affordance the /jobs markdown emits: "More jobs: <url>".
// The emitted URL is the source of truth for the next page; nothing may
// hard-code /jobs/page/2 instead of reading it from the markdown. Both
// regexes sit at the top level so they are compiled once.
const MORE_JOBS_LINE = /^More jobs: (?<url>\S+)$/mu;
const JOB_DETAIL_PATH = /\/jobs\/(?<slug>[a-z0-9-]+)/gu;

function moreJobsUrl(markdown: string): string | null {
  const match = MORE_JOBS_LINE.exec(markdown);
  return match === null ? null : (match.groups?.url ?? null);
}

// Job detail paths (/jobs/<slug>, never the /jobs indexes or /jobs/page/N)
// found as markdown links or HTML hrefs, so the first-page markdown and a
// followed page can be diffed read-only.
function jobDetailPaths(text: string): Set<string> {
  const nonJob = new Set(["languages", "levels", "locations", "page", "types"]);
  const paths = new Set<string>();
  for (const match of text.matchAll(JOB_DETAIL_PATH)) {
    const slug = match.groups?.slug ?? "";
    if (!nonJob.has(slug)) {
      paths.add(match[0] ?? "");
    }
  }
  return paths;
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
      // Locally the app router owns Vary on HTML responses and overwrites
      // the Vary the proxy set (documented in the PR body), so only its
      // router state tokens can be asserted: the Accept token for final HTML
      // comes from the next.config.ts headers entry, which the local server
      // does not apply after the router either. On a deployed target
      // (isDeployedTarget: a post-deploy run passing the deployment URL
      // through E2E_MARKETING_BASE_URL) the edge is expected to apply that
      // entry to the final HTML, so the Accept token is asserted there.
      // Nothing has been deployed from this branch, so that mode never ran
      // in this round, and the post-deploy curl -sI release gate in the PR
      // body stays regardless of it.
      if (isDeployedTarget()) {
        expect(check.htmlVary, path).toContain("Accept");
      } else {
        expect(check.htmlVary, path).toContain("rsc");
      }
    }
  });

  test("the jobs markdown overflow link reaches the omitted jobs as HTML", async ({
    request,
  }) => {
    test.setTimeout(120_000);
    const SEED_MARK = "E17zq";

    if (isDeployedTarget()) {
      // Read-only pass over a deployed target: a remote board is never
      // seeded or mutated from here. If it currently overflows its first
      // markdown page, the emitted link must lead to a 200 HTML page
      // holding job rows the first page omitted; if it does not overflow,
      // the markdown must not claim it does.
      const response = await request.get(marketingUrl("/jobs.md"), {
        headers: { Accept: MARKDOWN_TYPE },
      });
      expect(response.ok()).toBe(true);
      const markdown = await response.text();
      const moreUrl = moreJobsUrl(markdown);
      if (moreUrl === null) {
        expect(markdown).not.toContain("More jobs:");
        return;
      }
      const page = await request.get(moreUrl, {
        headers: { Accept: MARKDOWN_TYPE },
      });
      expect(page.status(), "the overflow link is never a 404").toBe(200);
      expect(page.headers()["content-type"]).toContain("text/html");
      const html = await page.text();
      expect(
        html.startsWith("# "),
        "the followed page stays HTML, never markdown"
      ).toBe(false);
      const listed = jobDetailPaths(markdown);
      const omitted = [...jobDetailPaths(html)].filter(
        (jobPath) => !listed.has(jobPath)
      );
      expect(
        omitted.length,
        "the followed page holds rows the first page omitted"
      ).toBeGreaterThan(0);
      return;
    }

    // Local isolated test database: seed past the board's jobs-per-page
    // setting (read from the settings global, never hard-coded, never
    // lowered), so the first markdown page must overflow. Seed through the
    // marketing server: /jobs.md is read there, and a write through the fork
    // server would only revalidate the fork server's cached job list.
    const admin = await ensureAdmin(request, marketingBase());
    try {
      const settings = await readGlobal(admin, "site-settings");
      const { board } = settings;
      const rawPerPage =
        board !== null && typeof board === "object"
          ? (board as Record<string, unknown>).jobsPerPage
          : undefined;
      if (
        typeof rawPerPage !== "number" ||
        !Number.isInteger(rawPerPage) ||
        rawPerPage < 1
      ) {
        throw new Error(`unexpected jobsPerPage: ${String(rawPerPage)}`);
      }
      const titles = Array.from(
        { length: rawPerPage + 2 },
        (_, index) => `${SEED_MARK} Overflow ${index + 1}`
      );
      // Seed one job at a time, not with Promise.all: each create runs in
      // its own transaction and the server's Postgres pool is small, so a
      // large burst of concurrent creates can deadlock the pool (each
      // request holds a connection while waiting for another). e02's
      // smaller burst stays as it is; this seed is past jobsPerPage and
      // must never depend on winning that race.
      for (const title of titles) {
        // biome-ignore lint/performance/noAwaitInLoops: one create transaction at a time keeps the small Postgres pool intact; a burst of concurrent creates can deadlock it
        await createJob(admin, {
          _status: "published",
          companyName: "E17zq Overflow Co",
          employmentType: "full-time",
          origin: "manual",
          title,
          workplaceType: "remote",
        });
      }

      const response = await request.get(marketingUrl("/jobs.md"), {
        headers: { Accept: MARKDOWN_TYPE },
      });
      expect(response.ok()).toBe(true);
      const markdown = await response.text();
      const moreUrl = moreJobsUrl(markdown);
      if (moreUrl === null) {
        throw new Error("the seeded overflow must emit the More jobs link");
      }
      // The omitted jobs are exactly the seeded rows the first page cut.
      const omittedTitles = titles.filter(
        (title) => !markdown.includes(`[${title}]`)
      );
      expect(
        omittedTitles.length,
        "seeded jobs spill past the first markdown page"
      ).toBeGreaterThanOrEqual(2);

      // Follow the emitted affordance itself, never a hard-coded page URL.
      // It is absolute on the configured site origin, which the e2e config
      // gives both servers. Locally that origin is the fork server, whose
      // cached job list never saw the jobs seeded through the marketing
      // server, so follow the path on the server that emitted it.
      expect(moreUrl.startsWith(`${siteOrigin()}/`), moreUrl).toBe(true);
      const page = await request.get(marketingUrl(new URL(moreUrl).pathname), {
        headers: { Accept: MARKDOWN_TYPE },
      });
      expect(page.status(), "the overflow link is never a 404").toBe(200);
      expect(page.headers()["content-type"]).toContain("text/html");
      const html = await page.text();
      expect(
        html.startsWith("# "),
        "the followed page stays HTML, never markdown"
      ).toBe(false);
      const [firstOmitted] = omittedTitles;
      if (firstOmitted === undefined) {
        throw new Error("no omitted seeded job to look for");
      }
      expect(
        html,
        "the followed page shows a job the first page omitted"
      ).toContain(firstOmitted);
    } finally {
      // Like the other flows, clean the seeded rows up so reruns and the
      // rest of the suite see a clean board.
      await deleteWhere(admin, "jobs", `where[title][like]=${SEED_MARK}`);
      await admin.dispose();
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
        // The markdown routes' 404s are negotiated responses too, so the
        // final response still declares Vary: Accept (see route tests).
        expect(response.headers().vary, path).toContain("Accept");
        return [path, await response.text()] as const;
      })
    );
    for (const [path, body] of bodies) {
      expect(body, path).toBe("Not found\n");
    }
  });

  test("malformed .md URLs get the HTML 404, never a markdown rewrite", async ({
    request,
  }) => {
    // A broken percent escape before .md used to be rewritten into
    // /pages-md/<path>, where the dynamic segment 500s. The malformed-path
    // rewrite must win: the regular 404 page, with the CSP block.
    const response = await request.get(marketingUrl("/jobs/%ZZ.md"));
    expect(response.status()).toBe(404);
    expect(response.headers()["content-type"]).toContain("text/html");
    expect(response.headers()["content-security-policy"]).toContain(
      "default-src 'self'"
    );
    const body = await response.text();
    expect(body).not.toContain("Not found\n");
    expect(body).not.toContain("pages-md");
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
      name: "Copy as Markdown",
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
    // the live region announces it. The copy locator cannot be reused for
    // the flip: the accessible name follows the visible text now, so it is
    // "Copied" while the check mark shows (the original locator would stop
    // matching) and flips back after the reset.
    await copy.click();
    await expect(
      page.getByRole("button", { name: "Copied", exact: true })
    ).toBeVisible();
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
