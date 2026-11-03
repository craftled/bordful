import type { Payload } from "payload";

const ENVELOPE = /^v1:[0-9a-f]{16}:[^:]+:[^:]+:[^:]+$/;

export function encryptSecret(payload: Payload, plain: string): string {
  return payload.encrypt(plain);
}

export function decryptSecret(payload: Payload, encrypted: string): string {
  return payload.decrypt(encrypted);
}

export function isEncryptedEnvelope(value: string): boolean {
  return ENVELOPE.test(value);
}
