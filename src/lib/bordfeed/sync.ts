import { bordfulConfig } from "@/config";
import type { Company, Job } from "@/payload-types";

type JobWrite = Omit<
  Job,
  "collection" | "createdAt" | "deletedAt" | "id" | "updatedAt"
>;

import type { Payload } from "payload";

import { resolveBordfeedBaseUrl } from "./base-url";
import { type BordfeedClient, createBordfeedClient } from "./client";
import { bordfeedClientHeaders } from "./client-header";
import type { ConnectionRecord } from "./connection-machine";
import { dispatchConnectionEvent, readConnection } from "./connection-store";
import { BordfeedApiError, SyncGuardError, toSafeError } from "./errors";
import type { BordfeedJob } from "./job-schema";
import { openApiKey } from "./key";
import { companyKey, type MappedCompany } from "./map-company";
import { type MappedJob, mapBordfeedJob } from "./map-job";
import {
  type ComparableFields,
  companyRelationKey,
  type ExistingRow,
  orderFields,
  planSync,
  type SyncPlan,
} from "./planner";
import { previewQuerySchema } from "./preview-query";

export interface SyncDeps {
  client?: BordfeedClient;
  now?: () => Date;
  signal?: AbortSignal;
}

export interface SyncSummary {
  created: number;
  deletedSamples: number;
  durationMs: number;
  mode: "feed" | "sample";
  pages: number;
  skipped: number;
  unpublished: number;
  updated: number;
}

type SyncOrigin = "bordfeed" | "bordfeed_sample";

function clockOf(deps?: SyncDeps): () => Date {
  return deps?.now ?? (() => new Date());
}

const NUMERIC_ID = /^\d+$/;

function docId(id: string): number | string {
  return NUMERIC_ID.test(id) ? Number(id) : id;
}

function iso(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function stringList(
  value: { value?: string | null }[] | null | undefined
): string[] {
  if (!value) {
    return [];
  }

  return value.flatMap((item) =>
    typeof item.value === "string" && item.value.length > 0 ? [item.value] : []
  );
}

async function eachDoc<T extends { id: number }>(
  load: (page: number) => Promise<{ docs: T[]; totalPages: number }>,
  page = 1,
  totalPages = 1,
  docs: T[] = []
): Promise<T[]> {
  if (page > totalPages) {
    return docs;
  }

  const result = await load(page);
  return eachDoc(
    load,
    page + 1,
    result.totalPages || 1,
    docs.concat(result.docs)
  );
}

async function eachSerial<T>(
  items: readonly T[],
  visit: (item: T) => Promise<void>
): Promise<void> {
  const [head, ...rest] = items;
  if (head === undefined) {
    return;
  }

  await visit(head);
  await eachSerial(rest, visit);
}

function loadJobs(payload: Payload): Promise<Job[]> {
  return eachDoc((page) =>
    payload.find({
      collection: "jobs",
      depth: 0,
      draft: true,
      limit: 100,
      overrideAccess: true,
      page,
    })
  );
}

function loadCompanies(payload: Payload): Promise<Company[]> {
  return eachDoc((page) =>
    payload.find({
      collection: "companies",
      depth: 0,
      limit: 100,
      overrideAccess: true,
      page,
    })
  );
}

function relationId(value: Job["company"]): number | null {
  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    return value.id;
  }

  return null;
}

function text(value: string | null | undefined): string | null {
  return value ?? null;
}

function num(value: number | null | undefined): number | null {
  return value ?? null;
}

function storedCompanyKey(job: Job): string | null {
  const id = relationId(job.company);
  return id === null ? null : companyRelationKey(id);
}

function fieldsFromJob(job: Job): ComparableFields {
  return orderFields({
    applyEmail: text(job.applyEmail),
    applyMethod: text(job.applyMethod),
    applyUrl: text(job.applyUrl),
    careerLevel: job.careerLevel ?? [],
    categories: stringList(job.categories),
    companyKey: storedCompanyKey(job),
    countryCode: text(job.countryCode),
    employmentType: text(job.employmentType),
    languages: stringList(job.languages),
    locality: text(job.locality),
    locationDisplay: text(job.locationDisplay),
    publishedAt: iso(job.publishedAt),
    region: text(job.region),
    remoteRegion: text(job.remoteRegion),
    salaryCurrency: text(job.salaryCurrency),
    salaryMax: num(job.salaryMax),
    salaryMaxUsd: num(job.salaryMaxUsd),
    salaryMin: num(job.salaryMin),
    salaryMinUsd: num(job.salaryMinUsd),
    seniority: text(job.seniority),
    slug: job.slug,
    sourceListingUrl: text(job.sourceListingUrl),
    title: job.title,
    validThrough: iso(job.validThrough),
    visaSponsorship: text(job.visaSponsorship),
    workplaceType: text(job.workplaceType),
  });
}

function rowsFromJobs(jobs: Job[]): ExistingRow[] {
  return jobs.map((job) => ({
    bordfeedJobId: job.bordfeedJobId ?? null,
    fields: fieldsFromJob(job),
    hash: job.bordfeedDescriptionHash ?? null,
    id: String(job.id),
    origin: job.origin,
    slug: job.slug,
    status: job._status === "draft" ? "draft" : "published",
  }));
}

function clientFor(
  payload: Payload,
  record: ConnectionRecord,
  deps: SyncDeps | undefined,
  openKey: boolean
): BordfeedClient {
  if (deps?.client) {
    if (openKey) {
      const key = openApiKey(payload, record);
      if (key.length === 0) {
        throw new BordfeedApiError({
          code: "auth_failed",
          message: "Bordfeed rejected the API key.",
          status: 401,
        });
      }
    }

    return deps.client;
  }

  const apiKey =
    openKey || record.apiKeyEncrypted ? openApiKey(payload, record) : undefined;
  return createBordfeedClient({
    apiKey,
    baseUrl: resolveBordfeedBaseUrl(),
    clientHeaders: bordfeedClientHeaders(bordfulConfig),
    signal: deps?.signal,
  });
}

async function recordFailure(
  payload: Payload,
  error: unknown,
  now: Date
): Promise<void> {
  try {
    await dispatchConnectionEvent(
      payload,
      { error: toSafeError(error, now), type: "sync_failed" },
      now
    );
  } catch {
    // Callers still need the original sync failure when recording it is rejected.
  }
}

function asJobWrite(data: Record<string, unknown>): JobWrite {
  return data as JobWrite;
}

function createData(
  job: MappedJob,
  companyId: number | null
): Record<string, unknown> {
  return {
    _status: "published",
    applyEmail: job.applyEmail,
    applyMethod: job.applyMethod,
    applyUrl: job.applyUrl,
    bordfeedDescriptionHash: job.bordfeedDescriptionHash,
    bordfeedJobId: job.bordfeedJobId,
    careerLevel: job.careerLevel,
    categories: job.categories,
    company: companyId,
    companyName: job.company?.name ?? "Untitled company",
    countryCode: job.countryCode,
    description: job.description,
    employmentType: job.employmentType,
    languages: job.languages,
    locality: job.locality,
    locationDisplay: job.locationDisplay,
    origin: job.origin,
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
  };
}

interface CompanyIndex {
  byDomain: Map<string, Company>;
  byFeedId: Map<string, Company>;
  slugs: Set<string>;
}

function indexCompanies(companies: Company[]): CompanyIndex {
  const byFeedId = new Map<string, Company>();
  const byDomain = new Map<string, Company>();
  const slugs = new Set<string>();

  for (const company of companies) {
    slugs.add(company.slug);
    if (company.bordfeedCompanyId) {
      byFeedId.set(company.bordfeedCompanyId, company);
    }
    if (company.domain) {
      byDomain.set(company.domain, company);
    }
  }

  return { byDomain, byFeedId, slugs };
}

function uniqueSlug(index: CompanyIndex, company: MappedCompany): string {
  const { bordfeedCompanyId, name, slug: initial } = company;
  const suffix = (bordfeedCompanyId ?? name).slice(0, 8);
  let slug = initial;
  while (index.slugs.has(slug)) {
    slug = `${slug}-${suffix}`;
  }

  index.slugs.add(slug);
  return slug;
}

function knownCompany(
  index: CompanyIndex,
  company: MappedCompany
): Company | undefined {
  const existing = company.bordfeedCompanyId
    ? index.byFeedId.get(company.bordfeedCompanyId)
    : undefined;
  return (
    existing ??
    (company.domain ? index.byDomain.get(company.domain) : undefined)
  );
}

function sameText(
  left: string | null | undefined,
  right: string | null
): boolean {
  return (left ?? null) === right;
}

function companyPatch(
  found: Company,
  company: MappedCompany,
  index: CompanyIndex,
  origin: SyncOrigin
): Partial<Pick<Company, "domain" | "logoUrl" | "name" | "origin">> | null {
  const syncOwned =
    found.origin === "bordfeed" || found.origin === "bordfeed_sample";
  if (
    !syncOwned ||
    (origin === "bordfeed_sample" && found.origin === "bordfeed")
  ) {
    return null;
  }

  const data: Partial<Pick<Company, "domain" | "logoUrl" | "name" | "origin">> =
    {};
  if (found.name !== company.name) {
    data.name = company.name;
  }

  if (!sameText(found.logoUrl, company.logoUrl)) {
    data.logoUrl = company.logoUrl;
  }

  if (!sameText(found.domain, company.domain)) {
    const owner = company.domain
      ? index.byDomain.get(company.domain)
      : undefined;
    if (!(owner && owner.id !== found.id)) {
      data.domain = company.domain;
    }
  }

  if (origin === "bordfeed" && found.origin === "bordfeed_sample") {
    data.origin = "bordfeed";
  }

  return Object.keys(data).length > 0 ? data : null;
}

function rememberCompany(
  index: CompanyIndex,
  before: Company,
  after: Company
): void {
  if (before.domain && before.domain !== after.domain) {
    index.byDomain.delete(before.domain);
  }

  if (after.bordfeedCompanyId) {
    index.byFeedId.set(after.bordfeedCompanyId, after);
  }

  if (after.domain) {
    index.byDomain.set(after.domain, after);
  }
}

async function refreshCompanyJobs(
  payload: Payload,
  company: Company,
  patch: Partial<Pick<Company, "domain" | "name">>
): Promise<void> {
  if (patch.name === undefined && patch.domain === undefined) {
    return;
  }

  // companyName is owner text on manual and paid jobs. A company rename must not version those rows.
  await payload.update({
    collection: "jobs",
    data: {
      ...(patch.domain === undefined ? {} : { companyDomain: patch.domain }),
      ...(patch.name === undefined
        ? {}
        : { companyName: patch.name, companySlug: company.slug }),
    },
    depth: 0,
    overrideAccess: true,
    where: {
      and: [
        { company: { equals: company.id } },
        { origin: { in: ["bordfeed", "bordfeed_sample"] } },
      ],
    },
  });
}

async function reuseCompany(
  payload: Payload,
  found: Company,
  company: MappedCompany,
  index: CompanyIndex,
  origin: SyncOrigin
): Promise<Company> {
  const patch = companyPatch(found, company, index, origin);
  if (!patch) {
    return found;
  }

  const updated = await payload.update({
    collection: "companies",
    data: patch,
    depth: 0,
    id: found.id,
    overrideAccess: true,
  });
  rememberCompany(index, found, updated);
  await refreshCompanyJobs(payload, updated, patch);
  return updated;
}

async function ensureCompany(
  payload: Payload,
  job: MappedJob,
  index: CompanyIndex,
  ids: Map<string, number>,
  origin: SyncOrigin
): Promise<void> {
  const { company } = job;
  const key = companyKey(company);
  if (!(company && key) || ids.has(key)) {
    return;
  }

  const found = knownCompany(index, company);
  if (found) {
    const current = await reuseCompany(payload, found, company, index, origin);
    ids.set(key, current.id);
    return;
  }

  const created = await payload.create({
    collection: "companies",
    data: {
      bordfeedCompanyId: company.bordfeedCompanyId,
      domain: company.domain,
      logoUrl: company.logoUrl,
      name: company.name,
      origin,
      slug: uniqueSlug(index, company),
    },
    depth: 0,
    overrideAccess: true,
  });
  ids.set(key, created.id);
  if (company.bordfeedCompanyId) {
    index.byFeedId.set(company.bordfeedCompanyId, created);
  }
  if (created.domain) {
    index.byDomain.set(created.domain, created);
  }
}

async function upsertCompanies(
  payload: Payload,
  jobs: MappedJob[],
  companies: Company[],
  origin: SyncOrigin
): Promise<Map<string, number>> {
  const index = indexCompanies(companies);
  const ids = new Map<string, number>();
  await eachSerial(jobs, (job) =>
    ensureCompany(payload, job, index, ids, origin)
  );
  return ids;
}

function withoutIdentity(
  data: Record<string, unknown>,
  republish: boolean
): JobWrite {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "origin" || key === "bordfeedJobId" || key === "companyName") {
      continue;
    }

    if (key === "_status" && !republish) {
      continue;
    }

    next[key] = value;
  }

  return asJobWrite(next);
}

function companyIdFor(
  job: MappedJob,
  companyIds: Map<string, number>
): number | null {
  const key = companyKey(job.company);
  return key ? (companyIds.get(key) ?? null) : null;
}

async function updateJob(
  payload: Payload,
  change: SyncPlan["update"][number],
  companyIds: Map<string, number>
): Promise<void> {
  if (Object.keys(change.data).length === 0) {
    await payload.update({
      collection: "jobs",
      data: { _status: "published" },
      depth: 0,
      id: docId(change.id),
      overrideAccess: true,
    });
    return;
  }

  const job = change.data as MappedJob;
  await payload.update({
    collection: "jobs",
    data: withoutIdentity(
      createData(job, companyIdFor(job, companyIds)),
      change.republish
    ),
    depth: 0,
    id: docId(change.id),
    overrideAccess: true,
  });
}

async function applyPlan(
  payload: Payload,
  plan: SyncPlan,
  companyIds: Map<string, number>
): Promise<void> {
  await eachSerial(plan.deleteIds, async (id) => {
    await payload.delete({
      collection: "jobs",
      depth: 0,
      id: docId(id),
      overrideAccess: true,
    });
  });
  await eachSerial(plan.unpublish, async (id) => {
    await payload.update({
      collection: "jobs",
      data: { _status: "draft" },
      depth: 0,
      id: docId(id),
      overrideAccess: true,
    });
  });
  await eachSerial(plan.update, (change) =>
    updateJob(payload, change, companyIds)
  );
  await eachSerial(plan.create, async (job) => {
    await payload.create({
      collection: "jobs",
      data: asJobWrite(createData(job, companyIdFor(job, companyIds))),
      depth: 0,
      draft: false,
      overrideAccess: true,
    });
  });
}

async function deleteOrphanCompanies(
  payload: Payload,
  origin: SyncOrigin
): Promise<void> {
  const companies = await payload.find({
    collection: "companies",
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: { origin: { equals: origin } },
  });

  await eachSerial(companies.docs, async (company) => {
    const jobs = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { company: { equals: company.id } },
    });
    if (jobs.totalDocs > 0) {
      return;
    }

    await payload.delete({
      collection: "companies",
      depth: 0,
      id: company.id,
      overrideAccess: true,
    });
  });
}

interface SyncStamp {
  feedId: string | null;
  mode: "feed" | "sample";
}

function syncMode(record: ConnectionRecord): "feed" | "sample" {
  const feed =
    record.state === "connected" ||
    (record.state === "error" && record.previousState === "connected");
  return feed ? "feed" : "sample";
}

async function connectionStillMatches(
  payload: Payload,
  stamp: SyncStamp
): Promise<boolean> {
  const current = await readConnection(payload);
  return (
    syncMode(current) === stamp.mode &&
    (current.feedId ?? null) === stamp.feedId
  );
}

function idleSummary(
  mode: "feed" | "sample",
  pages: number,
  started: Date,
  deps: SyncDeps | undefined
): SyncSummary {
  return {
    created: 0,
    deletedSamples: 0,
    durationMs: clockOf(deps)().getTime() - started.getTime(),
    mode,
    pages,
    skipped: 0,
    unpublished: 0,
    updated: 0,
  };
}

function slugStillReserved(
  job: Job,
  mode: "feed" | "sample",
  incomingIds: ReadonlySet<string>
): boolean {
  if (job.origin !== "bordfeed_sample") {
    return true;
  }

  if (mode === "feed") {
    return false;
  }

  return Boolean(job.bordfeedJobId && incomingIds.has(job.bordfeedJobId));
}

function guardedSlugs(
  jobs: Job[],
  mode: "feed" | "sample",
  incomingIds: ReadonlySet<string>
): Set<string> {
  const slugs = new Set<string>();
  for (const job of jobs) {
    if (slugStillReserved(job, mode, incomingIds)) {
      slugs.add(job.slug);
    }
  }

  return slugs;
}

function emptyFeedWouldUnpublish(jobs: Job[], incomingCount: number): boolean {
  return (
    incomingCount === 0 &&
    jobs.some((job) => job.origin === "bordfeed" && job._status !== "draft")
  );
}

function emptySampleWouldDelete(jobs: Job[], incomingCount: number): boolean {
  return (
    incomingCount === 0 && jobs.some((job) => job.origin === "bordfeed_sample")
  );
}

async function runSync(
  payload: Payload,
  deps: SyncDeps | undefined,
  mode: "feed" | "sample",
  incomingJobs: BordfeedJob[],
  pages: number,
  origin: SyncOrigin,
  stamp: SyncStamp
): Promise<SyncSummary> {
  const started = clockOf(deps)();
  const jobs = incomingJobs.map((job) => mapBordfeedJob(job, origin));
  const [existingJobs, companies] = await Promise.all([
    loadJobs(payload),
    loadCompanies(payload),
  ]);

  // A connect or reset can land while the feed is downloading.
  if (!(await connectionStillMatches(payload, stamp))) {
    return idleSummary(mode, pages, started, deps);
  }

  if (
    (mode === "feed" &&
      emptyFeedWouldUnpublish(existingJobs, incomingJobs.length)) ||
    (mode === "sample" &&
      emptySampleWouldDelete(existingJobs, incomingJobs.length))
  ) {
    throw new SyncGuardError();
  }

  const companyIds = await upsertCompanies(payload, jobs, companies, origin);
  if (!(await connectionStillMatches(payload, stamp))) {
    return idleSummary(mode, pages, started, deps);
  }

  const incomingIds = new Set(jobs.map((job) => job.bordfeedJobId));
  const existing = rowsFromJobs(existingJobs);
  const plan = planSync({
    companyIds,
    existing,
    incoming: jobs,
    mode,
    takenSlugs: guardedSlugs(existingJobs, mode, incomingIds),
  });
  await applyPlan(payload, plan, companyIds);
  await deleteOrphanCompanies(payload, "bordfeed_sample");

  const deletedSamples = plan.deleteIds.filter((id) =>
    existing.some((row) => row.id === id && row.origin === "bordfeed_sample")
  ).length;
  const summary: SyncSummary = {
    created: plan.create.length,
    deletedSamples,
    durationMs: clockOf(deps)().getTime() - started.getTime(),
    mode,
    pages,
    skipped: plan.skipped,
    unpublished: plan.unpublish.length,
    updated: plan.update.length,
  };
  await dispatchConnectionEvent(
    payload,
    { at: clockOf(deps)().toISOString(), summary, type: "sync_succeeded" },
    clockOf(deps)()
  );
  return summary;
}

async function guarded(
  payload: Payload,
  deps: SyncDeps | undefined,
  run: () => Promise<SyncSummary>
): Promise<SyncSummary> {
  try {
    if (deps?.signal?.aborted) {
      throw new BordfeedApiError({
        code: "network",
        message: "Could not reach Bordfeed.",
        status: 0,
      });
    }

    return await run();
  } catch (error) {
    await recordFailure(payload, error, clockOf(deps)());
    throw error;
  }
}

export function runSampleSync(
  payload: Payload,
  deps?: SyncDeps
): Promise<SyncSummary> {
  return guarded(payload, deps, async () => {
    const record = await readConnection(payload);
    const client = await clientFor(payload, record, deps, false);
    const preview = await client.previewTemplate(
      record.templateId,
      previewQuerySchema.parse({ limit: 20 })
    );
    return runSync(
      payload,
      deps,
      "sample",
      preview.data,
      1,
      "bordfeed_sample",
      { feedId: record.feedId, mode: "sample" }
    );
  });
}

export function runFeedSync(
  payload: Payload,
  deps?: SyncDeps
): Promise<SyncSummary> {
  return guarded(payload, deps, async () => {
    const record = await readConnection(payload);
    if (!record.feedId) {
      throw new BordfeedApiError({
        code: "not_found",
        message: "Bordfeed could not find this template or feed.",
        status: 404,
      });
    }

    const client = await clientFor(payload, record, deps, true);
    const incoming: BordfeedJob[] = [];
    let pages = 0;
    for await (const page of client.listFeedJobs(record.feedId)) {
      pages += 1;
      incoming.push(...page);
    }

    return runSync(payload, deps, "feed", incoming, pages, "bordfeed", {
      feedId: record.feedId,
      mode: "feed",
    });
  });
}

export async function runBordfeedSync(
  payload: Payload,
  deps?: SyncDeps
): Promise<SyncSummary> {
  const record = await readConnection(payload);
  return syncMode(record) === "feed"
    ? runFeedSync(payload, deps)
    : runSampleSync(payload, deps);
}
