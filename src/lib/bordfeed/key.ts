import type { Payload } from "payload";

import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";

import type { ConnectionRecord } from "./connection-machine";

export function sealApiKey(
  payload: Payload,
  apiKey: string
): { apiKeyEncrypted: string; keyHint: string } {
  const trimmed = apiKey.trim();
  return {
    apiKeyEncrypted: encryptSecret(payload, trimmed),
    keyHint: `bf_...${trimmed.slice(-4)}`,
  };
}

function decryptOrNull(payload: Payload, value: string): string | null {
  try {
    return decryptSecret(payload, value);
  } catch {
    return null;
  }
}

export function openApiKey(payload: Payload, record: ConnectionRecord): string {
  if (!record.apiKeyEncrypted) {
    throw new Error("Bordfeed API key is missing.");
  }

  const opened = decryptOrNull(payload, record.apiKeyEncrypted);
  if (opened === null) {
    throw new Error("The saved Bordfeed API key could not be read.");
  }

  return opened;
}
