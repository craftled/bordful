import type { Payload, Where } from "payload";
import { bordfulConfig } from "@/config";
import type { Company, Job } from "@/payload-types";
import { resolveBordfeedBaseUrl } from "./base-url";
import { isBlocked } from "./blocklist";
import { blockableFromMapped, readBlocklist } from "./blocklist-store";
import { type BordfeedClient, createBordfeedClient } from "./client";
import { bordfeedClientHeaders } from "./client-header";
import { type ConnectionRecord, holdsConnection } from "./connection-machine";
import { dispatchConnectionEvent, readConnection } from "./connection-store";
import { eachDoc, eachSerial } from "./each";
import {
  BordfeedApiError,
  MASS_REMOVAL_MESSAGE,
  MASS_REMOVAL_PENDING_MESSAGE,
  MAX_INCIDENT_REMOVALS_PER_SYNC,
  massRemovalFloorMessage,
  SyncGuardError,
  toSafeError,
} from "./errors";
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
import {
  acquireSyncLease,
  afterAdditions,
  afterFirst,
  type FetchPlan,
  planFetch,
  type RemovalHold,
  readSyncBudget,
  recordSpend,
  releaseSyncLease,
  type SeriesPosition,
  type SyncState,
  writeSyncState,
} from "./sync-budget";

type JobWrite = Omit<
  Job,
  "collection" | "createdAt" | "deletedAt" | "id" | "updatedAt"
>;

export interface SyncDeps {
  client?: BordfeedClient;
  // Gap between Bordfeed requests. Tests set 0; the default suits live
  // rate limits.
  minIntervalMs?: number;
  now?: () => Date;
  signal?: AbortSignal;
}

export interface SyncSummary {
  // Board jobs this sync looked up by id to see whether they are still
  // active. Free: the workspace already received them.
  checkedJobs: number;
  created: number;
  deletedSamples: number;
  durationMs: number;
  // first: one capped page. delta: changed jobs only. capped: daily cap
  // used up. busy: another sync was running. Nothing is fetched for either.
  fetch: "busy" | "capped" | "delta" | "first" | "sample";
  // Jobs this sync fetched from the feed. Bordfeed bills at most one credit
  // each, only for jobs the workspace never received before. Samples are free.
  fetchedJobs: number;
  mode: "feed" | "sample";
  pages: number;
  skipped: number;
  unpublished: number;
  updated: number;
}

interface SyncInput {
  checkedJobs?: number;
  fetch: SyncSummary["fetch"];
  fetchedJobs: number;
  incoming: BordfeedJob[];
  pages: number;
  // Bordfeed ids no longer active, to unpublish.
  removedIds?: ReadonlySet<string>;
}

type SyncOrigin = "bordfeed" | "bordfeed_sample";

function clockOf(deps?: SyncDeps): () => Date {
  return deps?.now ?? (() => new Date());
}

const NUMERIC_ID = /^\d+$/u;

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
    skills: stringList(job.skills),
    slug: job.slug,
    sourceListingUrl: text(job.sourceListingUrl),
    summary: text(job.summary),
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
    minIntervalMs: deps?.minIntervalMs,
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
    skills: job.skills,
    slug: job.slug,
    sourceListingUrl: job.sourceListingUrl,
    summary: job.summary,
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
  return holdsConnection(record) ? "feed" : "sample";
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
  input: SyncInput,
  started: Date,
  deps: SyncDeps | undefined
): SyncSummary {
  return {
    checkedJobs: input.checkedJobs ?? 0,
    created: 0,
    deletedSamples: 0,
    durationMs: clockOf(deps)().getTime() - started.getTime(),
    fetch: input.fetch,
    fetchedJobs: input.fetchedJobs,
    mode,
    pages: input.pages,
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

// An empty first feed would delete the samples and leave a blank board.
function emptyFeedWouldUnpublish(jobs: Job[], incomingCount: number): boolean {
  return (
    incomingCount === 0 &&
    jobs.some(
      (job) =>
        job.origin === "bordfeed_sample" ||
        (job.origin === "bordfeed" && job._status !== "draft")
    )
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
  input: SyncInput,
  origin: SyncOrigin,
  stamp: SyncStamp
): Promise<SyncSummary> {
  const started = clockOf(deps)();
  const incomingJobs = input.incoming;
  const delta = input.fetch === "delta";
  const mapped = incomingJobs.map((job) => mapBordfeedJob(job, origin));
  const [existingJobs, companies, blocklist] = await Promise.all([
    loadJobs(payload),
    loadCompanies(payload),
    readBlocklist(payload),
  ]);
  // Blocked jobs are dropped before companies are upserted, so a blocked
  // company never gets a page.
  const blockedIds = new Set<string>();
  const jobs = mapped.filter((job) => {
    if (isBlocked(blockableFromMapped(job), blocklist)) {
      blockedIds.add(job.bordfeedJobId);
      return false;
    }
    return true;
  });

  // A connect or reset can land while the feed is downloading.
  if (!(await connectionStillMatches(payload, stamp))) {
    return idleSummary(mode, input, started, deps);
  }

  // A delta sync with nothing new is normal, not an empty feed.
  if (
    (mode === "feed" &&
      !delta &&
      emptyFeedWouldUnpublish(existingJobs, incomingJobs.length)) ||
    (mode === "sample" &&
      emptySampleWouldDelete(existingJobs, incomingJobs.length))
  ) {
    throw new SyncGuardError();
  }

  const companyIds = await upsertCompanies(payload, jobs, companies, origin);
  if (!(await connectionStillMatches(payload, stamp))) {
    return idleSummary(mode, input, started, deps);
  }

  const incomingIds = new Set(jobs.map((job) => job.bordfeedJobId));
  const existing = rowsFromJobs(existingJobs);
  const plan = planSync({
    blockedIds,
    companyIds,
    existing,
    incoming: jobs,
    mode,
    removedIds: input.removedIds,
    takenSlugs: guardedSlugs(existingJobs, mode, incomingIds),
  });
  await applyPlan(payload, plan, companyIds);
  await deleteOrphanCompanies(payload, "bordfeed_sample");

  const deletedSamples = plan.deleteIds.filter((id) =>
    existing.some((row) => row.id === id && row.origin === "bordfeed_sample")
  ).length;
  const summary: SyncSummary = {
    checkedJobs: input.checkedJobs ?? 0,
    created: plan.create.length,
    deletedSamples,
    durationMs: clockOf(deps)().getTime() - started.getTime(),
    fetch: input.fetch,
    fetchedJobs: input.fetchedJobs,
    mode,
    pages: input.pages,
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
      { fetch: "sample", fetchedJobs: 0, incoming: preview.data, pages: 1 },
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
    return leasedSync(payload, deps, client, record.feedId);
  });
}

// Nothing was fetched: the daily cap is used up or another sync holds the
// lease. The connection state and last sync are left as they are.
function skippedSummary(
  fetch: "busy" | "capped",
  deps: SyncDeps | undefined
): SyncSummary {
  return idleSummary(
    "feed",
    { fetch, fetchedJobs: 0, incoming: [], pages: 0 },
    clockOf(deps)(),
    deps
  );
}

interface SeriesRead {
  budget: number;
  // Set when a request failed after earlier pages landed.
  error?: unknown;
  pages: number;
  position: SeriesPosition | null;
  state: SyncState;
  updated: BordfeedJob[];
}

type SaveState = (state: SyncState) => Promise<void>;

// Offset pages shift when a job leaves a search feed mid-series, so a resumed
// offset steps back a little. Re-sent jobs are free.
const OFFSET_OVERLAP = 10;

function requestOffset(offset: number | null, budget: number): number | null {
  if (offset === null || budget < OFFSET_OVERLAP * 2) {
    return offset;
  }

  return Math.max(0, offset - OFFSET_OVERLAP);
}

// Reads new jobs from `position`. Each request asks for what is left of the
// budget. It stops when the budget is spent; the returned position is where
// the next sync resumes (null once the series is read). Usage is saved as
// soon as Bordfeed answers. A failure after earlier pages keeps those pages
// and their position.
async function readSeries(
  client: BordfeedClient,
  feedId: string,
  since: string,
  position: SeriesPosition,
  read: SeriesRead,
  context: TimedContext
): Promise<SeriesRead> {
  const late = read.pages > 0 && context.now().getTime() >= context.deadline;
  if (read.budget <= 0 || late) {
    return { ...read, position };
  }

  let page: Awaited<ReturnType<BordfeedClient["fetchFeedPage"]>>;
  try {
    page = await client.fetchFeedPage(feedId, {
      cursor: position.cursor,
      limit: read.budget,
      offset: requestOffset(position.offset, read.budget),
      since,
      sinceField: "first_visible",
    });
  } catch (error) {
    if (read.pages === 0) {
      throw error;
    }
    return { ...read, error, position };
  }

  const more = Boolean(page.nextCursor || page.nextOffset);
  const next: SeriesRead = {
    ...read,
    budget: read.budget - page.data.length,
    pages: read.pages + 1,
    position: more
      ? {
          cursor: page.nextCursor,
          offset: page.nextCursor ? null : page.nextOffset,
        }
      : null,
    state: recordSpend(read.state, page.data.length, context.startedAt),
    updated: [...read.updated, ...page.data],
  };
  // A failed save keeps the page and its usage, so the final save still
  // counts what Bordfeed billed.
  try {
    await context.save(next.state);
  } catch (error) {
    return { ...next, error };
  }

  if (!next.position) {
    return next;
  }
  return readSeries(client, feedId, since, next.position, next, context);
}

interface CheckRun {
  // Credits Bordfeed billed for checks. Normally 0: see checkBoardJobs.
  charged: number;
  checkAfter: string | null;
  checked: number;
  error?: unknown;
  removedIds: Set<string>;
  // Last per-job failure that was skipped past.
  skipError?: unknown;
  state: SyncState;
}

// Published Bordfeed jobs on the board, by Bordfeed id, after `after`.
async function boardJobIds(
  payload: Payload,
  after: string | null,
  limit: number
): Promise<string[]> {
  if (limit <= 0) {
    return [];
  }

  const where: Where[] = [
    { origin: { equals: "bordfeed" } },
    { _status: { equals: "published" } },
    { bordfeedJobId: { exists: true } },
  ];
  if (after) {
    where.push({ bordfeedJobId: { greater_than: after } });
  }
  const result = await payload.find({
    collection: "jobs",
    depth: 0,
    limit,
    overrideAccess: true,
    pagination: false,
    select: { bordfeedJobId: true },
    sort: "bordfeedJobId",
    where: { and: where },
  });
  return result.docs.flatMap((doc) =>
    typeof doc.bordfeedJobId === "string" && doc.bordfeedJobId.length > 0
      ? [doc.bordfeedJobId]
      : []
  );
}

// The next `count` board jobs after `after`, wrapping to the start once.
async function nextBoardJobs(
  payload: Payload,
  after: string | null,
  count: number
): Promise<string[]> {
  const tail = await boardJobIds(payload, after, count);
  if (after === null || tail.length >= count) {
    return tail;
  }

  const head = await boardJobIds(payload, null, count - tail.length);
  return [...tail, ...head.filter((id) => id <= after)];
}

// Work stops at `deadline`, so the whole sync fits in the cron's 300 s.
interface TimedContext {
  deadline: number;
  now: () => Date;
  save: SaveState;
  startedAt: Date;
}

// Checks spend at most this long per sync, and the feed read stops paging
// at the second mark. The board write gets the rest of the 300 s.
const CHECK_TIME_MS = 120_000;
const READ_TIME_MS = 210_000;

// One job whose lookup keeps failing must not stop every later check.
function skippable(error: unknown): boolean {
  return (
    error instanceof BordfeedApiError &&
    (error.code === "invalid_response" || error.status >= 500)
  );
}

async function checkEach(
  client: BordfeedClient,
  ids: string[],
  run: CheckRun,
  context: TimedContext
): Promise<CheckRun> {
  const [id, ...rest] = ids;
  if (id === undefined || context.now().getTime() >= context.deadline) {
    return run;
  }

  let result: Awaited<ReturnType<BordfeedClient["checkJob"]>>;
  try {
    result = await client.checkJob(id);
  } catch (error) {
    if (skippable(error)) {
      const skipped = { ...run, checkAfter: id, skipError: error };
      return checkEach(client, rest, skipped, context);
    }
    return { ...run, error };
  }

  const next: CheckRun = { ...run, checkAfter: id, checked: run.checked + 1 };
  if (result.status === "gone") {
    next.removedIds = new Set([...run.removedIds, id]);
    return checkEach(client, rest, next, context);
  }

  const charged = result.charged ?? 0;
  if (charged <= 0) {
    return checkEach(client, rest, next, context);
  }

  // A board job this workspace was never billed for, such as one fetched
  // under an earlier workspace. Count the credit and stop checking, so
  // checks can never spend more than one credit per sync.
  next.charged = run.charged + charged;
  next.state = recordSpend(run.state, charged, context.startedAt);
  try {
    await context.save(next.state);
  } catch (error) {
    return { ...next, error };
  }
  return next;
}

// A Bordfeed incident shows nearly every checked job gone. Normal churn
// stays far below 80%: closures per sync match jobs added per sync, at
// most jobsPerSync (100) against up to 200 checks.
function looksLikeIncident(run: CheckRun): boolean {
  const gone = run.removedIds.size;
  return (
    (run.checked >= 10 && gone * 5 >= run.checked * 4) ||
    (run.checked >= 5 && gone === run.checked)
  );
}

// A sustained Bordfeed incident must not silently mass-unpublish. The first
// incident opens a hold with confirmations 0 and the gone ids. Each later
// recheck of that same slice, at least REMOVAL_HOLD_MS after hold.at, adds
// one confirmation and keeps only ids still gone. After
// MASS_REMOVAL_CONFIRMATIONS the slice stays held unless
// BORDFEED_ALLOW_MASS_UNPUBLISH=1. With that set, one sync unpublishes at
// most MAX_INCIDENT_REMOVALS_PER_SYNC of the confirmed ids. Other slices
// keep rotating while a hold is open. Churn below the incident line is
// unchanged and is not capped here.
export const REMOVAL_HOLD_MS = 12 * 60 * 60 * 1000;
const MASS_REMOVAL_CONFIRMATIONS = 2;

function sortedIds(ids: Iterable<string>): string[] {
  return [...ids].sort();
}

function intersectGone(held: string[], gone: ReadonlySet<string>): string[] {
  return held.filter((id) => gone.has(id));
}

function massUnpublishAllowed(): boolean {
  return process.env.BORDFEED_ALLOW_MASS_UNPUBLISH === "1";
}

function holdIsDue(hold: RemovalHold, startedAt: Date): boolean {
  return startedAt.getTime() - Date.parse(hold.at) >= REMOVAL_HOLD_MS;
}

function shouldRecheckHold(hold: RemovalHold | null, startedAt: Date): boolean {
  if (hold === null) {
    return false;
  }
  if (holdIsDue(hold, startedAt)) {
    return true;
  }
  return (
    hold.confirmations >= MASS_REMOVAL_CONFIRMATIONS && massUnpublishAllowed()
  );
}

function holdWithoutRelease(
  run: CheckRun,
  resumeCheckAfter: string | null,
  nextHold: RemovalHold,
  message: string
): CheckRun {
  return {
    ...run,
    // Keep the rotating cursor moving. A recheck of a held slice must not
    // rewind state.checkAfter back to that older window.
    checkAfter: resumeCheckAfter,
    error: run.error ?? new SyncGuardError(message),
    removedIds: new Set(),
    state: { ...run.state, removalHold: nextHold },
  };
}

function releaseConfirmed(
  run: CheckRun,
  resumeCheckAfter: string | null,
  hold: RemovalHold,
  confirmed: string[]
): CheckRun {
  const release = confirmed.slice(0, MAX_INCIDENT_REMOVALS_PER_SYNC);
  const remaining = confirmed.slice(MAX_INCIDENT_REMOVALS_PER_SYNC);
  if (remaining.length === 0) {
    return {
      ...run,
      checkAfter: resumeCheckAfter,
      removedIds: new Set(release),
      state: { ...run.state, removalHold: null },
    };
  }

  return {
    ...run,
    checkAfter: resumeCheckAfter,
    error:
      run.error ??
      new SyncGuardError(
        massRemovalFloorMessage(MAX_INCIDENT_REMOVALS_PER_SYNC)
      ),
    removedIds: new Set(release),
    state: {
      ...run.state,
      removalHold: { ...hold, ids: remaining },
    },
  };
}

function guardMassRemoval(
  run: CheckRun,
  sliceAfter: string | null,
  resumeCheckAfter: string | null,
  startedAt: Date
): CheckRun {
  const hold = run.state.removalHold;

  if (!looksLikeIncident(run)) {
    // A scheduled recheck that no longer looks like an incident clears the
    // hold. Removals in this run are normal churn.
    if (hold !== null && hold.after === sliceAfter) {
      return {
        ...run,
        checkAfter: resumeCheckAfter,
        state: { ...run.state, removalHold: null },
      };
    }
    return { ...run, state: { ...run.state, removalHold: hold } };
  }

  const goneIds = sortedIds(run.removedIds);

  // A new incident while another hold is open: block this slice's removals
  // but leave the existing hold and the rotating cursor alone.
  if (hold !== null && hold.after !== sliceAfter) {
    return holdWithoutRelease(
      run,
      resumeCheckAfter,
      hold,
      MASS_REMOVAL_MESSAGE
    );
  }

  if (hold === null) {
    return holdWithoutRelease(
      run,
      // First sighting advances past this slice like a normal check.
      run.checkAfter,
      {
        after: sliceAfter,
        at: startedAt.toISOString(),
        confirmations: 0,
        ids: goneIds,
      },
      MASS_REMOVAL_MESSAGE
    );
  }

  const stillGone = intersectGone(hold.ids, run.removedIds);
  if (stillGone.length === 0) {
    return holdWithoutRelease(
      run,
      resumeCheckAfter,
      {
        after: sliceAfter,
        at: startedAt.toISOString(),
        confirmations: 0,
        ids: goneIds,
      },
      MASS_REMOVAL_MESSAGE
    );
  }

  const due = holdIsDue(hold, startedAt);
  const nextHold: RemovalHold = {
    after: hold.after,
    at: due ? startedAt.toISOString() : hold.at,
    confirmations: hold.confirmations + (due ? 1 : 0),
    ids: stillGone,
  };

  const ready =
    nextHold.confirmations >= MASS_REMOVAL_CONFIRMATIONS &&
    massUnpublishAllowed();
  if (ready) {
    return releaseConfirmed(run, resumeCheckAfter, nextHold, stillGone);
  }

  const pending = nextHold.confirmations >= MASS_REMOVAL_CONFIRMATIONS;
  return holdWithoutRelease(
    run,
    resumeCheckAfter,
    nextHold,
    pending ? MASS_REMOVAL_PENDING_MESSAGE : MASS_REMOVAL_MESSAGE
  );
}

// A run where every lookup failed and was skipped reports the failure.
function withSkipError(run: CheckRun): CheckRun {
  if (run.error !== undefined || run.checked > 0 || !run.skipError) {
    return run;
  }
  return { ...run, error: run.skipError };
}

// Looks up the next slice of the board's published Bordfeed jobs by id and
// collects the ones Bordfeed no longer shows. Bordfeed answers 404 for a job
// that is not active before any charge, and a job the workspace already
// received is free, so a check costs nothing.
async function checkBoardJobs(
  payload: Payload,
  client: BordfeedClient,
  plan: Extract<FetchPlan, { kind: "delta" }>,
  state: SyncState,
  context: TimedContext
): Promise<CheckRun> {
  const hold = state.removalHold;
  const recheck = shouldRecheckHold(hold, context.startedAt);
  const sliceAfter = recheck && hold !== null ? hold.after : plan.checkAfter;
  // When rechecking a held slice, keep the saved rotating cursor so the
  // rest of the board keeps getting checked on later syncs.
  const resumeCheckAfter = recheck ? plan.checkAfter : null;
  const ids = await nextBoardJobs(payload, sliceAfter, plan.checks);
  const run = await checkEach(
    client,
    ids,
    {
      charged: 0,
      checkAfter: sliceAfter,
      checked: 0,
      removedIds: new Set(),
      state,
    },
    context
  );
  return guardMassRemoval(
    withSkipError(run),
    sliceAfter,
    resumeCheckAfter ?? run.checkAfter,
    context.startedAt
  );
}

async function firstSync(
  payload: Payload,
  deps: SyncDeps | undefined,
  client: BordfeedClient,
  feedId: string,
  budget: { limit: number; save: SaveState; state: SyncState },
  startedAt: Date
): Promise<SyncSummary> {
  const stamp: SyncStamp = { feedId, mode: "feed" };
  const page = await client.fetchFeedPage(feedId, { limit: budget.limit });
  const state = recordSpend(budget.state, page.data.length, startedAt);
  await budget.save(state);
  const summary = await runSync(
    payload,
    deps,
    "feed",
    {
      fetch: "first",
      fetchedJobs: page.data.length,
      incoming: page.data,
      pages: 1,
    },
    "bordfeed",
    stamp
  );
  // A reset or reconnect mid-sync discards the page, so `since` stays.
  if (await connectionStillMatches(payload, stamp)) {
    await budget.save(afterFirst(state, startedAt));
  }
  return summary;
}

// Every sync fetches at most `jobsPerSync` jobs and never more than is left
// of `jobsPerDay`. The first sync reads one page of the newest jobs. Later
// syncs check a slice of the board's jobs by id (free) and read only jobs
// new to the feed since the last finished series.
async function syncFeedWithBudget(
  payload: Payload,
  deps: SyncDeps | undefined,
  client: BordfeedClient,
  feedId: string,
  save: SaveState
): Promise<SyncSummary> {
  const startedAt = clockOf(deps)();
  const stamp: SyncStamp = { feedId, mode: "feed" };
  const budget = await readSyncBudget(payload, feedId);
  const plan = planFetch(budget.state, budget.limits, startedAt);
  if (plan.kind === "skip") {
    return skippedSummary("capped", deps);
  }

  if (plan.kind === "first") {
    return firstSync(
      payload,
      deps,
      client,
      feedId,
      { limit: plan.limit, save, state: budget.state },
      startedAt
    );
  }

  const timed = { now: clockOf(deps), save, startedAt };
  const checks = await checkBoardJobs(payload, client, plan, budget.state, {
    ...timed,
    deadline: startedAt.getTime() + CHECK_TIME_MS,
  });
  const additions = await readAdditions(client, feedId, plan, checks, {
    ...timed,
    deadline: startedAt.getTime() + READ_TIME_MS,
  });
  const state = additions.read?.state ?? checks.state;
  const summary = await runSync(
    payload,
    deps,
    "feed",
    {
      checkedJobs: checks.checked,
      fetch: "delta",
      fetchedJobs: additions.read ? additions.read.updated.length : 0,
      incoming: additions.read?.updated ?? [],
      pages: additions.read?.pages ?? 0,
      removedIds: checks.removedIds,
    },
    "bordfeed",
    stamp
  );
  if (await connectionStillMatches(payload, stamp)) {
    await save({
      ...state,
      additions: additions.read
        ? afterAdditions(
            state.additions,
            plan.additions,
            additions.read.position
          )
        : state.additions,
      checkAfter: checks.checkAfter,
    });
  }
  const failure = checks.error ?? additions.error;
  if (failure !== undefined) {
    throw failure;
  }
  return summary;
}

// New jobs get the sync's budget, less any credit a check was billed. They
// do not depend on the checks, so a failed check never holds them back. A
// failure here still lets the checks already made be applied.
async function readAdditions(
  client: BordfeedClient,
  feedId: string,
  plan: Extract<FetchPlan, { kind: "delta" }>,
  checks: CheckRun,
  context: TimedContext
): Promise<{ error?: unknown; read: SeriesRead | null }> {
  try {
    const read = await readSeries(
      client,
      feedId,
      plan.additions.since,
      plan.additions.position,
      {
        budget: plan.limit - checks.charged,
        pages: 0,
        position: null,
        state: checks.state,
        updated: [],
      },
      context
    );
    return { error: read.error, read };
  } catch (error) {
    return { error, read: null };
  }
}

async function leasedSync(
  payload: Payload,
  deps: SyncDeps | undefined,
  client: BordfeedClient,
  feedId: string
): Promise<SyncSummary> {
  const token = await acquireSyncLease(payload, clockOf(deps)());
  if (!token) {
    return skippedSummary("busy", deps);
  }

  try {
    return await syncFeedWithBudget(payload, deps, client, feedId, (state) =>
      writeSyncState(payload, token, state)
    );
  } finally {
    await releaseSyncLease(payload, token);
  }
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
