// Markdown builders for the board index pages: /jobs, /companies and the
// four taxonomy indexes. Async because they call the same read functions and
// paging constants the HTML pages use, so the markdown and the HTML list the
// same rows. Server only. Never called at build time: the routes render these
// on demand so `next build` never opens the database.

import { heroStats } from "@/components/board/board-hero";
import { listStats } from "@/components/board/board-listing";
import { resultsLabel } from "@/components/board/board-toolbar";
import {
  TAXONOMY_INDEX_HEADING,
  TAXONOMY_POPULAR_COUNT,
  taxonomySubtitle,
} from "@/components/board/taxonomy-index";
import { companiesFromPool } from "@/lib/board/companies";
import { COMPANY_PAGE_SIZE } from "@/lib/board/constants";
import { filterBoard } from "@/lib/board/filter";
import { formatLocation, formatSalary } from "@/lib/board/format";
import {
  buildCompanyPath,
  buildJobPath,
  type TaxonomyKind,
} from "@/lib/board/paths";
import { loadBoardPool } from "@/lib/board/pool";
import { parseBoardQuery } from "@/lib/board/query";
import { countTaxonomy, filterByTaxonomy } from "@/lib/board/taxonomy";
import { buildBoardView } from "@/lib/board/view";
import {
  JOB_EMPLOYMENT_LABELS,
  JOB_WORKPLACE_LABELS,
  type JobEmploymentType,
} from "@/lib/domain/job-vocab";
import { getSiteSettings } from "@/lib/read";
import { companyStatsFromPool } from "@/lib/read/company-stats";
import {
  countWorkplaces,
  formatMedianUsd,
  medianSalaryUsd,
  rolesWithTaxonomy,
  TYPE_DESCRIPTION,
} from "@/lib/read/taxonomy-stats";
import type { JobListItem } from "@/lib/read/types";
import {
  AGENT_TAXONOMY_INDEX_PATHS,
  llmsTxtDirective,
} from "./agent-docs-paths";

// The same cache policy the HTML board index pages serve: never cached by a
// shared proxy, always revalidated.
export const BOARD_PAGE_CACHE_CONTROL =
  "private, no-cache, no-store, max-age=0, must-revalidate";

const TRAILING_NEWLINES = /\n+$/u;

// Feed-originated text (job titles, company names, locations, taxonomy
// labels, settings copy) must not carry markdown structure into the page:
// escape the inline specials in both link labels and free text, and flatten
// newlines and tabs so a title can never start a new line, list item or
// heading of its own.
function escapeInline(value: string): string {
  return value
    .replace(/[\r\n\t]+/gu, " ")
    .replace(/[\\`*_[\]]/gu, (char) => `\\${char}`);
}

function shell(
  title: string,
  siteUrl: string,
  lines: readonly string[],
  subtitle?: string
): string {
  const body = [
    `# ${title}`,
    // The taxonomy and companies pages render the subtitle inside the h1,
    // so it stays on the heading line here too.
    ...(subtitle ? [subtitle] : []),
    "",
    llmsTxtDirective(siteUrl),
    "",
    ...lines,
  ].join("\n");
  return `${body.replace(TRAILING_NEWLINES, "")}\n`;
}

// The detail line under a job title, in the shape the job row renders:
// company, then location, workplace and type separated by a middot.
// Every part is feed or settings text, so all of it is escaped.
function jobMetaLine(job: JobListItem): string {
  const location = formatLocation(job);
  const workplace = job.workplaceType
    ? JOB_WORKPLACE_LABELS[job.workplaceType]
    : null;
  const showWorkplace =
    workplace !== null &&
    location !== workplace &&
    !location.startsWith(`${workplace} `) &&
    !location.startsWith(`${workplace},`);
  const details: string[] = [];
  if (location) {
    details.push(escapeInline(location));
  }
  if (showWorkplace && workplace) {
    details.push(escapeInline(workplace));
  }
  if (job.employmentType) {
    details.push(escapeInline(JOB_EMPLOYMENT_LABELS[job.employmentType]));
  }
  return [escapeInline(job.companyName), ...details].join("·");
}

function jobBullets(jobs: readonly JobListItem[], siteUrl: string): string[] {
  return jobs.map((job) => {
    const salary = formatSalary(job);
    const meta = jobMetaLine(job);
    return `- [${escapeInline(job.title)}](${siteUrl}${buildJobPath(
      job.slug
    )})${meta ? ` ${meta}` : ""}${salary ? ` · ${escapeInline(salary)}` : ""}`;
  });
}

// -- /jobs -----------------------------------------------------------------------

async function jobsPageMarkdown(siteUrl: string): Promise<string> {
  const [settings, cards] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const options = { defaultPerPage: settings.board.jobsPerPage };
  const query = parseBoardQuery(new URLSearchParams(""), options);
  const now = Date.now();
  const view = buildBoardView(cards, query, now);
  const stats = listStats(filterBoard(cards, query), now);
  const updated = heroStats(cards, now).lastUpdated;

  const lines: string[] = [
    escapeInline(settings.board.description),
    "",
    resultsLabel(view.matchCount, updated),
    "",
  ];

  if (settings.alerts.enabled) {
    lines.push(
      `- New jobs, by email. ${
        stats.total === 1 ? "1 role" : `${stats.total} roles`
      }. Get new matches in your inbox. Create an alert at ${siteUrl}/alerts`,
      ""
    );
  }

  if (settings.postJob.enabled) {
    lines.push(
      `- Hiring? Post your job. Reach candidates browsing this board. Post a job (${escapeInline(
        settings.postJob.priceLabel
      )}), ${settings.postJob.durationDays}-day listing at ${siteUrl}/post`,
      ""
    );
  }

  if (view.docs.length > 0) {
    lines.push(
      "Pick a role to see the details. Salary, level and location open here, next to the list, so you can compare without losing your place.",
      "",
      "Keyboard: J K move through roles, ↵ open the selected role, S save for later.",
      "",
      ...jobBullets(view.docs, siteUrl)
    );
    // Only the first page fits here; query strings are not part of .md URLs,
    // so point at the HTML page for the rest instead of a ?page= link.
    if (view.totalPages > 1) {
      lines.push("", `More jobs: ${siteUrl}/jobs`);
    }
  } else {
    lines.push("No matching jobs");
  }

  return shell(escapeInline(settings.board.title), siteUrl, lines);
}

// -- /companies --------------------------------------------------------------------

async function companiesPageMarkdown(siteUrl: string): Promise<string> {
  const pool = await loadBoardPool();
  const stats = companyStatsFromPool(pool, Date.now());
  const all = companiesFromPool(pool);
  const rows = all.slice(0, COMPANY_PAGE_SIZE).map((row) => {
    const facts = stats.get(row.slug);
    return {
      ...row,
      location: facts?.location ?? null,
    };
  });

  const subtitle = `${all.length} ${
    all.length === 1 ? "company" : "companies"
  }, ${pool.length} open ${pool.length === 1 ? "role" : "roles"}.`;

  // The HTML directory serves the first COMPANY_PAGE_SIZE cards and folds
  // the rest behind "Show all". The markdown lists the same first page and,
  // when rows were cut, points at the HTML page for the rest (query strings
  // are not part of .md URLs, so there is no ?page= markdown link to give).
  if (all.length === 0) {
    return shell(
      "Companies hiring",
      siteUrl,
      ["No companies with open jobs."],
      subtitle
    );
  }

  const lines: string[] = [
    ...rows.map(
      (row) =>
        `- [${escapeInline(row.name)}](${siteUrl}${buildCompanyPath(
          row.slug
        )}) ${escapeInline(row.location ?? "")} ${
          row.count === 1 ? "1 open role" : `${row.count} open roles`
        }`
    ),
  ];
  if (all.length > rows.length) {
    lines.push("", `More companies: ${siteUrl}/companies`);
  }

  return shell("Companies hiring", siteUrl, lines, subtitle);
}

// -- taxonomy indexes ----------------------------------------------------------------

const TAXONOMY_KINDS = ["type", "level", "location", "language"] as const;

// "/jobs/types" -> "type"; the index paths pluralize only the last segment.
function kindForIndex(path: string): TaxonomyKind | null {
  if (!(AGENT_TAXONOMY_INDEX_PATHS as readonly string[]).includes(path)) {
    return null;
  }
  const plural = path.split("/")[2] ?? "";
  const singular = plural.endsWith("s") ? plural.slice(0, -1) : plural;
  return (TAXONOMY_KINDS as readonly string[]).includes(singular)
    ? (singular as TaxonomyKind)
    : null;
}

// The detail line of a popular card: the contract type's one-line
// description, or the median salary of the facet's roles.
function facetDetail(
  kind: TaxonomyKind,
  cards: readonly JobListItem[],
  facet: { slug: string }
): string | null {
  if (kind === "type") {
    return TYPE_DESCRIPTION[facet.slug as JobEmploymentType] ?? null;
  }
  return formatMedianUsd(
    medianSalaryUsd(filterByTaxonomy(cards, kind, facet.slug) ?? [])
  );
}

function popularCardLine(
  card: {
    detail: string | null;
    facet: { count: number; href: string; label: string };
  },
  inlineDetail: boolean,
  siteUrl: string
): string {
  const count = `${card.facet.count} ${
    card.facet.count === 1 ? "role" : "roles"
  }`;
  let detail = "";
  if (card.detail !== null) {
    detail = inlineDetail ? ` · ${card.detail}` : ` ${card.detail}`;
  }
  return `- [${escapeInline(card.facet.label)}](${
    siteUrl
  }${card.facet.href}) ${count}${detail}`;
}

function workplaceLine(
  row: { count: number; label: string; type: "hybrid" | "onsite" | "remote" },
  siteUrl: string
): string {
  const href = row.type === "remote" ? `${siteUrl}/jobs/location/remote` : null;
  return `- ${
    href ? `[${escapeInline(row.label)}](${href})` : escapeInline(row.label)
  } ${row.count}`;
}

async function taxonomyPageMarkdown(
  kind: TaxonomyKind,
  siteUrl: string
): Promise<string> {
  const cards = await loadBoardPool();
  const facets = countTaxonomy(cards)[
    kind === "location"
      ? "locations"
      : (`${kind}s` as "languages" | "levels" | "types")
  ].filter((facet) => facet.count > 0);
  const popular = facets.slice(0, TAXONOMY_POPULAR_COUNT).map((facet) => ({
    detail: facetDetail(kind, cards, facet),
    facet,
  }));
  const inlineDetail = popular.some((card) => card.detail === null);
  const rest = facets.slice(TAXONOMY_POPULAR_COUNT);
  const workplaces = kind === "type" ? countWorkplaces(cards) : [];

  const subtitle = taxonomySubtitle(
    kind,
    rolesWithTaxonomy(cards, kind),
    facets.length
  );
  const lines: string[] = [];

  if (facets.length === 0) {
    lines.push("No open roles to group yet.", "");
  }

  for (const card of popular) {
    lines.push(popularCardLine(card, inlineDetail, siteUrl));
  }

  for (const facet of rest) {
    lines.push(
      `- [${escapeInline(facet.label)}](${siteUrl}${facet.href}) ${facet.count}`
    );
  }

  if (workplaces.length > 0) {
    lines.push("", "By workplace:", "");
    for (const row of workplaces) {
      lines.push(workplaceLine(row, siteUrl));
    }
  }

  return shell(TAXONOMY_INDEX_HEADING[kind], siteUrl, lines, subtitle);
}

// The markdown version of a board index page, or null for a path that is not
// a board index.
export async function boardPageMarkdown(
  path: string,
  siteUrl: string
): Promise<string | null> {
  if (path === "/jobs") {
    return await jobsPageMarkdown(siteUrl);
  }
  if (path === "/companies") {
    return await companiesPageMarkdown(siteUrl);
  }
  const kind = kindForIndex(path);
  if (kind === null) {
    return null;
  }
  return await taxonomyPageMarkdown(kind, siteUrl);
}
