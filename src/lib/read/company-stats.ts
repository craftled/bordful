import { formatLocation } from "@/lib/board/format";

import type { JobListItem } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
export const HIRING_WINDOW_MS = 7 * DAY_MS;

/** What a company's live jobs say about it. Every value comes from real job rows. */
export interface CompanyStats {
  categories: string[];
  count: number;
  /** Any job published in the last seven days. */
  hiringThisWeek: boolean;
  /** The location most of its jobs list, or null when none do. */
  location: string | null;
  logoUrl: string | null;
  name: string;
  /** More than half of its jobs are remote. */
  remoteFirst: boolean;
  slug: string;
}

function mostCommon(values: readonly string[]): string | null {
  const counts = new Map<string, number>();
  let best: string | null = null;
  let bestCount = 0;
  for (const value of values) {
    const next = (counts.get(value) ?? 0) + 1;
    counts.set(value, next);
    // Ties keep the first seen, which is the newest job in pool order.
    if (next > bestCount) {
      best = value;
      bestCount = next;
    }
  }
  return best;
}

/** Per-company stats from the live job pool, keyed by company slug. */
export function companyStatsFromPool(
  cards: readonly JobListItem[],
  now: number
): Map<string, CompanyStats> {
  const groups = new Map<string, JobListItem[]>();
  for (const card of cards) {
    const slug = card.companySlug;
    if (slug === null || slug.length === 0) {
      continue;
    }
    const group = groups.get(slug);
    if (group) {
      group.push(card);
    } else {
      groups.set(slug, [card]);
    }
  }

  const stats = new Map<string, CompanyStats>();
  for (const [slug, jobs] of groups) {
    const [first] = jobs;
    if (!first) {
      continue;
    }
    const locations = jobs
      .map((job) => formatLocation(job))
      .filter((label) => label !== "Location not listed");
    const remote = jobs.filter((job) => job.workplaceType === "remote").length;
    const hiringThisWeek = jobs.some((job) => {
      const published = job.publishedAt
        ? Date.parse(job.publishedAt)
        : Number.NaN;
      return !Number.isNaN(published) && now - published <= HIRING_WINDOW_MS;
    });

    stats.set(slug, {
      categories: [...new Set(jobs.flatMap((job) => job.categories))],
      count: jobs.length,
      hiringThisWeek,
      location: mostCommon(locations),
      logoUrl: first.companyLogoUrl,
      name: first.companyName,
      remoteFirst: remote * 2 > jobs.length,
      slug,
    });
  }
  return stats;
}

/**
 * Companies that share the most job categories with this one, then location,
 * then size. Companies with nothing in common are left out.
 */
export function similarCompanies(
  stats: ReadonlyMap<string, CompanyStats>,
  slug: string,
  limit = 3
): CompanyStats[] {
  const self = stats.get(slug);
  if (!self) {
    return [];
  }
  const categories = new Set(self.categories);

  const scored: { score: number; company: CompanyStats }[] = [];
  for (const company of stats.values()) {
    if (company.slug === slug) {
      continue;
    }
    const shared = company.categories.filter((category) =>
      categories.has(category)
    ).length;
    const sameLocation =
      self.location !== null && company.location === self.location ? 1 : 0;
    const score = shared * 2 + sameLocation;
    if (score > 0) {
      scored.push({ company, score });
    }
  }

  return scored
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.company.count - left.company.count ||
        left.company.name.localeCompare(right.company.name)
    )
    .slice(0, limit)
    .map((entry) => entry.company);
}
