import { createHash } from "node:crypto";

import {
  CAREER_LEVELS,
  type JobCareerLevel,
  type JobEmploymentType,
  type JobSeniority,
  type JobWorkplaceType,
} from "@/lib/domain/job-vocab";
import { isReservedJobSlug } from "@/lib/domain/reserved-slugs";

import {
  htmlToLexical,
  type LexicalRoot,
  textToLexical,
} from "./html-to-lexical";
import type { BordfeedJob } from "./job-schema";
import {
  httpUrl,
  type MappedCompany,
  mapBordfeedCompany,
  slugify,
} from "./map-company";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENCY = /^[A-Z]{3}$/;
const COUNTRY = /^[A-Z]{2}$/;

const EMPLOYMENT: Record<string, JobEmploymentType> = {
  Contract: "contract",
  Contractor: "contract",
  "Full-time": "full-time",
  Internship: "internship",
  "Part-time": "part-time",
  "Per diem": "per-diem",
  Temporary: "temporary",
  Volunteer: "volunteer",
};

const WORKPLACE: Record<string, JobWorkplaceType> = {
  Hybrid: "hybrid",
  "On-site": "onsite",
  Remote: "remote",
};

const SENIORITY: Record<JobCareerLevel, JobSeniority> = {
  "C-Level": "c_level",
  Director: "director",
  Entry: "entry",
  Founder: "c_level",
  Internship: "intern",
  Junior: "entry",
  Lead: "lead",
  Manager: "lead",
  Mid: "mid",
  Senior: "senior",
  VP: "vp",
};

const CAREER_LEVEL_SET = new Set<string>(CAREER_LEVELS);

export interface StringRow {
  value: string;
}

export interface MappedJob {
  applyEmail: string | null;
  applyMethod: string | null;
  applyUrl: string | null;
  bordfeedDescriptionHash: string;
  bordfeedJobId: string;
  careerLevel: JobCareerLevel[];
  categories: StringRow[];
  company: MappedCompany | null;
  countryCode: string | null;
  description: LexicalRoot;
  employmentType: JobEmploymentType | null;
  languages: StringRow[];
  locality: string | null;
  locationDisplay: string | null;
  origin: "bordfeed" | "bordfeed_sample";
  publishedAt: string | null;
  region: string | null;
  remoteRegion: string | null;
  salaryCurrency: string | null;
  salaryMax: number | null;
  salaryMaxUsd: number | null;
  salaryMin: number | null;
  salaryMinUsd: number | null;
  seniority: JobSeniority | null;
  slug: string;
  sourceListingUrl: string | null;
  title: string;
  validThrough: string | null;
  visaSponsorship: string | null;
  workplaceType: JobWorkplaceType | null;
}

function trimToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isoOrNull(value: string | null | undefined): string | null {
  const raw = trimToNull(value);
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function rows(values: string[] | null | undefined): StringRow[] {
  if (!values) {
    return [];
  }

  return values
    .filter((value) => value.trim().length > 0)
    .map((value) => ({ value: value.trim() }));
}

function careerLevels(values: string[] | null | undefined): JobCareerLevel[] {
  if (!values) {
    return [];
  }

  const levels: JobCareerLevel[] = [];
  for (const value of values) {
    if (CAREER_LEVEL_SET.has(value)) {
      levels.push(value as JobCareerLevel);
    }
  }

  return levels;
}

function employmentType(
  value: string | null | undefined
): JobEmploymentType | null {
  if (value === null || value === undefined) {
    return null;
  }

  return EMPLOYMENT[value] ?? "other";
}

function countryCode(value: string | null | undefined): string | null {
  const code = trimToNull(value)?.toUpperCase() ?? null;
  return code && COUNTRY.test(code) ? code : null;
}

function currency(value: string | null | undefined): string | null {
  const code = trimToNull(value)?.toUpperCase() ?? null;
  return code && CURRENCY.test(code) ? code : null;
}

function jobSlug(title: string, raw: string | null, id: string): string {
  if (raw && SLUG.test(raw) && !isReservedJobSlug(raw)) {
    return raw;
  }

  const base = slugify(title);
  const suffix = id.slice(0, 8);
  if (base.length === 0) {
    return suffix.length > 0 ? suffix : "job";
  }

  return `${base}-${suffix}`;
}

export function mapBordfeedJob(
  job: BordfeedJob,
  origin: "bordfeed" | "bordfeed_sample"
): MappedJob {
  const title = trimToNull(job.title) ?? "Untitled role";
  const html = job.description_html;
  const missingHtml = html === null || html === undefined;
  const source = missingHtml ? (job.description ?? "") : html;
  const description = missingHtml
    ? textToLexical(job.description ?? "")
    : htmlToLexical(html);
  const levels = careerLevels(job.career_level);
  const [firstLevel] = levels;

  return {
    applyEmail: trimToNull(job.apply_email),
    applyMethod: trimToNull(job.apply_method),
    applyUrl: httpUrl(job.apply_url),
    bordfeedDescriptionHash: createHash("sha256").update(source).digest("hex"),
    bordfeedJobId: job.id,
    careerLevel: levels,
    categories: trimToNull(job.occupational_category)
      ? [{ value: trimToNull(job.occupational_category) as string }]
      : [],
    company: mapBordfeedCompany(job.company),
    countryCode: countryCode(job.workplace_country_code),
    description,
    employmentType: employmentType(job.type),
    languages: rows(job.languages ?? (job.language ? [job.language] : [])),
    locality: trimToNull(job.workplace_city),
    locationDisplay:
      job.locations && job.locations.length > 0
        ? job.locations.join("; ")
        : null,
    origin,
    publishedAt: isoOrNull(job.posted_date) ?? isoOrNull(job.first_visible_at),
    region: trimToNull(job.workplace_region),
    remoteRegion: trimToNull(job.remote_region),
    salaryCurrency: currency(job.salary_currency),
    salaryMax: numberOrNull(job.salary_max),
    salaryMaxUsd: numberOrNull(job.salary_max_usd),
    salaryMin: numberOrNull(job.salary_min),
    salaryMinUsd: numberOrNull(job.salary_min_usd),
    seniority: firstLevel ? SENIORITY[firstLevel] : null,
    slug: jobSlug(title, trimToNull(job.slug), job.id),
    sourceListingUrl: httpUrl(job.listing_url),
    title,
    validThrough: isoOrNull(job.valid_through),
    visaSponsorship: trimToNull(job.visa_sponsorship),
    workplaceType: job.workplace_type
      ? (WORKPLACE[job.workplace_type] ?? null)
      : null,
  };
}
