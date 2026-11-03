import {
  registerRequestSchema,
  verifyRequestSchema,
} from "../../src/lib/bordfeed/register-schema";

import { buildMockJob, type MockJob } from "./job-shape";

export const MOCK_API_KEY = ["bf_mock_key", "0000000000000001"].join("_");
export const MOCK_FEED_ID = "11111111-1111-4111-8111-111111111111";
const TOPUP_URL = "https://bordfeed.com/topup/mock";

const TEMPLATES = [
  {
    category: "general",
    description: "Remote roles in every job category and location",
    filters: { workplace_type: ["Remote"] },
    id: "fully-remote",
    name: "Fully Remote",
  },
  {
    category: "engineering",
    description: "Fake engineering roles.",
    filters: {},
    id: "engineering-it",
    name: "Engineering and IT",
  },
  {
    category: "engineering",
    description: "Fake remote engineering roles.",
    filters: {},
    id: "remote-engineering",
    name: "Remote engineering",
  },
] as const;

const PREVIEW_PARAMS = new Set([
  "category",
  "country_code",
  "limit",
  "workplace_type",
]);
const ISO2 = /^[A-Z]{2}$/u;
const DIGITS = /^\d+$/u;
const PREVIEW_PATH = /^\/api\/v1\/templates\/(?<templateId>[^/]+)\/preview$/u;
const FEED_JOBS_PATH = /^\/api\/v1\/feeds\/[^/]+\/jobs$/u;
const JOB_PATH = /^\/api\/v1\/jobs\/(?<jobId>[^/]+)$/u;

const WORKPLACES = new Set(["Remote", "Hybrid", "On-site"]);
// Default page when no limit is sent. Live caps limit at 100.
const FEED_PAGE = 10;
const FEED_LIMIT_MAX = 100;
const FEED_TOTAL = 25;
const FEED_BASE_UPDATED_AT = Date.parse("2026-01-15T12:00:00.000Z");
const CURSOR = /^c(?<offset>\d+)$/u;
const PREVIEW_TOTAL = 20;
const STARTING_CREDITS = 2000;
const CODE_TTL_SECONDS = 600;

export interface BordfeedRequestLog {
  authorization: string | null;
  body: unknown;
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  "x-bordfeed-client": string | null;
}

interface Registration {
  boardName: string | null;
  email: string;
  id: string;
  templateId: string | null;
  verified: boolean;
  workspace: string | null;
}

export interface BordfeedMockState {
  // Like live: one credit per job the first time this workspace receives it.
  // A job sent again, even after it changed or closed, is free.
  billedJobs: number;
  // Single-job lookups (GET /api/v1/jobs/{id}), any outcome.
  checkedJobs: number;
  requests: BordfeedRequestLog[];
  // Every job a feed read returned, billed or not.
  servedJobs: number;
}

export interface BordfeedMockOptions {
  feedTotal?: number;
  now?: () => number;
}

export interface BordfeedMock {
  balance: () => number;
  // Marks feed jobs (1-based) closed and updated now.
  closeFeedJobs: (indexes: number[]) => void;
  // Marks feed jobs (1-based) expired and updated now.
  expireFeedJobs: (indexes: number[]) => void;
  handle: (request: Request) => Promise<Response>;
  reset: () => void;
  state: BordfeedMockState;
  // Marks feed jobs (1-based) as first visible now, like new jobs.
  surfaceFeedJobs: (indexes: number[]) => void;
  // Marks feed jobs (1-based) updated now. Live bumps updated_at on routine
  // scrape writes too, so this is not a content change.
  touchFeedJobs: (indexes: number[]) => void;
}

interface FeedMeta {
  firstVisibleAt: number;
  status: "active" | "closed" | "expired";
  updatedAt: number;
}

interface PreviewFilters {
  category: string[];
  country_code: string[];
  limit: number;
  workplace_type: string[];
}

// Live names the workspace from the email local part when board_name is absent.
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local.split("+")[0]?.trim() || "user";
}

function requestId(sequence: number): string {
  return `req_mock_${String(sequence).padStart(4, "0")}`;
}

// Live registration ids are UUIDs, and verify rejects anything else.
function registrationId(sequence: number): string {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function queryRecord(url: URL): Record<string, string | string[]> {
  const grouped = new Map<string, string[]>();
  for (const [key, value] of url.searchParams) {
    const list = grouped.get(key) ?? [];
    list.push(value);
    grouped.set(key, list);
  }

  const query: Record<string, string | string[]> = {};
  for (const [key, values] of grouped) {
    const [only] = values;
    query[key] = values.length === 1 && only !== undefined ? only : values;
  }

  return query;
}

function redactAuthorization(header: string | null): string | null {
  if (header === null || header.length === 0) {
    return null;
  }

  if (header.toLowerCase().startsWith("bearer ")) {
    return "Bearer ***";
  }

  return "***";
}

async function readBody(request: Request): Promise<unknown> {
  if (request.method === "GET" || request.method === "HEAD") {
    return null;
  }

  const text = await request.text();
  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function envelope(
  status: number,
  code: string,
  message: string,
  sequence: number,
  extra?: Record<string, unknown>,
  headers?: HeadersInit
): Response {
  return Response.json(
    {
      docs_url: "https://bordfeed.com/docs/errors",
      error: { code, message, ...extra },
      request_id: requestId(sequence),
    },
    { headers, status }
  );
}

function invalidRequest(message: string): Response {
  return Response.json(
    { error: { code: "invalid_request", message } },
    { status: 400 }
  );
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header === null || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

function previewJobs(): MockJob[] {
  const jobs: MockJob[] = [];
  for (let index = 1; index <= PREVIEW_TOTAL; index += 1) {
    const title = `Sample Platform Engineer ${String(index).padStart(2, "0")}`;
    jobs.push(
      buildMockJob({
        descriptionHtml: null,
        index,
        title,
      })
    );
  }

  return jobs;
}

function feedJobs(total: number): MockJob[] {
  const jobs: MockJob[] = [];
  const feedCountries = ["US", "DE", "GB"] as const;
  for (let index = 1; index <= total; index += 1) {
    const title = `Mock Feed Engineer ${String(index).padStart(2, "0")}`;
    jobs.push(
      buildMockJob({
        countryCode: feedCountries[(index - 1) % feedCountries.length],
        descriptionHtml: null,
        employmentType: index % 2 === 0 ? "Contract" : "Full-time",
        idGroup: 4,
        index,
        title,
        workplaceType: index % 2 === 0 ? "Hybrid" : "Remote",
      })
    );
  }

  return jobs;
}

function withDescriptionHtml(jobs: MockJob[], include: boolean): MockJob[] {
  if (!include) {
    return jobs;
  }

  return jobs.map((job) => ({
    ...job,
    description_html: `<p>${String(job.title)}</p>`,
  }));
}

function parsePreview(
  url: URL
): { ok: true; query: PreviewFilters } | { message: string; ok: false } {
  for (const key of url.searchParams.keys()) {
    if (!PREVIEW_PARAMS.has(key)) {
      return { message: `Unknown parameter: ${key}`, ok: false };
    }
  }

  const category = url.searchParams.getAll("category");
  const workplaceType = url.searchParams.getAll("workplace_type");
  const countryCode = url.searchParams.getAll("country_code");
  if (category.length > 3) {
    return { message: "category accepts at most 3 values", ok: false };
  }
  if (workplaceType.length > 3) {
    return { message: "workplace_type accepts at most 3 values", ok: false };
  }
  if (countryCode.length > 5) {
    return { message: "country_code accepts at most 5 values", ok: false };
  }

  for (const value of workplaceType) {
    if (!WORKPLACES.has(value)) {
      return { message: "Unknown workplace_type", ok: false };
    }
  }

  for (const value of countryCode) {
    if (!ISO2.test(value)) {
      return { message: "country_code must be ISO-2", ok: false };
    }
  }

  const limitRaw = url.searchParams.get("limit");
  let limit = 10;
  if (limitRaw !== null) {
    if (!DIGITS.test(limitRaw)) {
      return { message: "limit must be an integer from 1 to 20", ok: false };
    }
    limit = Number(limitRaw);
    if (limit < 1 || limit > 20) {
      return { message: "limit must be an integer from 1 to 20", ok: false };
    }
  }

  return {
    ok: true,
    query: {
      category,
      country_code: countryCode,
      limit,
      workplace_type: workplaceType,
    },
  };
}

function matchesPreview(job: MockJob, filters: PreviewFilters): boolean {
  if (
    filters.category.length > 0 &&
    !filters.category.includes(String(job.role_family)) &&
    !filters.category.includes(String(job.occupational_category))
  ) {
    return false;
  }

  if (
    filters.workplace_type.length > 0 &&
    !filters.workplace_type.includes(String(job.workplace_type))
  ) {
    return false;
  }

  if (
    filters.country_code.length > 0 &&
    !filters.country_code.includes(String(job.workplace_country_code))
  ) {
    return false;
  }

  return true;
}

function templateById(id: string) {
  return TEMPLATES.find((template) => template.id === id) ?? null;
}

// Cursors are "c<offset>", opaque to the client like live.
function feedStart(url: URL): number | null {
  const cursor = url.searchParams.get("cursor");
  if (cursor !== null) {
    const match = CURSOR.exec(cursor);
    return match ? Number(match.groups?.offset) : null;
  }

  const offsetRaw = url.searchParams.get("offset");
  if (offsetRaw === null) {
    return 0;
  }
  if (!DIGITS.test(offsetRaw)) {
    return null;
  }

  return Number(offsetRaw);
}

function feedLimit(url: URL): number | null {
  const limitRaw = url.searchParams.get("limit");
  if (limitRaw === null) {
    return FEED_PAGE;
  }
  if (!DIGITS.test(limitRaw)) {
    return null;
  }

  const limit = Number(limitRaw);
  return limit >= 1 && limit <= FEED_LIMIT_MAX ? limit : null;
}

// Live: status lists closed or expired jobs, otherwise active ones, and since
// keeps jobs whose since_field timestamp is after it.
function feedFilter(url: URL): ((meta: FeedMeta) => boolean) | string {
  const status = url.searchParams.get("status");
  if (status !== null && status !== "closed" && status !== "expired") {
    return "status must be closed or expired";
  }

  const sinceRaw = url.searchParams.get("since");
  const since = sinceRaw === null ? null : Date.parse(sinceRaw);
  if (since !== null && Number.isNaN(since)) {
    return "since must be an ISO datetime";
  }

  const field = url.searchParams.get("since_field") ?? "first_visible";
  if (field !== "updated" && field !== "first_visible") {
    return "since_field must be first_visible, updated or created";
  }

  const wanted = status ?? "active";
  return (meta) => {
    if (meta.status !== wanted) {
      return false;
    }
    if (since === null) {
      return true;
    }
    const stamp = field === "updated" ? meta.updatedAt : meta.firstVisibleAt;
    return stamp > since;
  };
}

function feedQuery(
  url: URL
):
  | Response
  | { filter: (meta: FeedMeta) => boolean; pageSize: number; start: number } {
  const start = feedStart(url);
  if (start === null) {
    return invalidRequest("Unknown cursor");
  }

  const pageSize = feedLimit(url);
  if (pageSize === null) {
    return invalidRequest("limit must be an integer from 1 to 100");
  }

  const filter = feedFilter(url);
  if (typeof filter === "string") {
    return invalidRequest(filter);
  }

  return { filter, pageSize, start };
}

interface FieldError {
  code: string;
  message: string;
  path: string[];
}

function feedCreateErrors(record: Record<string, unknown>): FieldError[] {
  const errors: FieldError[] = [];
  if (
    typeof record.name !== "string" ||
    record.name.length < 1 ||
    record.name.length > 100
  ) {
    errors.push({
      code: "invalid_type",
      message: "Invalid input: expected string, received undefined",
      path: ["name"],
    });
  }
  if (
    record.filters === null ||
    typeof record.filters !== "object" ||
    Array.isArray(record.filters)
  ) {
    errors.push({
      code: "invalid_type",
      message: "Invalid input: expected object, received undefined",
      path: ["filters"],
    });
  }
  if (
    record.template_id !== undefined &&
    typeof record.template_id !== "string"
  ) {
    errors.push({
      code: "invalid_type",
      message: "Invalid input: expected string",
      path: ["template_id"],
    });
  }
  return errors;
}

export function createBordfeedMock(
  options: BordfeedMockOptions = {}
): BordfeedMock {
  const state: BordfeedMockState = {
    billedJobs: 0,
    checkedJobs: 0,
    requests: [],
    servedJobs: 0,
  };
  const delivered = new Set<string>();
  const registrations = new Map<string, Registration>();
  const samples = previewJobs();
  const feed = feedJobs(options.feedTotal ?? FEED_TOTAL);
  const now = options.now ?? Date.now;
  let feedMeta: FeedMeta[] = feed.map(() => ({
    firstVisibleAt: FEED_BASE_UPDATED_AT,
    status: "active",
    updatedAt: FEED_BASE_UPDATED_AT,
  }));
  let sequence = 0;
  let registrationsIssued = 0;
  // The first cursor read is a one-shot 429 so clients exercise Retry-After.
  let delayedPageTwo = false;
  // Like live: a new account reads 0 credits until the first balance read or
  // billed call grants the starting credit. Feed create is free.
  let creditsGranted = false;
  let credits = 0;
  // Registering nocredits@example.com makes billed feed reads return 402.
  let creditsExhausted = false;

  function grantCredits(): void {
    if (!(creditsGranted || creditsExhausted)) {
      creditsGranted = true;
      credits = STARTING_CREDITS;
    }
  }

  function log(request: Request, url: URL, body: unknown): void {
    state.requests.push({
      authorization: redactAuthorization(request.headers.get("authorization")),
      body,
      method: request.method,
      path: url.pathname,
      query: queryRecord(url),
      "x-bordfeed-client": request.headers.get("x-bordfeed-client"),
    });
  }

  function requireKey(request: Request): Response | null {
    if (bearer(request) === MOCK_API_KEY) {
      return null;
    }

    sequence += 1;
    return envelope(401, "unauthorized", "API key required", sequence);
  }

  function handleTemplates(url: URL): Response {
    if (url.pathname === "/api/v1/templates") {
      sequence += 1;
      return Response.json({
        data: TEMPLATES.map((item) => ({ ...item })),
        request_id: requestId(sequence),
      });
    }

    const previewMatch = PREVIEW_PATH.exec(url.pathname);
    if (previewMatch === null) {
      return new Response("not found", { status: 404 });
    }

    const templateId = decodeURIComponent(
      previewMatch.groups?.templateId ?? ""
    );
    const template = templateById(templateId);
    if (template === null) {
      sequence += 1;
      return envelope(404, "not_found", "Unknown template", sequence);
    }

    const parsed = parsePreview(url);
    if (!parsed.ok) {
      return invalidRequest(parsed.message);
    }

    const data = samples
      .filter((job) => matchesPreview(job, parsed.query))
      .slice(0, parsed.query.limit);
    sequence += 1;
    return Response.json({
      attribution: {
        logo_url: "https://bordfeed.com/logo.png",
        text: "Jobs by Bordfeed",
        url: "https://bordfeed.com/?ref=bordful",
      },
      data,
      filters_applied: parsed.query,
      message: "Preview",
      preview: true,
      request_id: requestId(sequence),
      template: {
        description: template.description,
        filters: template.filters,
        id: template.id,
        name: template.name,
      },
    });
  }

  function handleRegister(body: unknown): Response {
    const parsed = registerRequestSchema.safeParse(body);
    if (!parsed.success) {
      sequence += 1;
      return envelope(
        400,
        "invalid_request",
        "The request body is not valid.",
        sequence
      );
    }

    if (parsed.data.email === "limited@example.com") {
      sequence += 1;
      return envelope(
        429,
        "rate_limit_exceeded",
        "Rate limit exceeded",
        sequence,
        { retry_after: 3600 },
        { "retry-after": "3600" }
      );
    }

    registrationsIssued += 1;
    const id = registrationId(registrationsIssued);
    registrations.set(id, {
      boardName: parsed.data.board_name ?? null,
      email: parsed.data.email,
      id,
      templateId: parsed.data.template_id ?? null,
      verified: false,
      workspace: parsed.data.workspace ?? null,
    });
    if (parsed.data.email === "nocredits@example.com") {
      creditsExhausted = true;
    }
    // Live shape (auth.md): no request_id on success, expiry in seconds.
    return Response.json({
      email: parsed.data.email,
      expires_in: CODE_TTL_SECONDS,
      next: `Ask the person for the 6-digit code sent to ${parsed.data.email}, then POST /api/agent/verify with registration_id and code.`,
      registration_id: id,
    });
  }

  function handleVerify(body: unknown): Response {
    const parsed = verifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      sequence += 1;
      return envelope(
        400,
        "invalid_request",
        "The request body is not valid.",
        sequence
      );
    }

    const registration = registrations.get(parsed.data.registration_id);
    if (registration === undefined) {
      sequence += 1;
      return envelope(
        404,
        "invalid_registration",
        "No registration matches that id.",
        sequence
      );
    }

    if (
      registration.email === "workspace@example.com" &&
      registration.workspace === null
    ) {
      sequence += 1;
      return envelope(
        409,
        "workspace_required",
        "This account has more than one workspace.",
        sequence,
        {
          workspaces: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              name: "Example Workspace",
              slug: "example-workspace",
            },
          ],
        }
      );
    }

    if (registration.verified) {
      sequence += 1;
      return envelope(
        409,
        "already_issued",
        "API key was already issued",
        sequence
      );
    }

    if (parsed.data.code !== "424242") {
      sequence += 1;
      return envelope(400, "invalid_code", "That code is wrong.", sequence, {
        attempts_remaining: 4,
      });
    }

    registration.verified = true;
    const template =
      registration.templateId === null
        ? null
        : templateById(registration.templateId);
    // Live shape (auth.md). suggested_feed only for a known template_id.
    return Response.json({
      account: "created",
      api_key: MOCK_API_KEY,
      key_id: "33333333-3333-4333-8333-333333333333",
      key_name: "bordful",
      next: "Store the key in an env var such as BORDFEED_API_KEY.",
      organization: {
        id: "44444444-4444-4444-8444-444444444444",
        name: registration.boardName ?? nameFromEmail(registration.email),
      },
      ...(template === null
        ? {}
        : {
            suggested_feed: {
              body: {
                filters: {},
                name: template.name,
                template_id: template.id,
              },
              create: "POST https://bordfeed.com/api/v1/feeds",
              dashboard_url: `https://bordfeed.com/dashboard/organization/feeds/create?template=${template.id}`,
              template_id: template.id,
            },
          }),
    });
  }

  function handleCreateFeed(request: Request, body: unknown): Response {
    const denied = requireKey(request);
    if (denied !== null) {
      return denied;
    }

    if (body === null || typeof body !== "object") {
      sequence += 1;
      return envelope(422, "validation_error", "Invalid feed", sequence);
    }

    // Live: name (1 to 100) and filters (object) are required (422); an
    // unknown template_id is a 404.
    const record = body as Record<string, unknown>;
    const errors = feedCreateErrors(record);
    if (errors.length > 0) {
      sequence += 1;
      return envelope(
        422,
        "validation_error",
        errors[0]?.message ?? "Invalid feed",
        sequence,
        { errors }
      );
    }

    if (
      typeof record.template_id === "string" &&
      templateById(record.template_id) === null
    ) {
      sequence += 1;
      return envelope(404, "not_found", "Template not found", sequence);
    }

    sequence += 1;
    return Response.json(
      {
        data: {
          filters: record.filters,
          id: MOCK_FEED_ID,
          name: record.name,
          template_id: record.template_id ?? null,
        },
        request_id: requestId(sequence),
      },
      { status: 201 }
    );
  }

  function handleBalance(request: Request): Response {
    const denied = requireKey(request);
    if (denied !== null) {
      return denied;
    }

    grantCredits();
    sequence += 1;
    // Live shape (app/api/v1/billing/balance): one credit is one job.
    return Response.json({
      data: {
        balance_jobs: credits,
        plan: "payg",
        price_per_job_usd: 0.01,
        topup_url: TOPUP_URL,
      },
      request_id: requestId(sequence),
    });
  }

  function handleFeedJobs(request: Request, url: URL): Response {
    const denied = requireKey(request);
    if (denied !== null) {
      return denied;
    }

    if (creditsExhausted) {
      sequence += 1;
      return envelope(
        402,
        "insufficient_credits",
        "Insufficient credits",
        sequence,
        { topup_url: TOPUP_URL }
      );
    }
    grantCredits();

    const cursor = url.searchParams.get("cursor");
    if (cursor !== null && !delayedPageTwo) {
      delayedPageTwo = true;
      sequence += 1;
      return envelope(
        429,
        "rate_limit_exceeded",
        "Rate limit exceeded",
        sequence,
        { retry_after: 1 },
        { "retry-after": "1" }
      );
    }

    const query = feedQuery(url);
    if (query instanceof Response) {
      return query;
    }

    const { filter, pageSize, start } = query;
    const matching = feed.filter((_, index) => {
      const meta = feedMeta[index];
      return meta !== undefined && filter(meta);
    });
    const end = Math.min(start + pageSize, matching.length);
    const include = url.searchParams.get("include") === "description_html";
    const data = withDescriptionHtml(matching.slice(start, end), include);
    const more = end < matching.length;
    // Live bills new jobs only and refuses a page it cannot pay.
    const charge = data.filter((job) => !delivered.has(String(job.id))).length;
    if (charge > credits) {
      sequence += 1;
      return envelope(
        402,
        "insufficient_credits",
        "Insufficient credits",
        sequence,
        { balance_jobs: credits, topup_url: TOPUP_URL }
      );
    }
    for (const job of data) {
      delivered.add(String(job.id));
    }
    state.billedJobs += charge;
    state.servedJobs += data.length;
    credits = Math.max(0, credits - charge);
    sequence += 1;
    return Response.json({
      data,
      pagination: {
        has_more: more,
        limit: pageSize,
        next_cursor: more ? `c${end}` : null,
        next_offset: more ? end : null,
      },
      request_id: requestId(sequence),
    });
  }

  // Live (app/api/v1/jobs/[id]): 404 before any charge when the job is not
  // active, otherwise one credit only if this workspace never received it.
  function handleJob(request: Request, id: string): Response {
    const denied = requireKey(request);
    if (denied !== null) {
      return denied;
    }

    state.checkedJobs += 1;
    sequence += 1;
    const index = feed.findIndex((item) => String(item.id) === id);
    const job = feed[index];
    if (job === undefined || feedMeta[index]?.status !== "active") {
      return envelope(404, "not_found", "Job not found", sequence);
    }

    grantCredits();
    const charge = delivered.has(id) ? 0 : 1;
    if (charge > credits) {
      return envelope(
        402,
        "insufficient_credits",
        "Insufficient credits",
        sequence,
        {
          balance_jobs: credits,
          topup_url: TOPUP_URL,
        }
      );
    }
    delivered.add(id);
    state.billedJobs += charge;
    credits -= charge;
    return Response.json({
      data: job,
      jobs_charged: charge,
      request_id: requestId(sequence),
    });
  }

  function handleRead(request: Request, url: URL): Response {
    if (url.pathname === "/api/v1/billing/balance") {
      return handleBalance(request);
    }
    if (FEED_JOBS_PATH.test(url.pathname)) {
      return handleFeedJobs(request, url);
    }
    const jobMatch = JOB_PATH.exec(url.pathname);
    if (jobMatch?.groups?.jobId) {
      return handleJob(request, decodeURIComponent(jobMatch.groups.jobId));
    }
    return handleTemplates(url);
  }

  function markFeedJobs(
    indexes: number[],
    change: { status?: FeedMeta["status"]; surfaced?: boolean }
  ): void {
    const at = now();
    const picked = new Set(indexes);
    feedMeta = feedMeta.map((meta, index) =>
      picked.has(index + 1)
        ? {
            firstVisibleAt: change.surfaced ? at : meta.firstVisibleAt,
            status: change.status ?? meta.status,
            updatedAt: at,
          }
        : meta
    );
  }

  return {
    balance() {
      grantCredits();
      return credits;
    },
    closeFeedJobs(indexes) {
      markFeedJobs(indexes, { status: "closed" });
    },
    expireFeedJobs(indexes) {
      markFeedJobs(indexes, { status: "expired" });
    },
    async handle(request) {
      const url = new URL(request.url);
      const body = await readBody(request);
      log(request, url, body);

      if (request.method === "GET" && url.pathname.startsWith("/api/v1/")) {
        return handleRead(request, url);
      }

      if (request.method === "POST" && url.pathname === "/api/agent/register") {
        return handleRegister(body);
      }

      if (request.method === "POST" && url.pathname === "/api/agent/verify") {
        return handleVerify(body);
      }

      if (request.method === "POST" && url.pathname === "/api/v1/feeds") {
        return handleCreateFeed(request, body);
      }

      return new Response("not found", { status: 404 });
    },
    reset() {
      state.billedJobs = 0;
      state.checkedJobs = 0;
      state.requests = [];
      state.servedJobs = 0;
      delivered.clear();
      feedMeta = feed.map(() => ({
        firstVisibleAt: FEED_BASE_UPDATED_AT,
        status: "active",
        updatedAt: FEED_BASE_UPDATED_AT,
      }));
      registrations.clear();
      registrationsIssued = 0;
      sequence = 0;
      delayedPageTwo = false;
      creditsGranted = false;
      credits = 0;
      creditsExhausted = false;
    },
    state,
    surfaceFeedJobs(indexes) {
      markFeedJobs(indexes, { surfaced: true });
    },
    touchFeedJobs(indexes) {
      markFeedJobs(indexes, {});
    },
  };
}
