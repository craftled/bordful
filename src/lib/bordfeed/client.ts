import { z } from "zod";

import { BordfeedApiError, safeMessage } from "./errors";
import type { BordfeedJob } from "./job-schema";
import {
  feedCreateResponseSchema,
  jobsPageSchema,
  previewResponseSchema,
  registerResponseSchema,
  templatesResponseSchema,
  verifyResponseSchema,
} from "./job-schema";
import { buildPreviewSearchParams, type PreviewQuery } from "./preview-query";
import type {
  BordfeedWorkspace,
  CreateFeedRequest,
  PreviewResponse,
  RegisterRequest,
  RegisterResponse,
  TemplatesResponse,
  VerifyRequest,
  VerifyResponse,
} from "./types";

const DEFAULT_MIN_INTERVAL_MS = 500;
const DEFAULT_MAX_ATTEMPTS = 3;
const MAX_WAIT_SECONDS = 10;
const NETWORK_RETRY_MS = 1000;
// One slow request must not eat the cron's 300 s budget.
const REQUEST_TIMEOUT_MS = 30_000;
const FEED_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export interface BordfeedClient {
  checkJob: (jobId: string) => Promise<JobCheck>;
  createFeed: (body: CreateFeedRequest) => Promise<{ id: string }>;
  fetchFeedPage: (feedId: string, query: FeedPageQuery) => Promise<FeedPage>;
  listTemplates: () => Promise<TemplatesResponse>;
  previewTemplate: (
    templateId: string,
    query: PreviewQuery
  ) => Promise<PreviewResponse<BordfeedJob>>;
  register: (body: RegisterRequest) => Promise<RegisterResponse>;
  verify: (body: VerifyRequest) => Promise<VerifyResponse>;
}

// One billed request: Bordfeed charges one credit per job returned, so the
// caller sets `limit` from its sync budget and never pages on its own.
export interface FeedPageQuery {
  cursor?: string | null;
  limit: number;
  offset?: number | null;
  since?: string | null;
  sinceField?: "first_visible" | "updated";
  status?: "closed" | "expired";
}

export interface FeedPage {
  data: BordfeedJob[];
  hasMore: boolean;
  // Date-sorted feeds page by cursor, search feeds by offset.
  nextCursor: string | null;
  nextOffset: number | null;
}

export const FEED_PAGE_MAX = 100;

// GET /api/v1/jobs/{id}: 404 for a job that is no longer active, answered
// before any charge. An active job the workspace already received is free;
// `charged` is what Bordfeed billed for this lookup (null when not reported).
export type JobCheck =
  | { charged: number | null; status: "active" }
  | { status: "gone" };

const jobCheckSchema = z.object({
  jobs_charged: z.number().int().min(0).nullable().optional(),
});

export interface BordfeedClientOptions {
  apiKey?: string;
  baseUrl: string;
  clientHeaders: Record<string, string>;
  fetch?: typeof fetch;
  maxAttempts?: number;
  minIntervalMs?: number;
  now?: () => number;
  signal?: AbortSignal;
  sleep?: (ms: number) => Promise<void>;
}

interface ErrorBody {
  code: string | null;
  retryAfter: number | null;
  workspaces: BordfeedWorkspace[];
}

function apiError(options: {
  code: string;
  retryAfterSeconds?: number | null;
  status: number;
  workspaces?: BordfeedWorkspace[];
}): BordfeedApiError {
  const { code } = options;
  const message =
    code === "workspace_required" ||
    code === "already_issued" ||
    code === "network" ||
    code === "invalid_response" ||
    code === "rate_limited" ||
    code === "auth_failed" ||
    code === "payment_required" ||
    code === "not_found" ||
    code === "unknown"
      ? safeMessage(code)
      : safeMessage("unknown");

  return new BordfeedApiError({
    code,
    message,
    retryAfterSeconds: options.retryAfterSeconds,
    status: options.status,
    workspaces: options.workspaces,
  });
}

function invalidResponse(status = 200): BordfeedApiError {
  return apiError({ code: "invalid_response", status });
}

function seconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function workspaceOf(item: unknown): BordfeedWorkspace | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id = "id" in item ? item.id : null;
  const name = "name" in item ? item.name : null;
  const slug = "slug" in item ? item.slug : null;
  if (!(typeof name === "string" && typeof slug === "string")) {
    return null;
  }

  return typeof id === "string" ? { id, name, slug } : { name, slug };
}

function workspacesOf(value: unknown): BordfeedWorkspace[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const workspace = workspaceOf(item);
    return workspace ? [workspace] : [];
  });
}

function readErrorBody(body: unknown): ErrorBody {
  if (!body || typeof body !== "object" || !("error" in body)) {
    return { code: null, retryAfter: null, workspaces: [] };
  }

  const { error } = body as { error?: unknown };
  if (!error || typeof error !== "object") {
    return { code: null, retryAfter: null, workspaces: [] };
  }

  const record = error as {
    code?: unknown;
    retry_after?: unknown;
    workspaces?: unknown;
  };

  return {
    code: typeof record.code === "string" ? record.code : null,
    retryAfter: seconds(record.retry_after),
    workspaces: workspacesOf(record.workspaces),
  };
}

const AGENT_CODES = new Set([
  "already_issued",
  "code_expired",
  "invalid_registration",
  "locked",
  "workspace_not_found",
  "workspace_required",
]);

function statusCode(status: number, bodyCode: string | null): string {
  // Agent sign-up codes keep their meaning even on a 404 or 410.
  if (bodyCode !== null && AGENT_CODES.has(bodyCode)) {
    return bodyCode;
  }

  if (status === 401 || status === 403) {
    return "auth_failed";
  }

  if (status === 402) {
    return "payment_required";
  }

  if (status === 404) {
    return "not_found";
  }

  if (status === 429) {
    return "rate_limited";
  }

  return bodyCode ?? "unknown";
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function parseSchema<T>(
  schema: z.ZodType<T>,
  body: unknown,
  status: number
): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw invalidResponse(status);
  }

  return parsed.data;
}

export function createBordfeedClient(
  options: BordfeedClientOptions
): BordfeedClient {
  const fetchImpl = options.fetch ?? fetch;
  const sleep =
    options.sleep ??
    ((ms: number) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      }));
  const now = options.now ?? (() => Date.now());
  const minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  let nextStart = 0;

  async function pace(): Promise<void> {
    const delay = Math.max(0, nextStart - now());
    if (delay > 0) {
      await sleep(delay);
    }

    nextStart = now() + minIntervalMs;
  }

  function headers(jsonBody: boolean): Record<string, string> {
    const result: Record<string, string> = {
      ...options.clientHeaders,
      accept: "application/json",
    };

    if (jsonBody) {
      result["content-type"] = "application/json";
    }

    if (options.apiKey) {
      result.authorization = `Bearer ${options.apiKey}`;
    }

    return result;
  }

  async function call(
    target: string,
    init: { body?: string; method?: string }
  ): Promise<Response | null> {
    try {
      return await fetchImpl(target, {
        body: init.body,
        headers: headers(init.body !== undefined),
        method: init.method ?? "GET",
        signal: options.signal
          ? AbortSignal.any([
              options.signal,
              AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            ])
          : AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      return null;
    }
  }

  function failureOf(response: Response, body: unknown): BordfeedApiError {
    const parsed = readErrorBody(body);
    const retryable = response.status === 429 || response.status >= 500;
    const retryAfter = retryable
      ? (seconds(response.headers.get("retry-after")) ?? parsed.retryAfter ?? 1)
      : null;
    return apiError({
      code: statusCode(response.status, parsed.code),
      retryAfterSeconds: retryAfter,
      status: response.status,
      workspaces: parsed.workspaces,
    });
  }

  async function request(
    target: string,
    init: { allowNotFound?: boolean; body?: string; method?: string },
    attempt = 1
  ): Promise<{ body: unknown; status: number }> {
    await pace();
    const response = await call(target, init);
    if (!response) {
      // A read is safe to repeat, so a dropped connection gets one retry.
      if (
        (init.method ?? "GET") === "GET" &&
        attempt === 1 &&
        maxAttempts > 1
      ) {
        await sleep(NETWORK_RETRY_MS);
        return request(target, init, attempt + 1);
      }
      throw apiError({ code: "network", status: 0 });
    }

    const body = await readJson(response);
    if (response.ok || (init.allowNotFound && response.status === 404)) {
      return { body, status: response.status };
    }

    const failure = failureOf(response, body);
    const wait = failure.retryAfterSeconds;
    const retryable = response.status === 429 || response.status >= 500;
    if (
      !(retryable && wait !== null && wait <= MAX_WAIT_SECONDS) ||
      attempt >= maxAttempts
    ) {
      throw failure;
    }

    await sleep(wait * 1000);
    return request(target, init, attempt + 1);
  }

  function endpoint(path: string, search?: string): string {
    const parsed = new URL(path, `${options.baseUrl}/`);
    if (search && search.length > 0) {
      parsed.search = search;
    }

    return parsed.toString();
  }

  function feedPageSearch(query: FeedPageQuery): string {
    const params = new URLSearchParams();
    const limit = Math.min(FEED_PAGE_MAX, Math.max(1, Math.floor(query.limit)));
    params.set("limit", String(limit));
    params.set("include", "description_html");
    if (query.since) {
      params.set("since", query.since);
      params.set("since_field", query.sinceField ?? "updated");
    }
    if (query.status) {
      params.set("status", query.status);
    }
    if (query.cursor) {
      params.set("cursor", query.cursor);
    } else if (typeof query.offset === "number" && query.offset > 0) {
      params.set("offset", String(query.offset));
    }

    return params.toString();
  }

  return {
    async checkJob(jobId) {
      const response = await request(
        endpoint(`/api/v1/jobs/${encodeURIComponent(jobId)}`),
        { allowNotFound: true }
      );
      if (response.status === 404) {
        // Only Bordfeed's own not_found means the job is gone. Any other 404,
        // such as a wrong base URL, must never unpublish jobs.
        if (readErrorBody(response.body).code === "not_found") {
          return { status: "gone" };
        }
        throw invalidResponse(404);
      }

      const parsed = parseSchema(
        jobCheckSchema,
        response.body,
        response.status
      );
      return { charged: parsed.jobs_charged ?? null, status: "active" };
    },

    async createFeed(body) {
      const response = await request(endpoint("/api/v1/feeds"), {
        body: JSON.stringify(body),
        method: "POST",
      });
      const parsed = parseSchema(
        feedCreateResponseSchema,
        response.body,
        response.status
      );
      return { id: parsed.data.id };
    },

    async fetchFeedPage(feedId, query) {
      if (!FEED_ID.test(feedId)) {
        throw invalidResponse(400);
      }

      const response = await request(
        endpoint(`/api/v1/feeds/${feedId}/jobs`, feedPageSearch(query)),
        {}
      );
      const parsed = parseSchema(
        jobsPageSchema,
        response.body,
        response.status
      );
      const more = parsed.pagination.has_more;
      const nextCursor = more ? parsed.pagination.next_cursor : null;
      const nextOffset = more ? (parsed.pagination.next_offset ?? null) : null;
      // has_more without a way to continue would end a delta series early.
      if (more && !(nextCursor || nextOffset)) {
        throw invalidResponse(response.status);
      }

      return { data: parsed.data, hasMore: more, nextCursor, nextOffset };
    },

    async listTemplates() {
      const response = await request(endpoint("/api/v1/templates"), {});
      return parseSchema(
        templatesResponseSchema,
        response.body,
        response.status
      );
    },

    async previewTemplate(templateId, query) {
      const path = `/api/v1/templates/${encodeURIComponent(templateId)}/preview`;
      try {
        const response = await request(
          endpoint(path, buildPreviewSearchParams(query).toString()),
          {}
        );
        return parseSchema(
          previewResponseSchema,
          response.body,
          response.status
        );
      } catch (error) {
        if (error instanceof BordfeedApiError && error.status === 400) {
          const response = await request(endpoint(path), {});
          return parseSchema(
            previewResponseSchema,
            response.body,
            response.status
          );
        }

        throw error;
      }
    },

    async register(body) {
      const response = await request(endpoint("/api/agent/register"), {
        body: JSON.stringify(body),
        method: "POST",
      });
      return parseSchema(
        registerResponseSchema,
        response.body,
        response.status
      );
    },

    async verify(body) {
      const response = await request(endpoint("/api/agent/verify"), {
        body: JSON.stringify(body),
        method: "POST",
      });
      return parseSchema(verifyResponseSchema, response.body, response.status);
    },
  };
}
