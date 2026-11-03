import { existsSync } from "node:fs";

import { beforeEach, describe, expect, test } from "vitest";
import type { BordfeedClient } from "@/lib/bordfeed/client";
import { connectAdminDenial } from "@/lib/bordfeed/connect/admin";
import {
  ALREADY_ISSUED_MESSAGE,
  REGISTER_RATE_LIMIT_MESSAGE,
} from "@/lib/bordfeed/connect/messages";
import {
  pasteKey,
  registrationExpiry,
  resetToSample,
  setShowAttribution,
  startConnect,
  submitCode,
} from "@/lib/bordfeed/connect/service";
import { readConnection } from "@/lib/bordfeed/connection-store";
import { BordfeedApiError } from "@/lib/bordfeed/errors";
import type { BordfeedJob } from "@/lib/bordfeed/job-schema";
import { runSampleSync } from "@/lib/bordfeed/sync";
import type { CreateFeedRequest, RegisterRequest } from "@/lib/bordfeed/types";
import { isEncryptedEnvelope } from "@/lib/crypto/secret-box";
import { bordfeedInstallId } from "@/lib/install/install-id";
import { toBordfeedConnectionPublic } from "@/lib/read/mappers";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const FEED_ID = "11111111-1111-4111-8111-111111111111";
const API_KEY = "bf_mock_key_0000000000000001";
const NOW = () => new Date("2026-10-23T09:00:00.000Z");
const OWNER = {
  boardName: "Example Board",
  email: "owner@example.com",
  medium: "admin" as const,
};

const exampleCompany = {
  domain: "example.com",
  id: "co-example",
  name: "Example Co",
  slug: "example-co",
};

interface Call {
  body?: CreateFeedRequest | RegisterRequest | { code: string };
  feedId?: string;
  type: "createFeed" | "fetchFeedPage" | "preview" | "register" | "verify";
}

const calls: Call[] = [];

interface Behavior {
  createFeedFailures: number;
  feedError: BordfeedApiError | null;
  feedJobs: number;
  feedThrows: boolean;
  registerError: BordfeedApiError | null;
  unauthorized: boolean;
  verifyError: BordfeedApiError | null;
}

const behavior: Behavior = {
  createFeedFailures: 0,
  feedError: null,
  feedJobs: 3,
  feedThrows: false,
  registerError: null,
  unauthorized: false,
  verifyError: null,
};

const INSTALL_ID_PATTERN = /^[a-f0-9]{64}$/u;

function jobs(prefix: string, count: number): BordfeedJob[] {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      apply_url: `https://jobs.example.com/${prefix}/${number}/apply`,
      company: exampleCompany,
      description: `Build reliable systems ${number}.`,
      id: `${prefix}${number}`,
      listing_url: `https://jobs.example.com/${prefix}/${number}`,
      posted_date: "2026-01-15T12:00:00.000Z",
      slug: `${prefix}-engineer-${number}`,
      title: `Example Engineer ${number}`,
      type: "Full-time",
      workplace_type: "Remote",
    };
  });
}

function previewBody(data: BordfeedJob[]) {
  return {
    data,
    message: "Preview of sample jobs.",
    preview: true as const,
    request_id: "req_preview",
    template: {
      description: "Remote roles in every job category and location",
      filters: { workplace_type: ["Remote"] },
      id: "fully-remote",
      name: "Fully Remote",
    },
  };
}

function rejectApi(error: BordfeedApiError): Promise<never> {
  return Promise.reject(error);
}

function client(): BordfeedClient {
  return {
    checkJob: () => Promise.resolve({ charged: 0, status: "active" }),
    createFeed(body) {
      calls.push({ body, type: "createFeed" });
      if (behavior.createFeedFailures > 0) {
        behavior.createFeedFailures -= 1;
        return rejectApi(
          new BordfeedApiError({
            code: "unknown",
            message: "The Bordfeed request failed.",
            status: 500,
          })
        );
      }

      if (behavior.unauthorized) {
        return rejectApi(
          new BordfeedApiError({
            code: "auth_failed",
            message: "Bordfeed rejected the API key.",
            status: 401,
          })
        );
      }

      return Promise.resolve({ id: FEED_ID });
    },
    async fetchFeedPage(feedId: string) {
      calls.push({ feedId, type: "fetchFeedPage" });
      await Promise.resolve();
      if (behavior.feedThrows) {
        throw new BordfeedApiError({
          code: "network",
          message: "Could not reach Bordfeed.",
          status: 0,
        });
      }

      if (behavior.feedError) {
        throw behavior.feedError;
      }

      return {
        data: behavior.feedJobs > 0 ? jobs("feed", behavior.feedJobs) : [],
        hasMore: false,
        nextCursor: null,
        nextOffset: null,
      };
    },
    listTemplates: () =>
      Promise.resolve({
        data: [
          {
            category: "general",
            description: "Remote roles in every job category and location",
            filters: { workplace_type: ["Remote"] },
            id: "fully-remote",
            name: "Fully Remote",
          },
        ],
        request_id: "req_templates",
      }),
    previewTemplate: () => {
      calls.push({ type: "preview" });
      return Promise.resolve(previewBody(jobs("sample", 3)));
    },
    register(body) {
      calls.push({ body, type: "register" });
      if (behavior.registerError) {
        return rejectApi(behavior.registerError);
      }

      // Live shape (auth.md): expires_in seconds, no expires_at.
      return Promise.resolve({
        email: "owner@example.com",
        expires_in: 600,
        next: "Ask the person for the 6-digit code.",
        registration_id: "00000000-0000-4000-8000-000000000001",
      });
    },
    verify(body) {
      calls.push({ body, type: "verify" });
      if (behavior.verifyError) {
        return rejectApi(behavior.verifyError);
      }

      return Promise.resolve({
        account: "created",
        api_key: API_KEY,
        key_id: "33333333-3333-4333-8333-333333333333",
        key_name: "bordful",
        next: "Store the key in an env var such as BORDFEED_API_KEY.",
        organization: {
          id: "44444444-4444-4444-8444-444444444444",
          name: "Example Board",
        },
        suggested_feed: {
          body: {
            filters: {},
            name: "Fully Remote",
            template_id: "fully-remote",
          },
          create: "POST https://bordfeed.com/api/v1/feeds",
          dashboard_url:
            "https://bordfeed.com/dashboard/organization/feeds/create?template=fully-remote",
          template_id: "fully-remote",
        },
      });
    },
  };
}

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_TEST is required for test:int");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\//u, "");
if (!(databaseName.endsWith("_int") || databaseName.endsWith("_test"))) {
  throw new Error("DATABASE_URL_TEST database must end with _int or _test");
}

process.env.DATABASE_URL = databaseUrl;

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const payload = await getPayload({ config });
const deps = () => ({ client: client(), now: NOW });

describe("bordfeed connect", () => {
  beforeEach(async () => {
    await payload.db.migrateFresh({ forceAcceptWarning: true });
    calls.length = 0;
    behavior.createFeedFailures = 0;
    behavior.feedError = null;
    behavior.feedJobs = 3;
    behavior.feedThrows = false;
    behavior.registerError = null;
    behavior.unauthorized = false;
    behavior.verifyError = null;
  });

  test("startConnect registers from sample", async () => {
    const bordfeed = deps();
    const result = await startConnect(payload, OWNER, bordfeed);
    const install = await payload.findGlobal({
      depth: 0,
      overrideAccess: true,
      showHiddenFields: true,
      slug: "install-state",
    });
    const register = calls.find((call) => call.type === "register");

    expect(result).toEqual({
      message: "We sent a 6-digit code to owner@example.com. Enter it below.",
      state: "awaiting_code",
    });
    const installId = bordfeedInstallId(String(install.installId));
    expect(installId).toMatch(INSTALL_ID_PATTERN);
    expect(register?.body).toEqual({
      agent_name: "bordful",
      board_name: "Example Board",
      email: "owner@example.com",
      install_id: installId,
      ref: "bordful",
      template_id: "fully-remote",
      utm_campaign: "connect",
      utm_medium: "admin",
      utm_source: "bordful",
    });
  });

  test("submitCode connects, stores the key, and a second call makes no client calls", async () => {
    const bordfeed = deps();
    await startConnect(payload, OWNER, bordfeed);
    await runSampleSync(payload, bordfeed);
    const result = await submitCode(payload, { code: "424242" }, bordfeed);
    const record = await readConnection(payload);
    const samples = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });

    expect(result.state).toBe("connected");
    expect(result.message).toBe("Connected. Synced 3 jobs from Bordfeed.");
    expect(record.feedId).toBe(FEED_ID);
    expect(record.keyHint).toBe("bf_...0001");
    expect(isEncryptedEnvelope(record.apiKeyEncrypted ?? "")).toBe(true);
    expect(record.showAttribution).toBe(true);
    expect(record.registrationId).toBeNull();
    expect(samples.totalDocs).toBe(0);

    calls.length = 0;
    await submitCode(payload, { code: "424242" }, bordfeed);
    expect(calls).toEqual([]);
  });

  test("a createFeed failure keeps the key and the retry skips verify", async () => {
    const bordfeed = deps();
    behavior.createFeedFailures = 1;
    await startConnect(payload, OWNER, bordfeed);
    const first = await submitCode(payload, { code: "424242" }, bordfeed);
    const stored = await readConnection(payload);
    const verifyCount = calls.filter((call) => call.type === "verify").length;

    expect(first.state).toBe("awaiting_code");
    expect(isEncryptedEnvelope(stored.apiKeyEncrypted ?? "")).toBe(true);

    const second = await submitCode(payload, { code: "424242" }, bordfeed);
    expect(second.state).toBe("connected");
    expect(calls.filter((call) => call.type === "verify")).toHaveLength(
      verifyCount
    );
    expect(calls.filter((call) => call.type === "createFeed")).toHaveLength(2);
  });

  test("already issued asks for a pasted key", async () => {
    const bordfeed = deps();
    behavior.verifyError = new BordfeedApiError({
      code: "already_issued",
      message: ALREADY_ISSUED_MESSAGE,
      status: 409,
    });
    await startConnect(payload, OWNER, bordfeed);
    const result = await submitCode(payload, { code: "424242" }, bordfeed);
    const record = await readConnection(payload);

    expect(result.state).toBe("awaiting_code");
    expect(result.fallback).toBe("paste_key");
    expect(result.message).toBe(ALREADY_ISSUED_MESSAGE);
    expect(record.apiKeyEncrypted).toBeNull();
  });

  test("workspace_required lists workspaces and the next register sends the slug", async () => {
    const bordfeed = deps();
    behavior.verifyError = new BordfeedApiError({
      code: "workspace_required",
      message: "Choose which Bordfeed workspace to connect.",
      status: 409,
      workspaces: [{ name: "Example Workspace", slug: "example-workspace" }],
    });
    await startConnect(payload, OWNER, bordfeed);
    const result = await submitCode(payload, { code: "424242" }, bordfeed);

    expect(result.workspaces).toEqual([
      { name: "Example Workspace", slug: "example-workspace" },
    ]);

    behavior.verifyError = null;
    calls.length = 0;
    await startConnect(
      payload,
      { ...OWNER, workspace: "example-workspace" },
      bordfeed
    );
    const register = calls.find((call) => call.type === "register");
    expect(
      register?.body && "workspace" in register.body
        ? register.body.workspace
        : null
    ).toBe("example-workspace");
  });

  test("workspace_not_found at verify shows the workspace picker", async () => {
    const bordfeed = deps();
    behavior.verifyError = new BordfeedApiError({
      code: "workspace_not_found",
      message: "The Bordfeed request failed.",
      status: 404,
      workspaces: [{ name: "Example Workspace", slug: "example-workspace" }],
    });
    await startConnect(payload, OWNER, bordfeed);
    const result = await submitCode(payload, { code: "424242" }, bordfeed);

    expect(result.message).toBe("Choose which Bordfeed workspace to connect.");
    expect(result.workspaces).toEqual([
      { name: "Example Workspace", slug: "example-workspace" },
    ]);
  });

  test("register 429 stays on sample and records rate_limited", async () => {
    const bordfeed = deps();
    behavior.registerError = new BordfeedApiError({
      code: "rate_limit_exceeded",
      message: "Bordfeed is rate limiting this board. Try again later.",
      status: 429,
    });
    const result = await startConnect(payload, OWNER, bordfeed);
    const record = await readConnection(payload);

    expect(result.state).toBe("sample");
    expect(result.fallback).toBe("paste_key");
    expect(result.message).toBe(REGISTER_RATE_LIMIT_MESSAGE);
    expect(record.lastError?.code).toBe("rate_limited");
  });

  test("pasteKey connects, and a rejected key is not stored", async () => {
    const bordfeed = deps();
    const connected = await pasteKey(payload, { apiKey: API_KEY }, bordfeed);
    expect(connected.state).toBe("connected");

    await payload.db.migrateFresh({ forceAcceptWarning: true });
    calls.length = 0;
    behavior.unauthorized = true;
    const rejected = await pasteKey(payload, { apiKey: API_KEY }, deps());
    const record = await readConnection(payload);

    expect(rejected.state).toBe("sample");
    expect(rejected.message).toBe("Bordfeed rejected the API key.");
    expect(record.apiKeyEncrypted).toBeNull();
  });

  test("attribution can be hidden only while connected", async () => {
    const rejected = await setShowAttribution(payload, false, deps());
    expect(rejected.message).toBe(
      "The Jobs by Bordfeed credit can be hidden only while Bordfeed is connected."
    );
    expect((await readConnection(payload)).showAttribution).toBe(true);

    await pasteKey(payload, { apiKey: API_KEY }, deps());
    const hidden = await setShowAttribution(payload, false, deps());
    const doc = await payload.findGlobal({
      depth: 0,
      overrideAccess: false,
      slug: "bordfeed-connection",
    });

    expect(hidden.state).toBe("connected");
    expect(toBordfeedConnectionPublic(doc).showAttribution).toBe(false);
  });

  test("reset drafts feed jobs, syncs samples, and a reconnect republishes them", async () => {
    const bordfeed = deps();
    await pasteKey(payload, { apiKey: API_KEY }, bordfeed);
    calls.length = 0;
    const reset = await resetToSample(payload, bordfeed);
    const afterReset = await readConnection(payload);
    const drafted = await payload.find({
      collection: "jobs",
      depth: 0,
      draft: true,
      limit: 20,
      overrideAccess: true,
      where: { origin: { equals: "bordfeed" } },
    });

    expect(reset.state).toBe("sample");
    expect(reset.message).toBe(
      "Disconnected. The board shows sample jobs again."
    );
    expect(afterReset.apiKeyEncrypted).toBeNull();
    expect(afterReset.keyHint).toBeNull();
    expect(afterReset.feedId).toBeNull();
    expect(drafted.docs.length).toBeGreaterThan(0);
    expect(drafted.docs.every((job) => job._status === "draft")).toBe(true);
    expect(calls.some((call) => call.type === "preview")).toBe(true);

    await pasteKey(payload, { apiKey: API_KEY }, bordfeed);
    const republished = await payload.find({
      collection: "jobs",
      depth: 0,
      draft: false,
      limit: 20,
      overrideAccess: true,
      where: { origin: { equals: "bordfeed" } },
    });
    expect(republished.docs).toHaveLength(3);
    expect(republished.docs.every((job) => job._status === "published")).toBe(
      true
    );
  });

  test("a stored key finishes after the code expires without another verify", async () => {
    const bordfeed = deps();
    behavior.createFeedFailures = 1;
    await startConnect(payload, OWNER, bordfeed);
    await submitCode(payload, { code: "424242" }, bordfeed);
    const verifyCount = calls.filter((call) => call.type === "verify").length;

    const result = await submitCode(
      payload,
      { code: "nope" },
      {
        client: bordfeed.client,
        now: () => new Date("2026-10-23T10:00:00.000Z"),
      }
    );

    expect(result.state).toBe("connected");
    expect(calls.filter((call) => call.type === "verify")).toHaveLength(
      verifyCount
    );
  });

  test("starting again drops a stored key from the previous account", async () => {
    const bordfeed = deps();
    behavior.createFeedFailures = 1;
    await startConnect(payload, OWNER, bordfeed);
    await submitCode(payload, { code: "424242" }, bordfeed);
    expect(
      isEncryptedEnvelope((await readConnection(payload)).apiKeyEncrypted ?? "")
    ).toBe(true);

    calls.length = 0;
    const again = await startConnect(
      payload,
      { ...OWNER, email: "other@example.com" },
      bordfeed
    );
    const record = await readConnection(payload);
    const register = calls.find((call) => call.type === "register");

    expect(again).toEqual({
      message: "We sent a 6-digit code to other@example.com. Enter it below.",
      state: "awaiting_code",
    });
    expect(record.apiKeyEncrypted).toBeNull();
    expect(
      register?.body && "email" in register.body ? register.body.email : null
    ).toBe("other@example.com");

    await submitCode(payload, { code: "424242" }, bordfeed);
    expect(calls.filter((call) => call.type === "verify")).toHaveLength(1);
  });

  test("a failed first sync stays on the connected error", async () => {
    const bordfeed = deps();
    behavior.feedThrows = true;
    await startConnect(payload, OWNER, bordfeed);
    const result = await submitCode(payload, { code: "424242" }, bordfeed);
    const record = await readConnection(payload);

    expect(result.state).toBe("error");
    expect(result.message).toBe(
      "Connected. The first sync failed: Could not reach Bordfeed."
    );
    expect(record.previousState).toBe("connected");
    expect(record.feedId).toBe(FEED_ID);
  });
  test("register stores the expiry from live expires_in", async () => {
    await startConnect(payload, OWNER, deps());
    const record = await readConnection(payload);

    expect(record.state).toBe("awaiting_code");
    expect(record.registrationId).toBe("00000000-0000-4000-8000-000000000001");
    expect(record.registrationExpiresAt).toBe("2026-10-23T09:10:00.000Z");
  });

  test("connect creates the feed with filters, named after the template on a default site name", async () => {
    const bordfeed = deps();
    await startConnect(payload, OWNER, bordfeed);
    await submitCode(payload, { code: "424242" }, bordfeed);
    const create = calls.find((call) => call.type === "createFeed");

    expect(create?.body).toEqual({
      filters: {},
      name: "Fully Remote",
      template_id: "fully-remote",
    });
  });

  test("connect names the feed after a renamed site", async () => {
    await payload.updateGlobal({
      data: { name: "Remote Rust Jobs" },
      overrideAccess: true,
      slug: "site-settings",
    });
    const bordfeed = deps();
    await startConnect(payload, OWNER, bordfeed);
    await submitCode(payload, { code: "424242" }, bordfeed);
    const create = calls.find((call) => call.type === "createFeed");

    expect(create?.body).toEqual({
      filters: {},
      name: "Remote Rust Jobs",
      template_id: "fully-remote",
    });
  });

  test("pasteKey creates the feed with filters and the template display name", async () => {
    await pasteKey(payload, { apiKey: API_KEY }, deps());
    const create = calls.find((call) => call.type === "createFeed");

    expect(create?.body).toEqual({
      filters: {},
      name: "Fully Remote",
      template_id: "fully-remote",
    });
  });

  test("a 402 on the first feed read keeps the samples and explains credits", async () => {
    const bordfeed = deps();
    await runSampleSync(payload, bordfeed);
    behavior.feedError = new BordfeedApiError({
      code: "payment_required",
      message: "The Bordfeed request failed.",
      status: 402,
    });
    await startConnect(payload, OWNER, bordfeed);
    const result = await submitCode(payload, { code: "424242" }, bordfeed);
    const samples = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: {
        and: [
          { origin: { equals: "bordfeed_sample" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    expect(result.message).toBe(
      "Connected. The first sync failed: This Bordfeed workspace does not have enough credits for this sync. Each job a sync fetches for the first time uses one credit. Top up in Bordfeed, then sync again. The board keeps its current jobs until then."
    );
    expect(samples.totalDocs).toBe(3);
  });

  test("an empty first feed keeps the samples instead of a blank board", async () => {
    const bordfeed = deps();
    await runSampleSync(payload, bordfeed);
    behavior.feedJobs = 0;
    const result = await pasteKey(payload, { apiKey: API_KEY }, bordfeed);
    const samples = await payload.count({
      collection: "jobs",
      overrideAccess: true,
      where: { origin: { equals: "bordfeed_sample" } },
    });

    expect(result.message).toBe(
      "Connected. The first sync failed: The Bordfeed feed came back empty, so the board kept its current jobs."
    );
    expect(samples.totalDocs).toBe(3);
  });

  test("an expired or locked code asks to start again", async () => {
    const bordfeed = deps();
    behavior.verifyError = new BordfeedApiError({
      code: "code_expired",
      message: "The Bordfeed request failed.",
      status: 410,
    });
    await startConnect(payload, OWNER, bordfeed);
    const result = await submitCode(payload, { code: "424242" }, bordfeed);

    expect(result.message).toBe("The code expired. Start again.");
    expect(result.state).toBe("sample");
  });
});

describe("registration expiry", () => {
  const now = new Date("2026-10-23T09:00:00.000Z");

  test("uses a positive expires_in, else expires_at, else 600 seconds", () => {
    expect(registrationExpiry({ expires_in: 300 }, now)).toBe(
      "2026-10-23T09:05:00.000Z"
    );
    expect(
      registrationExpiry(
        { expires_at: "2026-10-23T09:02:00.000Z", expires_in: 0 },
        now
      )
    ).toBe("2026-10-23T09:02:00.000Z");
    expect(registrationExpiry({ expires_in: -5 }, now)).toBe(
      "2026-10-23T09:10:00.000Z"
    );
    expect(registrationExpiry({}, now)).toBe("2026-10-23T09:10:00.000Z");
  });
});

describe("connect admin guard", () => {
  test("connect actions reject an editor session", () => {
    expect(
      connectAdminDenial({
        email: "editor@example.com",
        roles: ["editor"],
      })
    ).toBe("Only admins can connect Bordfeed.");
    expect(
      connectAdminDenial({
        email: "owner@example.com",
        roles: ["admin"],
      })
    ).toBeNull();
  });
});
