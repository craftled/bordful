import type { Payload } from "payload";

import { renderConfirmEmail } from "@/emails/confirm";
import type { AlertFrequency, JobAlertQuery } from "@/lib/domain/job-vocab";
import type { AlertSubscriber } from "@/payload-types";

import { formatFromAddress } from "./from-address";
import { confirmUrl } from "./links";
import { alertQueryJson, parseAlertQueryFromUnknown } from "./query";
import { confirmationIsRecent } from "./rate-limit";
import type { AlertSender } from "./sender";
import { hashToken, newConfirmToken, unsubscribeTokenFor } from "./tokens";

export const SUBSCRIBE_OK_MESSAGE =
  "Check your inbox to confirm your job alerts.";

export const SUBSCRIBE_UNAVAILABLE_MESSAGE =
  "Job alerts are not available on this board.";

export const SUBSCRIBE_SEND_FAILED_MESSAGE =
  "Could not send the confirmation email. Try again later.";

export interface SubscribeInput {
  email: string;
  frequency: AlertFrequency;
  now: Date;
  query: JobAlertQuery;
}

export interface SubscribeDeps {
  fromEmail: string;
  fromName: string;
  secret: string;
  sender: AlertSender;
  siteName: string;
  siteUrl: string;
}

export interface SubscribeResult {
  message: string;
  ok: boolean;
}

async function findByEmail(
  payload: Payload,
  email: string
): Promise<AlertSubscriber | null> {
  const found = await payload.find({
    collection: "alert-subscribers",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: email } },
  });
  return found.docs[0] ?? null;
}

async function storeUnsubscribeHash(
  payload: Payload,
  id: number,
  email: string,
  secret: string
): Promise<void> {
  const token = unsubscribeTokenFor({ email, id }, secret);
  await payload.update({
    collection: "alert-subscribers",
    data: { unsubscribeTokenHash: hashToken(token) },
    depth: 0,
    id,
    overrideAccess: true,
  });
}

async function savePending(
  payload: Payload,
  existing: AlertSubscriber | null,
  input: SubscribeInput,
  confirmTokenHash: string
): Promise<number> {
  const data = {
    confirmTokenHash,
    frequency: input.frequency,
    query: alertQueryJson(input.query),
    status: "pending" as const,
  };

  if (existing) {
    await payload.update({
      collection: "alert-subscribers",
      data,
      depth: 0,
      id: existing.id,
      overrideAccess: true,
    });
    return existing.id;
  }

  const created = await payload.create({
    collection: "alert-subscribers",
    data: { ...data, email: input.email },
    depth: 0,
    overrideAccess: true,
  });
  return created.id;
}

async function sendConfirmation(
  deps: SubscribeDeps,
  input: SubscribeInput,
  id: number,
  confirmToken: string,
  confirmTokenHash: string
): Promise<void> {
  const rendered = renderConfirmEmail({
    confirmUrl: confirmUrl(deps.siteUrl, confirmToken),
    siteName: deps.siteName,
  });
  await deps.sender.send(
    {
      from: formatFromAddress(deps.fromName, deps.siteName, deps.fromEmail),
      headers: {},
      html: rendered.html,
      subject: rendered.subject,
      text: rendered.text,
      to: input.email,
    },
    `alerts-confirm-${id}-${confirmTokenHash}`
  );
}

async function deleteSubscriber(payload: Payload, id: number): Promise<void> {
  await payload.delete({
    collection: "alert-subscribers",
    depth: 0,
    id,
    overrideAccess: true,
  });
}

function logConfirmationFailure(payload: Payload, id: number): void {
  payload.logger.error(
    { subscriberId: String(id) },
    "Alert confirmation send failed"
  );
}

export async function subscribeToAlerts(
  payload: Payload,
  input: SubscribeInput,
  deps: SubscribeDeps
): Promise<SubscribeResult> {
  const existing = await findByEmail(payload, input.email);
  // updatedAt also moves on unsubscribe and on a failed attempt. Only a
  // pending row means a confirmation email was just stored.
  const cooling =
    existing?.status === "pending" &&
    confirmationIsRecent(existing.updatedAt, input.now);
  if (existing?.status === "active" || cooling) {
    return { message: SUBSCRIBE_OK_MESSAGE, ok: true };
  }

  const confirmToken = newConfirmToken();
  const confirmTokenHash = hashToken(confirmToken);

  if (existing === null) {
    const id = await savePending(payload, null, input, confirmTokenHash);
    try {
      await storeUnsubscribeHash(payload, id, input.email, deps.secret);
      await sendConfirmation(deps, input, id, confirmToken, confirmTokenHash);
    } catch {
      try {
        await deleteSubscriber(payload, id);
      } catch {
        payload.logger.error(
          { subscriberId: String(id) },
          "Alert confirmation cleanup failed"
        );
      }
      logConfirmationFailure(payload, id);
      return { message: SUBSCRIBE_SEND_FAILED_MESSAGE, ok: false };
    }
    return { message: SUBSCRIBE_OK_MESSAGE, ok: true };
  }

  // Persist after a successful send. Writing first would refresh updatedAt
  // and the pending cooldown would hide the retry when the send failed.
  try {
    await sendConfirmation(
      deps,
      input,
      existing.id,
      confirmToken,
      confirmTokenHash
    );
  } catch {
    logConfirmationFailure(payload, existing.id);
    return { message: SUBSCRIBE_SEND_FAILED_MESSAGE, ok: false };
  }

  await savePending(payload, existing, input, confirmTokenHash);
  await storeUnsubscribeHash(payload, existing.id, input.email, deps.secret);
  return { message: SUBSCRIBE_OK_MESSAGE, ok: true };
}

async function findByHash(
  payload: Payload,
  field: "confirmTokenHash" | "unsubscribeTokenHash",
  token: string,
  status?: AlertSubscriber["status"]
): Promise<AlertSubscriber | null> {
  const hash = hashToken(token);
  const found = await payload.find({
    collection: "alert-subscribers",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: status
      ? {
          and: [{ [field]: { equals: hash } }, { status: { equals: status } }],
        }
      : { [field]: { equals: hash } },
  });
  return found.docs[0] ?? null;
}

export async function findPendingAlert(
  payload: Payload,
  token: string
): Promise<{ query: JobAlertQuery } | null> {
  const doc = await findByHash(payload, "confirmTokenHash", token, "pending");
  if (!doc) {
    return null;
  }
  return { query: parseAlertQueryFromUnknown(doc.query) };
}

export async function findUnsubscribeAlert(
  payload: Payload,
  token: string
): Promise<{ id: number } | null> {
  const doc = await findByHash(payload, "unsubscribeTokenHash", token);
  if (!doc) {
    return null;
  }
  return { id: doc.id };
}

export async function confirmSubscription(
  payload: Payload,
  token: string,
  now: Date
): Promise<boolean> {
  const doc = await findByHash(payload, "confirmTokenHash", token, "pending");
  if (!doc) {
    return false;
  }

  const stamp = now.toISOString();
  await payload.update({
    collection: "alert-subscribers",
    data: {
      confirmedAt: stamp,
      confirmTokenHash: null,
      // isDue anchors on lastSentAt before confirmedAt. A returning
      // subscriber would otherwise be due on the old cadence immediately.
      lastSentAt: null,
      status: "active",
      watermark: stamp,
    },
    depth: 0,
    id: doc.id,
    overrideAccess: true,
  });
  return true;
}

export async function unsubscribeByToken(
  payload: Payload,
  token: string
): Promise<boolean> {
  const doc = await findByHash(payload, "unsubscribeTokenHash", token);
  if (!doc) {
    return false;
  }

  if (doc.status !== "unsubscribed") {
    await payload.update({
      collection: "alert-subscribers",
      data: { status: "unsubscribed" },
      depth: 0,
      id: doc.id,
      overrideAccess: true,
    });
  }

  return true;
}
