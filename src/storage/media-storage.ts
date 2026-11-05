import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import type { StorageAdapter } from "payload";

import { vercelBlobOidcStorage } from "./vercel-blob-oidc";

export type MediaStorageMode = "token" | "oidc" | "local";

export function mediaStorageMode(
  env: Partial<NodeJS.ProcessEnv> = process.env
): MediaStorageMode {
  if (env.BLOB_READ_WRITE_TOKEN) {
    return "token";
  }

  return env.BLOB_STORE_ID ? "oidc" : "local";
}

// A read-write token wins, so boards that already have one keep Payload's
// adapter. A store connected through OIDC sets only BLOB_STORE_ID. With
// neither, uploads go to the local media directory.
export function resolveMediaStorage(
  env: Partial<NodeJS.ProcessEnv> = process.env
): StorageAdapter {
  const mode = mediaStorageMode(env);
  if (mode === "oidc") {
    return vercelBlobOidcStorage({
      collections: ["media"],
      storeId: env.BLOB_STORE_ID ?? "",
    });
  }

  return vercelBlobStorage({
    collections: { media: true },
    enabled: mode === "token",
    token: env.BLOB_READ_WRITE_TOKEN,
  });
}
