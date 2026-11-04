import { DOCS_SLUGS } from "@/components/marketing/docs-content";
import { getNav } from "@/config/nav";
import {
  buildTaxonomyArchivePath,
  slugifyTaxonomyValue,
  type TaxonomyKind,
} from "@/lib/board/paths";
import { countTaxonomy, filterByTaxonomy } from "@/lib/board/taxonomy";
import { CAREER_LEVELS } from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

import type { SitemapEntry } from "./types";

function sectionPaths(marketing: boolean): string[] {
  if (!marketing) {
    return ["/", "/jobs", "/companies"];
  }

  const nav = getNav({
    alertsEnabled: false,
    marketing: true,
    postJobEnabled: false,
  });
  const linked = [...nav.header, ...nav.footer]
    .map((item) => item.href)
    .filter((href) => href !== "/jobs" && href !== "/feed.xml");

  // Marketing pages the nav does not link to, then every docs page.
  const unlinked = [
    "/features",
    "/faq",
    "/docs",
    ...DOCS_SLUGS.map((slug) => `/docs/${slug}`),
  ];

  // First occurrence wins, so a later nav item cannot repeat a section URL.
  return [...new Set(["/", "/jobs", ...linked, "/companies", ...unlinked])];
}

// The archives a board renders (200) for these jobs: a value counts only when
// the archive's own filter finds a job for it. Levels also match by mapped
// seniority, so every level on the ladder is a candidate.
function archivePaths(jobs: JobListItem[]): string[] {
  const counts = countTaxonomy(jobs);
  const slugsOf = (facets: { slug: string }[]) =>
    facets.map((facet) => facet.slug);
  const candidates: [TaxonomyKind, string[]][] = [
    ["type", slugsOf(counts.types)],
    ["level", CAREER_LEVELS.map((level) => slugifyTaxonomyValue(level))],
    ["location", slugsOf(counts.locations)],
    ["language", slugsOf(counts.languages)],
  ];

  return candidates.flatMap(([kind, slugs]) =>
    slugs
      .filter((slug) => (filterByTaxonomy(jobs, kind, slug)?.length ?? 0) > 0)
      .sort(bySlug)
      .map((slug) => buildTaxonomyArchivePath(kind, slug))
  );
}

function publishedTime(job: JobListItem): number {
  if (!job.publishedAt) {
    return 0;
  }

  const time = Date.parse(job.publishedAt);
  return Number.isNaN(time) ? 0 : time;
}

function idDescending(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  const left = Number(a);
  const right = Number(b);
  const numeric =
    Number.isSafeInteger(left) &&
    Number.isSafeInteger(right) &&
    String(left) === a &&
    String(right) === b;

  if (numeric) {
    return right - left;
  }

  return a < b ? 1 : -1;
}

function byNewest(a: JobListItem, b: JobListItem): number {
  const delta = publishedTime(b) - publishedTime(a);
  if (delta !== 0) {
    return delta;
  }

  return idDescending(a.id, b.id);
}

function bySlug(a: string, b: string): number {
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
}

function jobEntry(siteUrl: string, job: JobListItem): SitemapEntry {
  const entry: SitemapEntry = { url: `${siteUrl}/jobs/${job.slug}` };
  if (job.publishedAt) {
    entry.lastModified = job.publishedAt;
  }

  return entry;
}

export function buildSitemapEntries(input: {
  jobs: JobListItem[];
  marketing: boolean;
  siteUrl: string;
}): SitemapEntry[] {
  const indexable = input.jobs.filter((job) => job.indexable).sort(byNewest);
  const companies = [
    ...new Set(
      indexable
        .map((job) => job.companySlug)
        .filter((slug): slug is string => Boolean(slug))
    ),
  ].sort(bySlug);

  return [
    ...[...sectionPaths(input.marketing), ...archivePaths(indexable)].map(
      (path) => ({ url: `${input.siteUrl}${path}` })
    ),
    ...indexable.map((job) => jobEntry(input.siteUrl, job)),
    ...companies.map((slug) => ({
      url: `${input.siteUrl}/companies/${slug}`,
    })),
  ];
}
