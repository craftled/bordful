import { existsSync } from "node:fs";

import { beforeEach, describe, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

import type { BordfeedClient } from "@/lib/bordfeed/client";
import { connectAdminDenial } from "@/lib/bordfeed/connect/admin";
import {
  ALREADY_ISSUED_MESSAGE,
  connectedMessage,
  connectedSyncFailedMessage,
  REGISTER_RATE_LIMIT_MESSAGE,
  registeredMessage,
} from "@/lib/bordfeed/connect/messages";
import {
  pasteKey,
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
  type: "createFeed" | "listFeedJobs" | "preview" | "register" | "verify";
}

const calls: Call[] = [];

interface Behavior {
  createFeedFailures: number;
  feedThrows: boolean;
  registerError: BordfeedApiError | null;
  unauthorized: boolean;
  verifyError: BordfeedApiError | null;
}

const behavior: Behavior = {
  createFeedFailures: 0,
  feedThrows: false,
  registerError: null,
  unauthorized: false,
  verifyError: null,
};

const INSTALL_ID_PATTERN = /^[a-f0-9]{64}$/;

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
      description: "Engineering roles.",
      filters: {},
      id: "engineering-it",
      name: "Engineering and IT",
    },
  };
}

function rejectApi(error: BordfeedApiError): Promise<never> {
  return Promise.reject(error);
}

function client(): BordfeedClient {
  return {
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
    async *listFeedJobs(feedId: string) {
      calls.push({ feedId, type: "listFeedJobs" });
      await Promise.resolve();
      if (behavior.feedThrows) {
        throw new BordfeedApiError({
          code: "network",
          message: "Could not reach Bordfeed.",
          status: 0,
        });
      }

      yield jobs("feed", 3);
    },
    listTemplates: () => Promise.reject(new Error("unused")),
    previewTemplate: () => {
      calls.push({ type: "preview" });
      return Promise.resolve(previewBody(jobs("sample", 3)));
    },
    register(body) {
      calls.push({ body, type: "register" });
      if (behavior.registerError) {
        return rejectApi(behavior.registerError);
      }

      return Promise.resolve({
        expires_at: "2026-10-23T09:15:00.000Z",
        registration_id: "reg_mock_0001",
      });
    },
    verify(body) {
      calls.push({ body, type: "verify" });
      if (behavior.verifyError) {
        return rejectApi(behavior.verifyError);
      }

      return Promise.resolve({
        api_key: API_KEY,
        suggested_feed: {
          name: "Example Board",
          template_id: "engineering-it",
        },
      });
    },
  };
}

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_TEST is required for test:int");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
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
      message: registeredMessage("owner@example.com"),
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
      template_id: "engineering-it",
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
    expect(result.message).toBe(connectedMessage(3));
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
      status: 400,
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

  test("register 429 stays on sample and records rate_limited", async () => {
    const bordfeed = deps();
    behavior.registerError = new BordfeedApiError({
      code: "rate_limited",
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
    expect(record.apiKeyEncrypted).toBeNull();
  });

  test("attribution can be hidden only while connected", async () => {
    const rejected = await setShowAttribution(payload, false, deps());
    expect(rejected.message).toBe(
      "attribution can be hidden only while connected"
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

  test("a failed first sync stays on the connected error", async () => {
    const bordfeed = deps();
    behavior.feedThrows = true;
    await startConnect(payload, OWNER, bordfeed);
    const result = await submitCode(payload, { code: "424242" }, bordfeed);
    const record = await readConnection(payload);

    expect(result.state).toBe("error");
    expect(result.message).toBe(
      connectedSyncFailedMessage("Could not reach Bordfeed.")
    );
    expect(record.previousState).toBe("connected");
    expect(record.feedId).toBe(FEED_ID);
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
