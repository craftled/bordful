import { expect, test, vi } from "vitest";

import { AGENT_PAGE_PATHS, markdownPathFor } from "@/lib/docs/agent-docs-paths";
import { pageMarkdown } from "@/lib/docs/agent-pages";

// The board builders call the read layer; unit tests never open the
// database, so the two functions the board paths need are fixtures here.
vi.mock("@/lib/read", () => ({
  getSiteSettings: vi.fn(async () => ({
    alerts: {
      enabled: false,
      defaultFrequency: "weekly",
      fromName: "Test",
      fromEmail: null,
    },
    board: {
      title: "Test board",
      description: "A board for tests.",
      jobsPerPage: 20,
      publicDetailFields: [],
    },
    logoUrl: null,
    name: "Test",
    postJob: {
      enabled: false,
      paymentLinkUrl: "https://example.com/pay",
      priceLabel: "$10",
      durationDays: 30,
    },
    showcase: { listMyBoard: false },
    tagline: "Tag",
    theme: {},
  })),
  listPublishedJobs: vi.fn(async ({ limit }: { limit: number }) => ({
    items: FIXTURE_JOBS.slice(0, limit),
    total: FIXTURE_JOBS.length,
    totalPages: 1,
  })),
}));

const FIXTURE_JOBS = [
  {
    applyHref: null,
    careerLevel: ["Senior"],
    categories: ["Engineering"],
    companyLogoUrl: null,
    companyName: "Example Co",
    companySlug: "example-co",
    countryCode: "US",
    employmentType: "full-time",
    featured: false,
    id: "1",
    indexable: true,
    languages: ["en"],
    locationDisplay: "New York, NY",
    origin: "bordfeed",
    publishedAt: "2026-11-01T00:00:00.000Z",
    remoteRegion: null,
    salaryCurrency: "USD",
    salaryMax: 190_000,
    salaryMaxUsd: 190_000,
    salaryMin: 150_000,
    salaryMinUsd: 150_000,
    seniority: "senior",
    slug: "senior-designer-example-co",
    title: "Senior Product Designer",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: "onsite",
  },
] as const;

const LEADING_SLASH = /^\//u;
const siteUrl = "http://localhost:3000";
const BOARD_PATHS = ["/jobs", "/companies", "/jobs/types", "/jobs/levels"];

function toPathParams(path: string): { path: string[] } {
  return {
    path: path === "/" ? ["index"] : path.replace(LEADING_SLASH, "").split("/"),
  };
}

async function get(path: string, marketing = "true") {
  vi.stubEnv("BORDFUL_MARKETING", marketing);
  vi.stubEnv("NEXT_PUBLIC_SERVER_URL", siteUrl);
  const { GET } = await import("./route");
  return GET(new Request(`${siteUrl}${markdownPathFor(path)}`), {
    params: Promise.resolve(toPathParams(path)),
  });
}

test("serves every static agent page as markdown", async () => {
  const paths = AGENT_PAGE_PATHS.filter(
    (path) => !(BOARD_PATHS.includes(path) || path.startsWith("/jobs/"))
  );
  const responses = await Promise.all(
    paths.map(async (path) => ({
      body: await (await get(path)).text(),
      headers: (await get(path)).headers,
      path,
      status: (await get(path)).status,
    }))
  );
  for (const { body, headers, path, status } of responses) {
    expect(status, path).toBe(200);
    expect(headers.get("content-type"), path).toBe(
      "text/markdown; charset=utf-8"
    );
    expect(headers.get("vary"), path).toContain("Accept");
    expect(headers.get("content-disposition"), path).toBe("inline");
    expect(headers.get("link"), path).toBe(
      `<${siteUrl}${path}>; rel="canonical"`
    );
    expect(headers.get("cache-control"), path).toBe(
      "public, max-age=0, must-revalidate"
    );
    expect(body, path).toBe(pageMarkdown(path, siteUrl));
  }
});

test("serves the board index pages dynamically", async () => {
  const responses = await Promise.all(
    BOARD_PATHS.map(async (path) => ({
      body: await (await get(path)).text(),
      cacheControl: (await get(path)).headers.get("cache-control"),
      contentType: (await get(path)).headers.get("content-type"),
      status: (await get(path)).status,
      vary: (await get(path)).headers.get("vary"),
    }))
  );
  for (const [index, entry] of responses.entries()) {
    const path = BOARD_PATHS[index] as string;
    expect(entry.status, path).toBe(200);
    expect(entry.contentType, path).toBe("text/markdown; charset=utf-8");
    expect(entry.vary ?? "").toContain("Accept");
    expect(entry.cacheControl, path).toBe(
      "private, no-cache, no-store, max-age=0, must-revalidate"
    );
    expect(entry.body.startsWith("# "), path).toBe(true);
    expect(entry.body, path).toContain(
      "> For the complete documentation index, see [llms.txt]("
    );
  }
});

test("unknown and traversal paths 404 in plain text", async () => {
  const responses = await Promise.all(
    ["/nope", "/pricing/extra", "/jobs/some-role"].map(async (path) => {
      const response = await get(path);
      return {
        body: await response.text(),
        contentType: response.headers.get("content-type"),
        status: response.status,
        vary: response.headers.get("vary"),
      };
    })
  );
  for (const response of responses) {
    expect(response.status).toBe(404);
    expect(response.contentType).toBe("text/plain; charset=utf-8");
    expect(response.vary).toContain("Accept");
    expect(response.body).toBe("Not found\n");
  }
});

test("404s in plain text when marketing is off", async () => {
  const response = await get("/pricing", "false");
  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "text/plain; charset=utf-8"
  );
  expect(await response.text()).toBe("Not found\n");
});

test("every agent markdown route renders per request", async () => {
  // A build-time render froze the marketing gate to the build's env, so one
  // build served to a marketing and a fork server answered both the same way.
  const routes = await Promise.all([
    import("./route"),
    import("@/app/docs-md/[[...slug]]/route"),
    import("@/app/llms.txt/route"),
    import("@/app/llms-full.txt/route"),
  ]);
  for (const route of routes) {
    expect(route.dynamic).toBe("force-dynamic");
    expect("generateStaticParams" in route).toBe(false);
  }
});
