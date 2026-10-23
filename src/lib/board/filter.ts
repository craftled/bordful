import {
  type JobEmploymentType,
  type JobSeniority,
  SALARY_BAND_IDS,
  type SalaryBandId,
} from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

import { toUsd } from "./fx";
import type { BoardQuery, BoardSort } from "./query";

export interface BoardFacetValue {
  count: number;
  value: string;
}

export interface BoardFacets {
  languages: BoardFacetValue[];
  remote: number;
  salary: BoardFacetValue[];
  seniority: BoardFacetValue[];
  types: BoardFacetValue[];
  visa: number;
}

interface SalaryBand {
  max: number;
  maxInclusive: boolean;
  min: number;
  minInclusive: boolean;
}

const VISA_OFF = new Set(["false", "no", "none"]);

const SALARY_BANDS: Record<SalaryBandId, SalaryBand> = {
  "< $50K": { max: 50_000, maxInclusive: false, min: 0, minInclusive: true },
  "> $200K": {
    max: Number.POSITIVE_INFINITY,
    maxInclusive: false,
    min: 200_000,
    minInclusive: false,
  },
  "$50K - $100K": {
    max: 100_000,
    maxInclusive: true,
    min: 50_000,
    minInclusive: true,
  },
  "$100K - $200K": {
    max: 200_000,
    maxInclusive: true,
    min: 100_000,
    minInclusive: false,
  },
};

export function offersVisa(value: string | null): boolean {
  if (value === null) {
    return false;
  }

  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) {
    return false;
  }

  return !VISA_OFF.has(trimmed);
}

function ordered(left: number, right: number): [number, number] {
  return left <= right ? [left, right] : [right, left];
}

export function usdBounds(card: JobListItem): [number, number] | null {
  if (card.salaryMinUsd !== null || card.salaryMaxUsd !== null) {
    const min = card.salaryMinUsd ?? card.salaryMaxUsd;
    const max = card.salaryMaxUsd ?? card.salaryMinUsd;
    if (min === null || max === null) {
      return null;
    }
    return ordered(min, max);
  }

  if (card.salaryCurrency === null) {
    return null;
  }

  const min =
    card.salaryMin === null ? null : toUsd(card.salaryMin, card.salaryCurrency);
  const max =
    card.salaryMax === null ? null : toUsd(card.salaryMax, card.salaryCurrency);
  const lo = min ?? max;
  const hi = max ?? min;
  if (lo === null || hi === null) {
    return null;
  }

  return ordered(lo, hi);
}

function overlaps(bounds: [number, number], band: SalaryBand): boolean {
  const [lo, hi] = bounds;
  const aboveMin = band.minInclusive ? hi >= band.min : hi > band.min;
  const belowMax = band.maxInclusive ? lo <= band.max : lo < band.max;
  return aboveMin && belowMax;
}

function matchesSalary(card: JobListItem, bands: SalaryBandId[]): boolean {
  if (bands.length === 0) {
    return true;
  }

  const bounds = usdBounds(card);
  if (bounds === null) {
    return false;
  }

  return bands.some((band) => overlaps(bounds, SALARY_BANDS[band]));
}

function matchesText(card: JobListItem, q: string): boolean {
  if (q.length === 0) {
    return true;
  }

  const needle = q.toLowerCase();
  return (
    card.title.toLowerCase().includes(needle) ||
    card.companyName.toLowerCase().includes(needle)
  );
}

function matchesLanguages(card: JobListItem, languages: string[]): boolean {
  if (languages.length === 0) {
    return true;
  }

  const present = new Set(
    card.languages.map((language) => language.toLowerCase())
  );
  return languages.some((language) => present.has(language.toLowerCase()));
}

function matchesList<T extends string>(
  selected: T[],
  value: T | null
): boolean {
  if (selected.length === 0) {
    return true;
  }

  return value !== null && selected.includes(value);
}

function matchesCard(card: JobListItem, query: BoardQuery): boolean {
  if (!matchesText(card, query.q)) {
    return false;
  }
  if (!matchesList<JobEmploymentType>(query.types, card.employmentType)) {
    return false;
  }
  if (!matchesList<JobSeniority>(query.seniority, card.seniority)) {
    return false;
  }
  if (query.remote && card.workplaceType !== "remote") {
    return false;
  }
  if (query.visa && !offersVisa(card.visaSponsorship)) {
    return false;
  }

  return (
    matchesLanguages(card, query.languages) && matchesSalary(card, query.salary)
  );
}

export function filterBoard(
  cards: JobListItem[],
  query: BoardQuery
): JobListItem[] {
  return cards.filter((card) => matchesCard(card, query));
}

function publishedMs(iso: string | null, now: number): number {
  if (iso) {
    const value = Date.parse(iso);
    if (!Number.isNaN(value)) {
      return value;
    }
  }

  // Missing timestamps use the pinned clock so ordering stays deterministic.
  return now;
}

function compareSlug(left: JobListItem, right: JobListItem): number {
  return left.slug.localeCompare(right.slug);
}

function compareNewest(
  left: JobListItem,
  right: JobListItem,
  now: number
): number {
  const delta =
    publishedMs(right.publishedAt, now) - publishedMs(left.publishedAt, now);
  return delta === 0 ? compareSlug(left, right) : delta;
}

function compareOldest(
  left: JobListItem,
  right: JobListItem,
  now: number
): number {
  const delta =
    publishedMs(left.publishedAt, now) - publishedMs(right.publishedAt, now);
  return delta === 0 ? compareSlug(left, right) : delta;
}

function salarySortKey(card: JobListItem): number | null {
  return card.salaryMaxUsd ?? card.salaryMinUsd;
}

function compareSalary(
  left: JobListItem,
  right: JobListItem,
  now: number
): number {
  const leftUsd = salarySortKey(left);
  const rightUsd = salarySortKey(right);
  if (leftUsd === null && rightUsd === null) {
    return compareNewest(left, right, now);
  }
  if (leftUsd === null) {
    return 1;
  }
  if (rightUsd === null) {
    return -1;
  }
  if (leftUsd !== rightUsd) {
    return rightUsd - leftUsd;
  }

  return compareNewest(left, right, now);
}

export function sortBoard(
  cards: JobListItem[],
  sort: BoardSort,
  now = Date.now()
): JobListItem[] {
  const copy = [...cards];

  if (sort === "oldest") {
    copy.sort((left, right) => compareOldest(left, right, now));
    return copy;
  }
  if (sort === "salary") {
    copy.sort((left, right) => compareSalary(left, right, now));
    return copy;
  }

  copy.sort((left, right) => compareNewest(left, right, now));
  return copy;
}

export function paginateBoard(
  cards: JobListItem[],
  perPage: number,
  page: number
): { docs: JobListItem[]; outOfRange: boolean; totalPages: number } {
  const size = perPage > 0 ? perPage : 1;
  const totalPages = Math.max(1, Math.ceil(cards.length / size));
  const outOfRange = page > totalPages;

  if (outOfRange) {
    return { docs: [], outOfRange, totalPages };
  }

  const start = (page - 1) * size;
  return {
    docs: cards.slice(start, start + size),
    outOfRange,
    totalPages,
  };
}

function bump(counts: Map<string, number>, value: string | null): void {
  if (value === null || value.length === 0) {
    return;
  }

  counts.set(value, (counts.get(value) ?? 0) + 1);
}

function sortFacetValues(counts: Map<string, number>): BoardFacetValue[] {
  return [...counts.entries()]
    .map(([value, count]) => ({ count, value }))
    .sort(
      (left, right) =>
        right.count - left.count || left.value.localeCompare(right.value)
    );
}

function languageCounts(cards: JobListItem[]): BoardFacetValue[] {
  const counts = new Map<string, number>();

  for (const card of cards) {
    const seen = new Set<string>();
    for (const language of card.languages) {
      const value = language.trim().toLowerCase();
      if (value.length === 0 || seen.has(value)) {
        continue;
      }
      seen.add(value);
      bump(counts, value);
    }
  }

  return sortFacetValues(counts);
}

export function buildBoardFacets(cards: JobListItem[]): BoardFacets {
  const types = new Map<string, number>();
  const seniority = new Map<string, number>();
  let remote = 0;
  let visa = 0;

  for (const card of cards) {
    bump(types, card.employmentType);
    bump(seniority, card.seniority);
    if (card.workplaceType === "remote") {
      remote += 1;
    }
    if (offersVisa(card.visaSponsorship)) {
      visa += 1;
    }
  }

  return {
    languages: languageCounts(cards),
    remote,
    salary: SALARY_BAND_IDS.map((value) => ({
      count: cards.filter((card) => matchesSalary(card, [value])).length,
      value,
    })),
    seniority: sortFacetValues(seniority),
    types: sortFacetValues(types),
    visa,
  };
}
