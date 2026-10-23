import type { CompanyDetail, JobListItem } from "@/lib/read/types";

import { sortBoard } from "./filter";
import { isPublicCompanySlug } from "./paths";

export interface CompanyPageData {
  company: CompanyDetail;
  jobs: JobListItem[];
  noindex: boolean;
}

export interface CompanyIndexRow {
  count: number;
  logoUrl: string | null;
  name: string;
  slug: string;
}

export function companiesFromPool(
  cards: readonly JobListItem[]
): CompanyIndexRow[] {
  const bySlug = new Map<string, CompanyIndexRow>();

  for (const card of cards) {
    const slug = card.companySlug;
    if (slug === null || slug.length === 0) {
      continue;
    }

    const existing = bySlug.get(slug);
    if (existing) {
      existing.count += 1;
      continue;
    }

    bySlug.set(slug, {
      count: 1,
      logoUrl: card.companyLogoUrl,
      name: card.companyName,
      slug,
    });
  }

  return [...bySlug.values()].sort(
    (left, right) =>
      left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug)
  );
}

export async function loadCompanyPage(
  slug: string
): Promise<CompanyPageData | null> {
  if (!isPublicCompanySlug(slug)) {
    return null;
  }

  // Static imports of the read layer evaluate Payload config.
  // Unit tests do not boot Payload, so load it only when a page asks.
  const [{ getCompanyBySlug }, { loadBoardPool }] = await Promise.all([
    import("@/lib/read"),
    import("./pool"),
  ]);
  const [company, cards] = await Promise.all([
    getCompanyBySlug(slug),
    loadBoardPool(),
  ]);
  if (!company) {
    return null;
  }

  const jobs = sortBoard(
    cards.filter((card) => card.companySlug === slug),
    "newest"
  );
  if (jobs.length === 0) {
    return null;
  }

  return {
    company,
    jobs,
    noindex: jobs.every((job) => !job.indexable),
  };
}
