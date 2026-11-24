import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { heroStats } from "@/components/board/board-hero";
import { listStats } from "@/components/board/board-listing";
import { resultsLabel } from "@/components/board/board-toolbar";
import { COMPANY_PAGE_SIZE } from "@/lib/board/constants";
import { filterBoard } from "@/lib/board/filter";
import { formatLocation, formatSalary } from "@/lib/board/format";
import { buildBoardPagePath, buildJobPath } from "@/lib/board/paths";
import { parseBoardQuery } from "@/lib/board/query";
import { buildBoardView } from "@/lib/board/view";
import type { JobListItem } from "@/lib/read/types";

import {
  BOARD_PAGE_CACHE_CONTROL,
  boardPageMarkdown,
} from "./agent-board-pages";
import { AGENT_PAGE_PATHS } from "./agent-docs-paths";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const siteUrl = "http://localhost:3000";

const { pool, settingsMock } = vi.hoisted(() => ({
  // The board pool the mocked listPublishedJobs serves. Tests swap the
  // contents through setPool (empty, over-limit, adversarial fixtures).
  pool: [] as unknown[],
  settingsMock: vi.fn(),
}));

vi.mock("@/lib/read", () => ({
  getSiteSettings: settingsMock,
  listPublishedJobs: vi.fn(async () => ({
    items: [...pool] as JobListItem[],
    total: pool.length,
    totalPages: 1,
  })),
}));

function setPool(jobs: readonly JobListItem[]): void {
  pool.length = 0;
  pool.push(...jobs);
}

const now = Date.parse("2026-11-20T12:00:00.000Z");

function job(overrides: Partial<JobListItem>): JobListItem {
  return {
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
    publishedAt: "2026-11-15T00:00:00.000Z",
    remoteRegion: null,
    salaryCurrency: "USD",
    salaryMax: 190_000,
    salaryMaxUsd: 190_000,
    salaryMin: 150_000,
    salaryMinUsd: 150_000,
    seniority: "senior",
    slug: "example-job",
    title: "Senior Example Role",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: "onsite",
    ...overrides,
  };
}

const FIXTURE_JOBS: JobListItem[] = [
  job({ id: "1", slug: "senior-designer", title: "Senior Product Designer" }),
  job({
    id: "2",
    slug: "lead-engineer",
    title: "Lead Engineer",
    companyName: "Other Co",
    companySlug: "other-co",
    employmentType: "contract",
    workplaceType: "remote",
    locationDisplay: null,
  }),
  job({
    id: "3",
    slug: "ops-manager",
    title: "Operations Manager",
    companyName: "Other Co",
    companySlug: "other-co",
    workplaceType: "remote",
    locationDisplay: null,
  }),
];

beforeEach(() => {
  setPool(FIXTURE_JOBS);
});

function stubBoard(
  settings?: Partial<{
    alertsEnabled: boolean;
    jobsPerPage: number;
    postJobEnabled: boolean;
    title: string;
    description: string;
  }>
) {
  settingsMock.mockImplementation(async () => ({
    alerts: {
      enabled: settings?.alertsEnabled ?? false,
      defaultFrequency: "weekly",
      fromName: "Test",
      fromEmail: null,
    },
    board: {
      title: settings?.title ?? "Test board",
      description: settings?.description ?? "A board for tests.",
      jobsPerPage: settings?.jobsPerPage ?? 20,
      publicDetailFields: [],
    },
    logoUrl: null,
    name: "Test",
    postJob: {
      enabled: settings?.postJobEnabled ?? false,
      paymentLinkUrl: "https://example.com/pay",
      priceLabel: "$10",
      durationDays: 30,
    },
    showcase: { listMyBoard: false },
    tagline: "Tag",
    theme: {},
  }));
}

test("the board pages use the HTML cache policy", () => {
  expect(BOARD_PAGE_CACHE_CONTROL).toBe(
    "private, no-cache, no-store, max-age=0, must-revalidate"
  );
});

test("the jobs markdown mirrors the board the HTML renders", async () => {
  stubBoard({ alertsEnabled: true });
  vi.setSystemTime(now);
  const markdown = (await boardPageMarkdown("/jobs", siteUrl)) ?? "";

  // The same title, lede, count line and job bullets the page shows.
  expect(markdown.startsWith("# Test board\n")).toBe(true);
  expect(markdown).toContain("A board for tests.");
  const query = parseBoardQuery(new URLSearchParams(""), {
    defaultPerPage: 20,
  });
  const view = buildBoardView(FIXTURE_JOBS, query, now);
  expect(markdown).toContain(
    resultsLabel(view.matchCount, heroStats(FIXTURE_JOBS, now).lastUpdated)
  );
  for (const jobItem of view.docs) {
    expect(markdown).toContain(
      `[${jobItem.title}](${siteUrl}${buildJobPath(jobItem.slug)})`
    );
  }

  // The alert card line, from the same filtered pool the rail reads.
  const stats = listStats(filterBoard(FIXTURE_JOBS, query), now);
  expect(markdown).toContain(
    `${stats.total === 1 ? "1 role" : `${stats.total} roles`}. Get new matches in your inbox.`
  );
  expect(markdown).toContain(`${siteUrl}/alerts`);

  // The rail card and shortcuts the board renders above the list.
  expect(markdown).toContain("Pick a role to see the details.");
  expect(markdown).toContain("open the selected role");
});

test("the jobs markdown lists the same page the HTML does", async () => {
  stubBoard();
  const markdown = (await boardPageMarkdown("/jobs", siteUrl)) ?? "";
  // One bullet per job on the first page, in view order.
  const view = buildBoardView(
    FIXTURE_JOBS,
    parseBoardQuery(new URLSearchParams(""), { defaultPerPage: 20 }),
    now
  );
  for (const [index, jobItem] of view.docs.entries()) {
    expect(markdown).toContain(
      `[${jobItem.title}](${siteUrl}${buildJobPath(jobItem.slug)}) ${
        jobItem.companyName
      } · ${formatLocation(jobItem)}`
    );
    expect(markdown.indexOf(`[${jobItem.title}]`)).toBeGreaterThan(-1);
    expect(index).toBeLessThan(20);
  }
});

test("the companies markdown mirrors the directory", async () => {
  stubBoard();
  const markdown = (await boardPageMarkdown("/companies", siteUrl)) ?? "";
  expect(markdown.startsWith("# Companies hiring\n")).toBe(true);
  expect(markdown).toContain("2 companies, 3 open roles.");
  // The directory orders companies by name.
  expect(markdown).toContain(`[Example Co](${siteUrl}/companies/example-co)`);
  expect(markdown).toContain(`[Other Co](${siteUrl}/companies/other-co)`);
  expect(markdown.indexOf("Example Co")).toBeLessThan(
    markdown.indexOf("Other Co")
  );
  expect(markdown).toContain("1 open role");
  expect(markdown).toContain("2 open roles");
  // Two companies fit inside COMPANY_PAGE_SIZE, so there is no more-pages link.
  expect(markdown).not.toContain("More companies");
});

test("the taxonomy markdown mirrors the index", async () => {
  stubBoard();
  const markdown = (await boardPageMarkdown("/jobs/types", siteUrl)) ?? "";
  expect(markdown.startsWith("# Jobs by type\n")).toBe(true);
  expect(markdown).toContain("3 open roles in 2 contract types.");
  expect(markdown).toContain(
    `[Full-time](${siteUrl}/jobs/type/full-time) 2 roles`
  );
  expect(markdown).toContain(
    `[Contract](${siteUrl}/jobs/type/contract) 1 role`
  );
  // Both are remote, so the workplace list shows one row.
  expect(markdown).toContain(
    "[Remote](http://localhost:3000/jobs/location/remote) 2"
  );

  const levels = (await boardPageMarkdown("/jobs/levels", siteUrl)) ?? "";
  expect(levels.startsWith("# Jobs by level\n")).toBe(true);
  expect(levels).toContain("3 open roles in 1 level.");
  expect(levels).toContain(`[Senior](${siteUrl}/jobs/level/senior) 3 roles`);
});

test("unknown paths return null", async () => {
  stubBoard();
  expect(await boardPageMarkdown("/nonexistent", siteUrl)).toBeNull();
  expect(await boardPageMarkdown("/jobs/some-role", siteUrl)).toBeNull();
  expect(await boardPageMarkdown("/companies/acme", siteUrl)).toBeNull();
  // /jobs/some-role.md has a salary format only in the fixture shape.
  expect(formatSalary(FIXTURE_JOBS[0] as JobListItem)).toContain("$");
});

test("the jobs markdown falls back to the default title like the HTML", async () => {
  stubBoard({ title: "", description: "" });
  setPool([]);
  vi.setSystemTime(now);
  const markdown = (await boardPageMarkdown("/jobs", siteUrl)) ?? "";
  expect(markdown.startsWith("# Latest jobs\n")).toBe(true);
  // No empty description paragraph between the directive and the stats.
  expect(markdown).not.toContain("\n\n\n");
});

test("the jobs markdown keeps the empty state honest", async () => {
  stubBoard();
  setPool([]);
  vi.setSystemTime(now);
  const markdown = (await boardPageMarkdown("/jobs", siteUrl)) ?? "";
  expect(markdown.startsWith("# Test board\n")).toBe(true);
  // The same empty copy the board renders, and no list chrome.
  expect(markdown).toContain("No matching jobs");
  expect(markdown).toContain("0 results");
  expect(markdown).not.toContain("Pick a role to see the details.");
  expect(markdown).not.toContain("More jobs");
});

test("the jobs markdown lists one page and links the HTML for the rest", async () => {
  // Three jobs, one per page: the same first page the HTML serves.
  stubBoard({ jobsPerPage: 1 });
  vi.setSystemTime(now);
  const markdown = (await boardPageMarkdown("/jobs", siteUrl)) ?? "";
  const query = parseBoardQuery(new URLSearchParams(""), {
    defaultPerPage: 1,
  });
  const view = buildBoardView(FIXTURE_JOBS, query, now);
  expect(view.totalPages).toBe(3);
  const first = view.docs[0] as JobListItem;
  expect(markdown).toContain(
    `[${first.title}](${siteUrl}${buildJobPath(first.slug)})`
  );
  // The jobs the first page omits are exactly the fixtures the view cut:
  // slice(1) on a one-job page would be empty and prove nothing.
  const omitted = FIXTURE_JOBS.filter(
    (jobItem) => !view.docs.includes(jobItem)
  );
  expect(omitted.length).toBe(2);
  for (const jobItem of omitted) {
    expect(markdown).not.toContain(`[${jobItem.title}]`);
  }
  // The more link targets the next HTML page, never /jobs itself: an agent
  // re-requesting /jobs with Accept: text/markdown would get this same
  // truncated page again. /jobs/page/2 is not a negotiated path, so it is
  // served as HTML even for markdown Accept (e17 checks this over HTTP).
  const moreUrl = `${siteUrl}${buildBoardPagePath(true, 2)}`;
  expect(moreUrl).toBe(`${siteUrl}/jobs/page/2`);
  expect(AGENT_PAGE_PATHS).not.toContain("/jobs/page/2");
  expect(markdown).toContain(`More jobs: ${moreUrl}`);
  expect(markdown).not.toContain(`More jobs: ${siteUrl}/jobs\n`);
  // Following the affordance reaches the omitted rows: the HTML route for
  // /jobs/page/2 (and on) renders the same view code with the later pages
  // of the same query, and those pages hold exactly the omitted fixtures.
  const following: JobListItem[] = [];
  for (let page = 2; page <= view.totalPages; page += 1) {
    following.push(
      ...buildBoardView(FIXTURE_JOBS, { ...query, page }, now).docs
    );
  }
  expect(following.map((jobItem) => jobItem.title).sort()).toEqual(
    omitted.map((jobItem) => jobItem.title).sort()
  );
});

test("the companies markdown keeps the empty state honest", async () => {
  stubBoard();
  setPool([]);
  const markdown = (await boardPageMarkdown("/companies", siteUrl)) ?? "";
  expect(markdown.startsWith("# Companies hiring\n")).toBe(true);
  // The same empty copy the HTML page renders.
  expect(markdown).toContain("No companies with open jobs.");
  expect(markdown).toContain("0 companies, 0 open roles.");
  expect(markdown).not.toContain("More companies");
});

test("the companies markdown lists every company, past the HTML page size", async () => {
  stubBoard();
  // One more company than COMPANY_PAGE_SIZE: the HTML directory folds the
  // last card behind a client-side "Show all" button a non-JavaScript agent
  // cannot press, so the markdown must list it (and every other row)
  // instead of linking back to /companies, which would only serve the same
  // truncated markdown again.
  const many = Array.from({ length: COMPANY_PAGE_SIZE + 1 }, (_, index) =>
    job({
      id: String(index),
      slug: `company-${index}`,
      title: `Role ${index}`,
      companyName: `Company ${String.fromCharCode(65 + index)}`,
      companySlug: `company-${index}`,
    })
  );
  setPool(many);
  const markdown = (await boardPageMarkdown("/companies", siteUrl)) ?? "";
  expect(markdown).toContain(
    `${COMPANY_PAGE_SIZE + 1} companies, ${COMPANY_PAGE_SIZE + 1} open roles.`
  );
  // The directory orders companies by name, so the row the HTML folds away
  // is the last one. It is right here in the markdown, linked like the rest.
  const cut = many[COMPANY_PAGE_SIZE] as JobListItem;
  expect(markdown).toContain(
    `[Company A](${siteUrl}/companies/company-0) New York, NY 1 open role`
  );
  expect(markdown).toContain(
    `[${cut.companyName}](${siteUrl}/companies/${cut.companySlug}) New York, NY 1 open role`
  );
  // Every company, not just the first COMPANY_PAGE_SIZE.
  for (const row of many) {
    expect(markdown).toContain(
      `[${row.companyName}](${siteUrl}/companies/${row.companySlug})`
    );
  }
  expect(markdown).not.toContain("More companies");
});

test("feed text cannot inject markdown structure", async () => {
  stubBoard();
  vi.setSystemTime(now);
  const hostile = job({
    id: "9",
    slug: "hostile-title",
    title: "Title [with] *stars* `bt` and a [link](https://evil.example)",
    companyName: "Evil *Co* [x]",
    companySlug: "evil-co",
    locationDisplay: "New\nYork *1*",
    workplaceType: null,
    employmentType: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryMinUsd: null,
    salaryMaxUsd: null,
  });
  setPool([hostile]);

  const markdown = (await boardPageMarkdown("/jobs", siteUrl)) ?? "";
  // The label is escaped, so no second link or emphasis is created, and the
  // real link target is the job's own page. The meta line keeps the middot
  // the job row renders.
  expect(markdown).toContain(
    "- [Title \\[with\\] \\*stars\\* \\`bt\\` and a \\[link\\](https://evil.example)](" +
      `${siteUrl}/jobs/hostile-title) Evil \\*Co\\* \\[x\\] · New York \\*1\\*`
  );
  expect(markdown).not.toContain("[link](https://evil.example)");
  // Newlines in feed text are flattened, so a title can never start a new
  // line, list item or heading of its own.
  expect(markdown).not.toContain("New\nYork");
  expect(markdown).toContain("New York \\*1\\*");

  const directory = (await boardPageMarkdown("/companies", siteUrl)) ?? "";
  expect(directory).toContain(
    "[Evil \\*Co\\* \\[x\\]](" +
      `${siteUrl}/companies/evil-co) New York \\*1\\* 1 open role`
  );
  expect(directory).not.toContain("[Evil *Co* [x]](");
});

test("feed text cannot inject autolinks, raw HTML or strikethrough", async () => {
  stubBoard();
  vi.setSystemTime(now);
  // Backslash escaping alone leaves <, > and & intact, so feed text could
  // still open a GFM autolink (<https://...>) or emit raw HTML for
  // downstream renderers, and ~~text~~ strikethrough still worked. The
  // title covers the link-label position, the meta line the free-text one.
  const hostile = job({
    id: "9",
    slug: "hostile-markup",
    title: "See <https://evil.example> ~~now~~ <img src=x onerror=alert(1)>",
    companyName: "Acme <https://evil.example>",
    companySlug: "acme-evil",
    locationDisplay: "R&D ~~hq~~ & <b>unit</b>",
    workplaceType: null,
    employmentType: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryMinUsd: null,
    salaryMaxUsd: null,
  });
  setPool([hostile]);

  const markdown = (await boardPageMarkdown("/jobs", siteUrl)) ?? "";
  // Label position: no autolink, no strikethrough, no raw <img>, and the
  // real link target is still the job's own page.
  expect(markdown).toContain(
    "- [See &lt;https://evil.example&gt; \\~\\~now\\~\\~ " +
      "&lt;img src=x onerror=alert(1)&gt;](" +
      `${siteUrl}/jobs/hostile-markup)`
  );
  // Free-text position on the same line: entity-encoded HTML contexts, no
  // autolink, no strikethrough.
  expect(markdown).toContain(
    "Acme &lt;https://evil.example&gt; · " +
      "R&amp;D \\~\\~hq\\~\\~ &amp; &lt;b&gt;unit&lt;/b&gt;"
  );
  expect(markdown).not.toContain("<https://");
  expect(markdown).not.toContain("<img");
  expect(markdown).not.toContain("<b>");
  expect(markdown).not.toContain("~~now~~");
  expect(markdown).not.toContain("~~hq~~");

  const directory = (await boardPageMarkdown("/companies", siteUrl)) ?? "";
  // The company name is the link label here, the location free text.
  expect(directory).toContain(
    "[Acme &lt;https://evil.example&gt;](" +
      `${siteUrl}/companies/acme-evil) ` +
      "R&amp;D \\~\\~hq\\~\\~ &amp; &lt;b&gt;unit&lt;/b&gt; 1 open role"
  );
  expect(directory).not.toContain("<https://");
  expect(directory).not.toContain("<img");
  expect(directory).not.toContain("<b>");
  expect(directory).not.toContain("~~hq~~");
});
