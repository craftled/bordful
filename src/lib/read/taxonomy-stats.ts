import {
  buildTaxonomyArchivePath,
  slugifyTaxonomyValue,
  type TaxonomyKind,
} from "@/lib/board/paths";
import {
  countTaxonomy,
  filterByTaxonomy,
  taxonomyValuesFor,
} from "@/lib/board/taxonomy";
import {
  CAREER_LEVELS,
  JOB_WORKPLACE_LABELS,
  type JobEmploymentType,
} from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

// Fewer salaried roles than this and a median says nothing, so it is omitted.
const MIN_SALARIED = 3;
const THOUSAND = 1000;

function midpointUsd(card: JobListItem): number | null {
  const { salaryMaxUsd: max, salaryMinUsd: min } = card;
  if (min !== null && max !== null) {
    return (min + max) / 2;
  }
  return min ?? max;
}

// Median of the USD-normalised salary midpoints, or null when too few roles
// publish a salary.
export function medianSalaryUsd(cards: readonly JobListItem[]): number | null {
  const values = cards
    .map(midpointUsd)
    .filter((value): value is number => value !== null && value > 0)
    .sort((left, right) => left - right);
  if (values.length < MIN_SALARIED) {
    return null;
  }

  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 1) {
    return values[middle] ?? null;
  }
  const low = values[middle - 1];
  const high = values[middle];
  return low === undefined || high === undefined ? null : (low + high) / 2;
}

export function formatMedianUsd(value: number | null): string | null {
  if (value === null) {
    return null;
  }
  return `Median $${Math.round(value / THOUSAND)}k`;
}

export interface WorkplaceCount {
  count: number;
  label: string;
  type: "hybrid" | "onsite" | "remote";
}

export function countWorkplaces(
  cards: readonly JobListItem[]
): WorkplaceCount[] {
  const types = ["remote", "hybrid", "onsite"] as const;
  return types
    .map((type) => ({
      count: cards.filter((card) => card.workplaceType === type).length,
      label: JOB_WORKPLACE_LABELS[type],
      type,
    }))
    .filter((row) => row.count > 0);
}

export interface RelatedValue {
  count: number;
  href: string;
  label: string;
  slug: string;
}

const RELATED_LIMIT = 3;

// The levels either side of the current one on the career ladder, nearest
// first, then shown in ladder order. Counts use the archive's own matching
// (career level or mapped seniority), so they agree with each level page.
function nearbyLevels(
  cards: readonly JobListItem[],
  slug: string,
  limit: number
): RelatedValue[] {
  const ladder = CAREER_LEVELS.map((level, index) => ({
    count: filterByTaxonomy(cards, "level", level)?.length ?? 0,
    index,
    label: level,
    slug: slugifyTaxonomyValue(level),
  }));
  const current = ladder.find((step) => step.slug === slug);
  if (!current) {
    return [];
  }

  return ladder
    .filter((step) => step.slug !== slug && step.count > 0)
    .sort(
      (left, right) =>
        Math.abs(left.index - current.index) -
          Math.abs(right.index - current.index) || left.index - right.index
    )
    .slice(0, limit)
    .sort((left, right) => left.index - right.index)
    .map((step) => ({
      count: step.count,
      href: buildTaxonomyArchivePath("level", step.slug),
      label: step.label,
      slug: step.slug,
    }));
}

// Other values of the same taxonomy with open roles: the nearest levels, or
// the largest other types, locations and languages.
export function relatedTaxonomy(
  cards: readonly JobListItem[],
  kind: TaxonomyKind,
  rawSlug: string,
  limit = RELATED_LIMIT
): RelatedValue[] {
  const slug = slugifyTaxonomyValue(rawSlug);
  if (kind === "level") {
    return nearbyLevels(cards, slug, limit);
  }

  const counts = countTaxonomy(cards);
  const facets = {
    language: counts.languages,
    location: counts.locations,
    type: counts.types,
  }[kind];
  return facets
    .filter((facet) => facet.slug !== slug && facet.count > 0)
    .slice(0, limit)
    .map(({ count, href, label, slug: value }) => ({
      count,
      href,
      label,
      slug: value,
    }));
}

// One generic, always-true line per contract type, as on Paper's type cards.
export const TYPE_DESCRIPTION: Record<JobEmploymentType, string> = {
  contract: "Fixed-term or project-based",
  "full-time": "Permanent, standard hours",
  internship: "Training role, often for students",
  other: "Other working arrangements",
  "part-time": "Reduced or flexible hours",
  "per-diem": "Paid by the day, as needed",
  temporary: "Short-term, with a set end date",
  volunteer: "Unpaid, mission-driven work",
};

// Roles that carry at least one value of this taxonomy, so the intro count
// matches the cards below it (a job with no language is on no language card).
export function rolesWithTaxonomy(
  cards: readonly JobListItem[],
  kind: TaxonomyKind
): number {
  return cards.filter((card) => {
    const values = taxonomyValuesFor(card);
    if (kind === "type") {
      return values.type !== null;
    }
    const list = {
      language: values.languages,
      level: values.levels,
      location: values.locations,
    }[kind];
    return list.length > 0;
  }).length;
}
