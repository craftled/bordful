import { afterEach, expect, test, vi } from "vitest";
import { heroStats } from "@/components/board/board-hero";
import { listStats } from "@/components/board/board-listing";
import { resultsLabel } from "@/components/board/board-toolbar";
import { filterBoard } from "@/lib/board/filter";
import { formatLocation, formatSalary } from "@/lib/board/format";
import { buildJobPath } from "@/lib/board/paths";
import { parseBoardQuery } from "@/lib/board/query";
import { buildBoardView } from "@/lib/board/view";
import type { JobListItem } from "@/lib/read/types";

import {
  BOARD_PAGE_CACHE_CONTROL,
  boardPageMarkdown,
} from "./agent-board-pages";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const siteUrl = "http://localhost:3000";

const { settingsMock } = vi.hoisted(() => ({
  settingsMock: vi.fn(),
}));

vi.mock("@/lib/read", () => ({
  getSiteSettings: settingsMock,
  listPublishedJobs: vi.fn(async () => ({
    items: FIXTURE_JOBS,
    total: FIXTURE_JOBS.length,
    totalPages: 1,
  })),
}));

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

function stubBoard(
  settings?: Partial<{ alertsEnabled: boolean; postJobEnabled: boolean }>
) {
  settingsMock.mockImplementation(async () => ({
    alerts: {
      enabled: settings?.alertsEnabled ?? false,
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
      }·${formatLocation(jobItem)}`
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
