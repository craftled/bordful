import {
  registerRequestSchema,
  verifyRequestSchema,
} from "../../src/lib/bordfeed/register-schema";

import { buildMockJob, type MockJob } from "./job-shape";

export const MOCK_API_KEY = ["bf_mock_key", "0000000000000001"].join("_");
export const MOCK_FEED_ID = "11111111-1111-4111-8111-111111111111";

const TEMPLATES = [
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
const ISO2 = /^[A-Z]{2}$/;
const DIGITS = /^\d+$/;
const PREVIEW_PATH = /^\/api\/v1\/templates\/([^/]+)\/preview$/;
const FEED_JOBS_PATH = /^\/api\/v1\/feeds\/[^/]+\/jobs$/;

const WORKPLACES = new Set(["Remote", "Hybrid", "On-site"]);
const FEED_PAGE = 10;
const FEED_TOTAL = 25;
const PREVIEW_TOTAL = 20;

export interface BordfeedRequestLog {
  authorization: string | null;
  body: unknown;
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  "x-bordfeed-client": string | null;
}

interface Registration {
  boardName: string;
  email: string;
  id: string;
  templateId: string | null;
  verified: boolean;
  workspace: string | null;
}

export interface BordfeedMockState {
  requests: BordfeedRequestLog[];
}

export interface BordfeedMock {
  handle: (request: Request) => Promise<Response>;
  reset: () => void;
  state: BordfeedMockState;
}

interface PreviewFilters {
  category: string[];
  country_code: string[];
  limit: number;
  workplace_type: string[];
}

function requestId(sequence: number): string {
  return `req_mock_${String(sequence).padStart(4, "0")}`;
}

function registrationId(sequence: number): string {
  return `reg_mock_${String(sequence).padStart(4, "0")}`;
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

function feedJobs(): MockJob[] {
  const jobs: MockJob[] = [];
  const feedCountries = ["US", "DE", "GB"] as const;
  for (let index = 1; index <= FEED_TOTAL; index += 1) {
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

function feedStart(url: URL): number | null {
  const cursor = url.searchParams.get("cursor");
  if (cursor === "c2") {
    return FEED_PAGE;
  }
  if (cursor === "c3") {
    return FEED_PAGE * 2;
  }
  if (cursor !== null) {
    return null;
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

function nextCursor(end: number): string | null {
  if (end === FEED_PAGE) {
    return "c2";
  }
  if (end === FEED_PAGE * 2) {
    return "c3";
  }

  return null;
}

export function createBordfeedMock(): BordfeedMock {
  const state: BordfeedMockState = { requests: [] };
  const registrations = new Map<string, Registration>();
  const samples = previewJobs();
  const feed = feedJobs();
  let sequence = 0;
  let registrationsIssued = 0;
  // First cursor=c2 read is a one-shot 429 so clients exercise Retry-After.
  let delayedPageTwo = false;

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

    const [, rawTemplateId] = previewMatch;
    const templateId = decodeURIComponent(rawTemplateId ?? "");
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
        422,
        "validation_error",
        "Invalid register request",
        sequence
      );
    }

    if (parsed.data.email === "limited@example.com") {
      sequence += 1;
      return envelope(
        429,
        "rate_limited",
        "Too many signups",
        sequence,
        { retry_after: 3600 },
        { "retry-after": "3600" }
      );
    }

    registrationsIssued += 1;
    const id = registrationId(registrationsIssued);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    registrations.set(id, {
      boardName: parsed.data.board_name,
      email: parsed.data.email,
      id,
      templateId: parsed.data.template_id ?? null,
      verified: false,
      workspace: parsed.data.workspace ?? null,
    });
    return Response.json({ expires_at: expiresAt, registration_id: id });
  }

  function handleVerify(body: unknown): Response {
    const parsed = verifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      sequence += 1;
      return envelope(
        422,
        "validation_error",
        "Invalid verify request",
        sequence
      );
    }

    const registration = registrations.get(parsed.data.registration_id);
    if (registration === undefined) {
      sequence += 1;
      return envelope(404, "not_found", "Unknown registration", sequence);
    }

    if (
      registration.email === "workspace@example.com" &&
      registration.workspace === null
    ) {
      sequence += 1;
      return envelope(
        400,
        "workspace_required",
        "Choose a workspace",
        sequence,
        {
          workspaces: [
            { name: "Example Workspace", slug: "example-workspace" },
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
      return envelope(400, "invalid_code", "Code did not match", sequence);
    }

    registration.verified = true;
    return Response.json({
      api_key: MOCK_API_KEY,
      suggested_feed: {
        name: registration.boardName,
        template_id: registration.templateId ?? "engineering-it",
      },
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

    const record = body as Record<string, unknown>;
    if (
      typeof record.template_id !== "string" ||
      typeof record.name !== "string"
    ) {
      sequence += 1;
      return envelope(422, "validation_error", "Invalid feed", sequence);
    }

    sequence += 1;
    return Response.json(
      {
        data: {
          id: MOCK_FEED_ID,
          name: record.name,
          template_id: record.template_id,
        },
        request_id: requestId(sequence),
      },
      { status: 201 }
    );
  }

  function handleFeedJobs(request: Request, url: URL): Response {
    const denied = requireKey(request);
    if (denied !== null) {
      return denied;
    }

    const cursor = url.searchParams.get("cursor");
    if (cursor === "c2" && !delayedPageTwo) {
      delayedPageTwo = true;
      sequence += 1;
      return envelope(
        429,
        "rate_limited",
        "Slow down",
        sequence,
        { retry_after: 1 },
        { "retry-after": "1" }
      );
    }

    const start = feedStart(url);
    if (start === null) {
      return invalidRequest("Unknown cursor");
    }

    const limitRaw = url.searchParams.get("limit");
    let requested = FEED_PAGE;
    if (limitRaw !== null) {
      if (!DIGITS.test(limitRaw) || Number(limitRaw) < 1) {
        return invalidRequest("limit must be a positive integer");
      }
      requested = Number(limitRaw);
    }

    const pageSize = Math.min(requested, FEED_PAGE);
    const end = Math.min(start + pageSize, feed.length);
    const include = url.searchParams.get("include") === "description_html";
    const data = withDescriptionHtml(feed.slice(start, end), include);
    const more = end < feed.length;
    sequence += 1;
    return Response.json({
      data,
      pagination: {
        has_more: more,
        limit: pageSize,
        next_cursor: more ? nextCursor(end) : null,
        next_offset: more ? end : null,
      },
      request_id: requestId(sequence),
    });
  }

  return {
    async handle(request) {
      const url = new URL(request.url);
      const body = await readBody(request);
      log(request, url, body);

      if (request.method === "GET" && url.pathname.startsWith("/api/v1/")) {
        if (FEED_JOBS_PATH.test(url.pathname)) {
          return handleFeedJobs(request, url);
        }
        return handleTemplates(url);
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
      state.requests = [];
      registrations.clear();
      registrationsIssued = 0;
      sequence = 0;
      delayedPageTwo = false;
    },
    state,
  };
}
