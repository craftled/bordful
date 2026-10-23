import { existsSync } from "node:fs";

import { beforeAll, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_TEST is required for test:int");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
if (!(databaseName.endsWith("_int") || databaseName.endsWith("_test"))) {
  throw new Error(
    `DATABASE_URL_TEST database must end with _int or _test (${databaseName})`
  );
}

process.env.DATABASE_URL = databaseUrl;
process.env.RESEND_API_KEY = "re_test_fake";

import { resolveServerUrl } from "@/config/server-url";
import { periodKey, runAlertDigests } from "@/lib/alerts/digest";
import { alertQueryJson } from "@/lib/alerts/query";
import type { AlertSender, OutgoingEmail } from "@/lib/alerts/sender";
import {
  confirmSubscription,
  subscribeToAlerts,
  unsubscribeByToken,
} from "@/lib/alerts/subscribe";
import { unsubscribeTokenFor } from "@/lib/alerts/tokens";
import { EMPTY_JOB_ALERT_QUERY } from "@/lib/domain/job-vocab";
import { querySiteSettings } from "@/lib/read/queries";
import type { Job } from "@/payload-types";
import { exampleDescription } from "../fixtures/board";
import { loadBoardFixture } from "../fixtures/load";

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");

const payload = await getPayload({ config });

const INBOX_MESSAGE = "Check your inbox to confirm your job alerts.";
const CONFIRM_TOKEN = /[?&]token=([A-Za-z0-9_-]+)/;

interface CapturedEmail {
  idempotencyKey: string;
  message: OutgoingEmail;
}

function recordingSender(target: CapturedEmail[], delayMs = 0): AlertSender {
  return {
    async send(message, idempotencyKey) {
      if (delayMs > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }
      target.push({ idempotencyKey, message });
    },
  };
}

function tokenFrom(message: OutgoingEmail): string {
  const match = message.text.match(CONFIRM_TOKEN);
  if (!match?.[1]) {
    throw new Error("confirmation email is missing a token");
  }
  return match[1];
}

beforeAll(async () => {
  await payload.db.migrateFresh({ forceAcceptWarning: true });
  await loadBoardFixture(payload);
  await payload.updateGlobal({
    data: {
      alerts: {
        defaultFrequency: "weekly",
        enabled: true,
        fromEmail: "alerts@board.example",
        fromName: "Example Board",
      },
      name: "Example Board",
    },
    depth: 0,
    overrideAccess: true,
    slug: "site-settings",
  });
});

test("subscribe, confirm, digest, and unsubscribe", async () => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) {
    throw new Error("PAYLOAD_SECRET is not set.");
  }

  const settings = await querySiteSettings(payload);
  const captured: CapturedEmail[] = [];
  const sender = recordingSender(captured);
  const input = {
    email: "ada@example.com",
    frequency: "weekly" as const,
    now: new Date(),
    query: EMPTY_JOB_ALERT_QUERY,
  };
  const deps = {
    fromEmail: settings.alerts.fromEmail ?? "alerts@board.example",
    fromName: settings.alerts.fromName,
    secret,
    sender,
    siteName: settings.name,
    siteUrl: resolveServerUrl(),
  };

  const first = await subscribeToAlerts(payload, input, deps);
  expect(first).toEqual({ message: INBOX_MESSAGE, ok: true });
  expect(captured).toHaveLength(1);
  expect(captured[0]?.message.to).toBe("ada@example.com");

  const second = await subscribeToAlerts(payload, input, deps);
  expect(second).toEqual({ message: INBOX_MESSAGE, ok: true });
  expect(captured).toHaveLength(1);

  const rows = await payload.find({
    collection: "alert-subscribers",
    depth: 0,
    overrideAccess: true,
    where: { email: { equals: "ada@example.com" } },
  });
  expect(rows.totalDocs).toBe(1);
  expect(rows.docs[0]?.status).toBe("pending");

  const confirmedAt = new Date("2026-10-23T08:00:00.000Z");
  const confirmMessage = captured[0]?.message;
  if (!confirmMessage) {
    throw new Error("confirmation email was not captured");
  }
  const token = tokenFrom(confirmMessage);
  expect(await confirmSubscription(payload, token, confirmedAt)).toBe(true);

  const subscriberId = rows.docs[0]?.id;
  if (subscriberId === undefined) {
    throw new Error("subscriber id is missing");
  }
  const confirmed = await payload.findByID({
    collection: "alert-subscribers",
    depth: 0,
    id: subscriberId,
    overrideAccess: true,
  });
  expect(confirmed.status).toBe("active");
  expect(new Date(confirmed.confirmedAt ?? 0).toISOString()).toBe(
    confirmedAt.toISOString()
  );
  expect(new Date(confirmed.watermark ?? 0).toISOString()).toBe(
    confirmedAt.toISOString()
  );

  await payload.create({
    collection: "jobs",
    data: {
      _status: "published",
      companyName: "Example Co",
      description: exampleDescription as NonNullable<Job["description"]>,
      employmentType: "full-time",
      origin: "manual",
      publishedAt: new Date(
        confirmedAt.getTime() + 60 * 60 * 1000
      ).toISOString(),
      slug: "example-remote-alert-role",
      title: "Example Remote Alert Role",
      workplaceType: "remote",
    },
    depth: 0,
    overrideAccess: true,
  });

  const digestNow = new Date(confirmedAt.getTime() + 8 * 24 * 60 * 60 * 1000);
  const digests: CapturedEmail[] = [];
  const digestSender = recordingSender(digests);
  const sent = await runAlertDigests(payload, {
    now: digestNow,
    sender: digestSender,
  });
  expect(sent).toMatchObject({ sent: 1 });
  expect(digests[0]?.message.text).toContain(
    `${resolveServerUrl()}/jobs/example-remote-alert-role`
  );
  expect(digests[0]?.idempotencyKey).toBe(
    `alerts-${subscriberId}-weekly-${periodKey("weekly", digestNow)}`
  );

  const again = await runAlertDigests(payload, {
    now: digestNow,
    sender: digestSender,
  });
  expect(again).toMatchObject({ due: 0, sent: 0 });
  expect(digests).toHaveLength(1);

  const unsubscribeToken = unsubscribeTokenFor(
    { email: "ada@example.com", id: subscriberId },
    secret
  );
  expect(await unsubscribeByToken(payload, unsubscribeToken)).toBe(true);
  const unsubscribed = await payload.findByID({
    collection: "alert-subscribers",
    depth: 0,
    id: subscriberId,
    overrideAccess: true,
  });
  expect(unsubscribed.status).toBe("unsubscribed");

  const later = new Date(digestNow.getTime() + 8 * 24 * 60 * 60 * 1000);
  const after = await runAlertDigests(payload, {
    now: later,
    sender: digestSender,
  });
  expect(after).toMatchObject({ sent: 0 });
  expect(digests).toHaveLength(1);
});

test("one thousand due subscribers finish within 60 seconds", async () => {
  const confirmedAt = "2020-01-01T00:00:00.000Z";
  let next = 0;
  const workers = Array.from({ length: 8 }, async () => {
    while (next < 1000) {
      const index = next;
      next += 1;
      // biome-ignore lint/performance/noAwaitInLoops: cap inserts at the worker count
      await payload.create({
        collection: "alert-subscribers",
        data: {
          confirmedAt,
          email: `subscriber-${index}@example.com`,
          frequency: "weekly",
          query: alertQueryJson(EMPTY_JOB_ALERT_QUERY),
          status: "active",
        },
        depth: 0,
        overrideAccess: true,
      });
    }
  });
  await Promise.all(workers);

  const captured: CapturedEmail[] = [];
  const started = Date.now();
  const result = await runAlertDigests(payload, {
    now: new Date("2026-10-23T08:00:00.000Z"),
    sender: recordingSender(captured, 5),
  });
  const elapsedMs = Date.now() - started;
  console.info(`alert digest perf ms ${elapsedMs}`);
  expect(elapsedMs).toBeLessThan(60_000);
  expect(result).toMatchObject({ sent: 1000 });
});
