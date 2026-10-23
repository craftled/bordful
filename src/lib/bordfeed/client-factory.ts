import type { Payload } from "payload";
import { bordfulConfig } from "@/config";

import { resolveBordfeedBaseUrl } from "./base-url";
import { type BordfeedClient, createBordfeedClient } from "./client";
import { bordfeedClientHeaders } from "./client-header";
import type { ConnectionRecord } from "./connection-machine";
import { readConnection } from "./connection-store";
import { openApiKey } from "./key";

export async function bordfeedClientFor(
  payload: Payload,
  record?: ConnectionRecord
): Promise<BordfeedClient> {
  const current = record ?? (await readConnection(payload));
  const apiKey = current.apiKeyEncrypted
    ? openApiKey(payload, current)
    : undefined;

  return createBordfeedClient({
    apiKey,
    baseUrl: resolveBordfeedBaseUrl(),
    clientHeaders: bordfeedClientHeaders(bordfulConfig),
  });
}
