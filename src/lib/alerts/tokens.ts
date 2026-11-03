import { createHash, createHmac, randomBytes } from "node:crypto";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newConfirmToken(): string {
  return randomBytes(32).toString("base64url");
}

// Derived, not random: the row stores only the hash, and every digest must rebuild the link.
export function unsubscribeTokenFor(
  subscriber: { id: number | string; email: string },
  secret: string
): string {
  return createHmac("sha256", secret)
    .update(`unsubscribe:${subscriber.id}:${subscriber.email}`)
    .digest("base64url");
}
