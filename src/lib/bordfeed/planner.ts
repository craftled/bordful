import type { JobOrigin } from "@/lib/domain/job-vocab";

import { companyKey } from "./map-company";
import type { MappedJob } from "./map-job";

export interface ComparableFields {
  applyEmail: string | null;
  applyMethod: string | null;
  applyUrl: string | null;
  careerLevel: string[];
  categories: string[];
  companyKey: string | null;
  countryCode: string | null;
  employmentType: string | null;
  languages: string[];
  locality: string | null;
  locationDisplay: string | null;
  publishedAt: string | null;
  region: string | null;
  remoteRegion: string | null;
  salaryCurrency: string | null;
  salaryMax: number | null;
  salaryMaxUsd: number | null;
  salaryMin: number | null;
  salaryMinUsd: number | null;
  seniority: string | null;
  slug: string;
  sourceListingUrl: string | null;
  title: string;
  validThrough: string | null;
  visaSponsorship: string | null;
  workplaceType: string | null;
}

export interface ExistingRow {
  bordfeedJobId: string | null;
  fields: ComparableFields;
  hash: string | null;
  id: string;
  origin: JobOrigin;
  slug: string;
  status: "draft" | "published";
}

export interface SyncPlan {
  create: MappedJob[];
  deleteIds: string[];
  skipped: number;
  unpublish: string[];
  update: { data: Partial<MappedJob>; id: string; republish: boolean }[];
}

const KEYS = [
  "applyEmail",
  "applyMethod",
  "applyUrl",
  "careerLevel",
  "categories",
  "companyKey",
  "countryCode",
  "employmentType",
  "languages",
  "locality",
  "locationDisplay",
  "publishedAt",
  "region",
  "remoteRegion",
  "salaryCurrency",
  "salaryMax",
  "salaryMaxUsd",
  "salaryMin",
  "salaryMinUsd",
  "seniority",
  "slug",
  "sourceListingUrl",
  "title",
  "validThrough",
  "visaSponsorship",
  "workplaceType",
] as const satisfies readonly (keyof ComparableFields)[];

export function comparableJobFields(job: MappedJob): ComparableFields {
  return orderFields({
    applyEmail: job.applyEmail,
    applyMethod: job.applyMethod,
    applyUrl: job.applyUrl,
    careerLevel: job.careerLevel,
    categories: job.categories.map((item) => item.value),
    companyKey: companyKey(job.company),
    countryCode: job.countryCode,
    employmentType: job.employmentType,
    languages: job.languages.map((item) => item.value),
    locality: job.locality,
    locationDisplay: job.locationDisplay,
    publishedAt: job.publishedAt,
    region: job.region,
    remoteRegion: job.remoteRegion,
    salaryCurrency: job.salaryCurrency,
    salaryMax: job.salaryMax,
    salaryMaxUsd: job.salaryMaxUsd,
    salaryMin: job.salaryMin,
    salaryMinUsd: job.salaryMinUsd,
    seniority: job.seniority,
    slug: job.slug,
    sourceListingUrl: job.sourceListingUrl,
    title: job.title,
    validThrough: job.validThrough,
    visaSponsorship: job.visaSponsorship,
    workplaceType: job.workplaceType,
  });
}

function writeField<Key extends keyof ComparableFields>(
  target: ComparableFields,
  key: Key,
  value: ComparableFields[Key]
): void {
  target[key] = value;
}

export function orderFields(input: ComparableFields): ComparableFields {
  const ordered = {} as ComparableFields;
  for (const key of KEYS) {
    writeField(ordered, key, input[key]);
  }

  return ordered;
}

function sameFields(left: ComparableFields, right: ComparableFields): boolean {
  return (
    JSON.stringify(orderFields(left)) === JSON.stringify(orderFields(right))
  );
}

function allocateSlug(
  desired: string,
  jobId: string,
  ownSlug: string | null,
  taken: Set<string>
): string {
  if (ownSlug !== null && desired === ownSlug) {
    return desired;
  }

  let slug = desired;
  const suffix = jobId.slice(0, 8);
  while (taken.has(slug)) {
    slug = suffix.length > 0 ? `${slug}-${suffix}` : `${slug}-2`;
    if (slug.length > 180) {
      slug = `${suffix || "job"}-${taken.size}`;
      break;
    }
  }

  taken.add(slug);
  return slug;
}

function blocksIncoming(row: ExistingRow, mode: "feed" | "sample"): boolean {
  if (mode === "sample") {
    return (
      row.origin === "bordfeed" ||
      row.origin === "manual" ||
      row.origin === "paid"
    );
  }

  return row.origin === "manual" || row.origin === "paid";
}

function indexRows(existing: ExistingRow[], mode: "feed" | "sample") {
  const targetOrigin = mode === "feed" ? "bordfeed" : "bordfeed_sample";
  const matches = new Map<string, ExistingRow>();
  const blocked = new Set<string>();

  for (const row of existing) {
    if (!row.bordfeedJobId) {
      continue;
    }

    if (row.origin === targetOrigin && !matches.has(row.bordfeedJobId)) {
      matches.set(row.bordfeedJobId, row);
    }

    if (blocksIncoming(row, mode)) {
      blocked.add(row.bordfeedJobId);
    }
  }

  return { blocked, matches };
}

function placeIncoming(
  incoming: MappedJob[],
  matches: Map<string, ExistingRow>,
  blocked: Set<string>,
  taken: Set<string>
) {
  const create: MappedJob[] = [];
  const update: SyncPlan["update"] = [];
  let skipped = 0;
  const seen = new Set<string>();

  for (const job of incoming) {
    if (seen.has(job.bordfeedJobId) || blocked.has(job.bordfeedJobId)) {
      skipped += 1;
      continue;
    }

    seen.add(job.bordfeedJobId);
    const match = matches.get(job.bordfeedJobId) ?? null;
    const slug = allocateSlug(
      job.slug,
      job.bordfeedJobId,
      match?.slug ?? null,
      taken
    );
    const planned = slug === job.slug ? job : { ...job, slug };
    if (!match) {
      create.push(planned);
      continue;
    }

    const changed =
      (match.hash ?? null) !== planned.bordfeedDescriptionHash ||
      !sameFields(match.fields, comparableJobFields(planned));
    const republish = match.status === "draft";
    if (changed || republish) {
      update.push({
        data: changed ? planned : {},
        id: match.id,
        republish,
      });
    }
  }

  return { create, seen, skipped, update };
}

function missingPublishedFeed(row: ExistingRow, seen: Set<string>): boolean {
  return (
    row.origin === "bordfeed" &&
    row.status === "published" &&
    Boolean(row.bordfeedJobId) &&
    !seen.has(row.bordfeedJobId ?? "")
  );
}

function removalFor(
  row: ExistingRow,
  mode: "feed" | "sample",
  seen: Set<string>
): "delete" | "keep" | "unpublish" {
  if (mode === "feed" && row.origin === "bordfeed_sample") {
    return "delete";
  }

  if (mode === "sample" && row.origin === "bordfeed_sample") {
    return row.bordfeedJobId && seen.has(row.bordfeedJobId) ? "keep" : "delete";
  }

  return mode === "feed" && missingPublishedFeed(row, seen)
    ? "unpublish"
    : "keep";
}

function removals(
  existing: ExistingRow[],
  mode: "feed" | "sample",
  seen: Set<string>
) {
  const deleteIds: string[] = [];
  const unpublish: string[] = [];

  for (const row of existing) {
    const action = removalFor(row, mode, seen);
    if (action === "delete") {
      deleteIds.push(row.id);
    }

    if (action === "unpublish") {
      unpublish.push(row.id);
    }
  }

  return { deleteIds, unpublish };
}

export function planSync(input: {
  existing: ExistingRow[];
  incoming: MappedJob[];
  mode: "feed" | "sample";
  takenSlugs: Set<string>;
}): SyncPlan {
  const taken = new Set(input.takenSlugs);
  const { blocked, matches } = indexRows(input.existing, input.mode);
  const placed = placeIncoming(input.incoming, matches, blocked, taken);
  const removed = removals(input.existing, input.mode, placed.seen);
  return {
    create: placed.create,
    deleteIds: removed.deleteIds,
    skipped: placed.skipped,
    unpublish: removed.unpublish,
    update: placed.update,
  };
}
