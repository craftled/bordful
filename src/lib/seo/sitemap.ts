import { getNav } from "@/config/nav";
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

  return ["/", "/jobs", ...linked, "/companies"];
}

function publishedTime(job: JobListItem): number {
  if (!job.publishedAt) {
    return 0;
  }

  const time = Date.parse(job.publishedAt);
  return Number.isNaN(time) ? 0 : time;
}

function byNewest(a: JobListItem, b: JobListItem): number {
  const delta = publishedTime(b) - publishedTime(a);
  if (delta !== 0) {
    return delta;
  }

  if (a.id === b.id) {
    return 0;
  }

  return a.id < b.id ? 1 : -1;
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
    ...sectionPaths(input.marketing).map((path) => ({
      url: `${input.siteUrl}${path}`,
    })),
    ...indexable.map((job) => jobEntry(input.siteUrl, job)),
    ...companies.map((slug) => ({
      url: `${input.siteUrl}/companies/${slug}`,
    })),
  ];
}
