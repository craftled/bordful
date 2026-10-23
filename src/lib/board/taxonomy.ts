import type { Metadata } from "next";

import { resolveServerUrl } from "@/config/server-url";
import {
  CAREER_LEVELS,
  JOB_EMPLOYMENT_LABELS,
  JOB_EMPLOYMENT_TYPES,
  type JobCareerLevel,
  type JobEmploymentType,
  type JobSeniority,
} from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

import {
  buildTaxonomyArchivePath,
  slugifyTaxonomyValue,
  type TaxonomyKind,
} from "./paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  parseBoardQuery,
} from "./query";

export type { TaxonomyKind } from "./paths";

const ISO2_RE = /^[a-z]{2}$/;
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

export const SENIORITY_LEVEL: Partial<Record<JobSeniority, JobCareerLevel>> = {
  c_level: "C-Level",
  director: "Director",
  entry: "Entry",
  intern: "Internship",
  lead: "Lead",
  mid: "Mid",
  senior: "Senior",
  vp: "VP",
};

export interface TaxonomyFacet {
  count: number;
  href: string;
  label: string;
  slug: string;
}

export interface TaxonomyCounts {
  languages: TaxonomyFacet[];
  levels: TaxonomyFacet[];
  locations: TaxonomyFacet[];
  types: TaxonomyFacet[];
}

export interface TaxonomyValues {
  languages: string[];
  levels: string[];
  locations: string[];
  type: JobEmploymentType | null;
}

export function countryLabel(code: string): string {
  const upper = code.trim().toUpperCase();
  try {
    return regionNames.of(upper) || upper;
  } catch {
    return upper;
  }
}

export function languageLabel(code: string): string {
  const trimmed = code.trim();
  if (trimmed.length === 0) {
    return "";
  }

  try {
    const name = languageNames.of(trimmed);
    if (!name || name.toLowerCase() === trimmed.toLowerCase()) {
      return trimmed;
    }
    return name;
  } catch {
    return trimmed;
  }
}

export function taxonomyValuesFor(card: JobListItem): TaxonomyValues {
  const locations: string[] = [];
  if (card.workplaceType === "remote") {
    locations.push("remote");
  }
  const country = card.countryCode?.trim().toLowerCase() ?? "";
  if (ISO2_RE.test(country)) {
    locations.push(country);
  }

  return {
    languages: card.languages
      .map((language) => slugifyTaxonomyValue(language))
      .filter((language) => language.length > 0),
    levels: card.careerLevel.filter((level) => level.length > 0),
    locations,
    type: card.employmentType,
  };
}

export function taxonomyLabel(kind: TaxonomyKind, slug: string): string {
  if (kind === "type") {
    if ((JOB_EMPLOYMENT_TYPES as readonly string[]).includes(slug)) {
      return JOB_EMPLOYMENT_LABELS[slug as JobEmploymentType];
    }
    return slug;
  }
  if (kind === "level") {
    return levelLabel(slug) ?? slug;
  }
  if (kind === "location") {
    return slug === "remote" ? "Remote" : countryLabel(slug);
  }

  return languageLabel(slug);
}

export function taxonomyTitle(kind: TaxonomyKind, value: string): string {
  return `${taxonomyLabel(kind, slugifyTaxonomyValue(value))} jobs`;
}

export function taxonomyArchiveMetadata(
  kind: TaxonomyKind,
  value: string,
  page = 1
): Metadata {
  const path = buildTaxonomyArchivePath(kind, value, page);
  return {
    alternates: {
      canonical: `${resolveServerUrl()}${path}`,
    },
    title: taxonomyTitle(kind, value),
  };
}

export function taxonomySearchQuery(
  kind: TaxonomyKind,
  rawSlug: string,
  page: number,
  options: BoardQueryOptions
): BoardQuery | null {
  const slug = slugifyTaxonomyValue(rawSlug);
  if (slug.length === 0) {
    return null;
  }

  const base = parseBoardQuery(new URLSearchParams(""), options);
  if (kind === "type" && isEmploymentType(slug)) {
    return { ...base, page, types: [slug] };
  }
  if (kind === "location" && slug === "remote") {
    return { ...base, page, remote: true };
  }
  if (kind === "language") {
    return { ...base, languages: [slug], page };
  }

  return null;
}

function bump(
  counts: Map<string, { count: number; label: string }>,
  slug: string,
  label: string
): void {
  const existing = counts.get(slug);
  if (existing) {
    existing.count += 1;
    return;
  }

  counts.set(slug, { count: 1, label });
}

function facetsFrom(
  counts: Map<string, { count: number; label: string }>,
  kind: TaxonomyKind
): TaxonomyFacet[] {
  return [...counts.entries()]
    .map(([slug, value]) => ({
      count: value.count,
      href: buildTaxonomyArchivePath(kind, slug),
      label: value.label,
      slug,
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.slug.localeCompare(right.slug)
    );
}

export function countTaxonomy(cards: readonly JobListItem[]): TaxonomyCounts {
  const types = new Map<string, { count: number; label: string }>();
  const levels = new Map<string, { count: number; label: string }>();
  const locations = new Map<string, { count: number; label: string }>();
  const languages = new Map<string, { count: number; label: string }>();

  for (const card of cards) {
    const values = taxonomyValuesFor(card);
    if (values.type) {
      bump(types, values.type, JOB_EMPLOYMENT_LABELS[values.type]);
    }
    for (const level of values.levels) {
      bump(levels, slugifyTaxonomyValue(level), level);
    }
    for (const location of values.locations) {
      const label = location === "remote" ? "Remote" : countryLabel(location);
      bump(locations, location, label);
    }
    const seenLanguages = new Set<string>();
    for (const language of values.languages) {
      if (seenLanguages.has(language)) {
        continue;
      }
      seenLanguages.add(language);
      bump(languages, language, languageLabel(language));
    }
  }

  return {
    languages: facetsFrom(languages, "language"),
    levels: facetsFrom(levels, "level"),
    locations: facetsFrom(locations, "location"),
    types: facetsFrom(types, "type"),
  };
}

function isEmploymentType(slug: string): slug is JobEmploymentType {
  return (JOB_EMPLOYMENT_TYPES as readonly string[]).includes(slug);
}

function levelLabel(slug: string): JobCareerLevel | null {
  return (
    CAREER_LEVELS.find((level) => slugifyTaxonomyValue(level) === slug) ?? null
  );
}

function cardMatchesLevel(card: JobListItem, label: JobCareerLevel): boolean {
  if (card.careerLevel.includes(label)) {
    return true;
  }
  if (card.seniority === null) {
    return false;
  }

  return SENIORITY_LEVEL[card.seniority] === label;
}

export function filterByTaxonomy(
  cards: readonly JobListItem[],
  kind: TaxonomyKind,
  rawSlug: string
): JobListItem[] | null {
  const slug = slugifyTaxonomyValue(rawSlug);
  if (slug.length === 0) {
    return null;
  }

  if (kind === "type") {
    if (!isEmploymentType(slug)) {
      return null;
    }
    return cards.filter((card) => card.employmentType === slug);
  }

  if (kind === "level") {
    const label = levelLabel(slug);
    if (!label) {
      return null;
    }
    return cards.filter((card) => cardMatchesLevel(card, label));
  }

  if (kind === "language") {
    return cards.filter((card) =>
      taxonomyValuesFor(card).languages.includes(slug)
    );
  }

  if (slug !== "remote" && !ISO2_RE.test(slug)) {
    return null;
  }

  return cards.filter((card) =>
    taxonomyValuesFor(card).locations.includes(slug)
  );
}
