import type { Payload } from "payload";

import { resolveServerUrl } from "@/config/server-url";
import { renderDigestEmail } from "@/emails/digest";
import type { AlertFrequency } from "@/lib/domain/job-vocab";
import { queryPublishedJobs, querySiteSettings } from "@/lib/read/queries";
import type { JobListItem } from "@/lib/read/types";
import type { AlertSubscriber } from "@/payload-types";

import { alertsReady } from "./config";
import { formatFromAddress } from "./from-address";
import { oneClickUnsubscribeUrl, unsubscribePageUrl } from "./links";
import { matchesAlertQuery as jobMatchesQuery } from "./match";
import { mapWithConcurrency } from "./pool";
import { parseAlertQueryFromUnknown } from "./query";
import type { AlertSender, OutgoingEmail } from "./sender";
import { unsubscribeTokenFor } from "./tokens";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DIGEST_LIMIT = 20;
const PAGE_SIZE = 200;
const SEND_CONCURRENCY = 8;

const PERIOD_DAYS: Record<AlertFrequency, number> = {
  daily: 1,
  weekly: 7,
};

export interface DigestSchedule {
  confirmedAt?: string | null;
  frequency: AlertFrequency;
  lastSentAt?: string | null;
  status: string;
}

export interface DigestRunCounts {
  due: number;
  empty: number;
  failed: number;
  sent: number;
}

export type DigestRunResult = { skipped: "not_ready" } | DigestRunCounts;

export function periodKey(frequency: AlertFrequency, now: Date): string {
  if (frequency === "daily") {
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return isoWeekKey(now);
}

function isoWeekKey(now: Date): string {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const days = (date.getTime() - yearStart.getTime()) / DAY_MS;
  const week = Math.ceil((days + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export function idempotencyKey(
  subscriber: { id: number | string },
  frequency: AlertFrequency,
  now: Date
): string {
  return `alerts-${subscriber.id}-${frequency}-${periodKey(frequency, now)}`;
}

export function isDue(subscriber: DigestSchedule, now: Date): boolean {
  if (subscriber.status !== "active") {
    return false;
  }

  const anchorRaw = subscriber.lastSentAt ?? subscriber.confirmedAt;
  if (!anchorRaw) {
    return false;
  }

  const anchor = new Date(anchorRaw).getTime();
  if (Number.isNaN(anchor)) {
    return false;
  }

  const periodMs = PERIOD_DAYS[subscriber.frequency] * DAY_MS;
  return anchor <= now.getTime() - periodMs + HOUR_MS;
}

function publishedMillis(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function inDigestWindow(
  job: JobListItem,
  after: string | null,
  now: Date
): boolean {
  const published = publishedMillis(job.publishedAt);
  const start = publishedMillis(after);
  if (published === null || start === null) {
    return false;
  }
  return published > start && published <= now.getTime();
}

function byNewest(left: JobListItem, right: JobListItem): number {
  const published = (right.publishedAt ?? "").localeCompare(
    left.publishedAt ?? ""
  );
  if (published !== 0) {
    return published;
  }
  return right.id.localeCompare(left.id);
}

export function selectDigestJobs(
  jobs: readonly JobListItem[],
  subscriber: {
    confirmedAt?: string | null;
    query: unknown;
    watermark?: string | null;
  },
  now: Date
): JobListItem[] {
  const query = parseAlertQueryFromUnknown(subscriber.query);
  const after = subscriber.watermark ?? subscriber.confirmedAt ?? null;
  return jobs
    .filter(
      (job) =>
        job.indexable &&
        inDigestWindow(job, after, now) &&
        jobMatchesQuery(job, query)
    )
    .sort(byNewest)
    .slice(0, DIGEST_LIMIT);
}

export const matchesAlertQuery = jobMatchesQuery;

interface DueSubscriber {
  confirmedAt: string | null;
  email: string;
  frequency: AlertFrequency;
  id: number;
  lastSentAt: string | null;
  query: unknown;
  status: AlertSubscriber["status"];
  watermark: string | null;
}

function toDueSubscriber(doc: AlertSubscriber): DueSubscriber {
  return {
    confirmedAt: doc.confirmedAt ?? null,
    email: doc.email,
    frequency: doc.frequency,
    id: doc.id,
    lastSentAt: doc.lastSentAt ?? null,
    query: doc.query,
    status: doc.status,
    watermark: doc.watermark ?? null,
  };
}

function digestMessage(input: {
  from: string;
  jobs: JobListItem[];
  secret: string;
  siteName: string;
  siteUrl: string;
  subscriber: DueSubscriber;
}): OutgoingEmail {
  const token = unsubscribeTokenFor(
    { email: input.subscriber.email, id: input.subscriber.id },
    input.secret
  );
  const unsubscribeUrl = unsubscribePageUrl(input.siteUrl, token);
  const rendered = renderDigestEmail({
    frequency: input.subscriber.frequency,
    jobs: input.jobs,
    siteName: input.siteName,
    siteUrl: input.siteUrl,
    unsubscribeUrl,
  });
  const oneClick = oneClickUnsubscribeUrl(input.siteUrl, token);

  return {
    from: input.from,
    headers: {
      "List-Unsubscribe": `<${oneClick}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    html: rendered.html,
    subject: rendered.subject,
    text: rendered.text,
    to: input.subscriber.email,
  };
}

async function markSent(
  payload: Payload,
  subscriber: DueSubscriber,
  now: Date
): Promise<void> {
  const stamp = now.toISOString();
  await payload.update({
    collection: "alert-subscribers",
    data: { lastSentAt: stamp, watermark: stamp },
    depth: 0,
    id: subscriber.id,
    overrideAccess: true,
  });
}

type Delivery = "empty" | "failed" | "sent" | "skip";

async function deliverDigest(
  payload: Payload,
  subscriber: DueSubscriber,
  jobs: readonly JobListItem[],
  now: Date,
  sender: AlertSender,
  context: { from: string; secret: string; siteName: string; siteUrl: string }
): Promise<Delivery> {
  if (!isDue(subscriber, now)) {
    return "skip";
  }

  const matched = selectDigestJobs(jobs, subscriber, now);
  if (matched.length === 0) {
    return "empty";
  }

  if (context.secret.length === 0) {
    payload.logger.error(
      { subscriberId: String(subscriber.id) },
      "Alert digest send failed"
    );
    return "failed";
  }

  try {
    await sender.send(
      digestMessage({
        from: context.from,
        jobs: matched,
        secret: context.secret,
        siteName: context.siteName,
        siteUrl: context.siteUrl,
        subscriber,
      }),
      idempotencyKey(subscriber, subscriber.frequency, now)
    );
  } catch {
    payload.logger.error(
      { subscriberId: String(subscriber.id) },
      "Alert digest send failed"
    );
    return "failed";
  }

  try {
    await markSent(payload, subscriber, now);
  } catch {
    try {
      await markSent(payload, subscriber, now);
    } catch {
      // The email is already out. Without this write the next cron sends it again.
      payload.logger.fatal(
        { subscriberId: String(subscriber.id) },
        "Alert digest bookkeeping failed after the email was sent"
      );
    }
  }

  return "sent";
}

function countDelivery(counts: DigestRunCounts, delivery: Delivery): void {
  if (delivery === "skip") {
    return;
  }
  counts.due += 1;
  if (delivery === "empty") {
    counts.empty += 1;
  }
  if (delivery === "sent") {
    counts.sent += 1;
  }
  if (delivery === "failed") {
    counts.failed += 1;
  }
}

export async function runAlertDigests(
  payload: Payload,
  deps: { now: Date; sender: AlertSender }
): Promise<DigestRunResult> {
  const settings = await querySiteSettings(payload);
  if (!alertsReady(settings).ready) {
    return { skipped: "not_ready" };
  }

  const { fromEmail, fromName } = settings.alerts;
  if (fromEmail === null) {
    return { skipped: "not_ready" };
  }

  const pool = await queryPublishedJobs(payload, { limit: 1000, page: 1 });
  const siteUrl = resolveServerUrl();
  const secret = process.env.PAYLOAD_SECRET ?? "";
  const context = {
    from: formatFromAddress(fromName, settings.name, fromEmail),
    secret,
    siteName: settings.name,
    siteUrl,
  };
  const counts: DigestRunCounts = { due: 0, empty: 0, failed: 0, sent: 0 };
  let lastId = 0;

  while (lastId >= 0) {
    // Cursor on id so a watermark update cannot move a row onto a page we already passed.
    // biome-ignore lint/performance/noAwaitInLoops: the next id cursor depends on this page
    const result = await payload.find({
      collection: "alert-subscribers",
      depth: 0,
      limit: PAGE_SIZE,
      overrideAccess: true,
      sort: "id",
      where: {
        and: [
          { status: { equals: "active" } },
          { id: { greater_than: lastId } },
        ],
      },
    });
    if (result.docs.length === 0) {
      break;
    }

    lastId = result.docs.reduce(
      (highest, doc) => (doc.id > highest ? doc.id : highest),
      lastId
    );
    await mapWithConcurrency(result.docs, SEND_CONCURRENCY, async (doc) => {
      const delivery = await deliverDigest(
        payload,
        toDueSubscriber(doc),
        pool.items,
        deps.now,
        deps.sender,
        context
      );
      countDelivery(counts, delivery);
    });
  }

  return counts;
}
