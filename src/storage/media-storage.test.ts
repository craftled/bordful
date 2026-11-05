import type { GeneratedAdapter } from "@payloadcms/plugin-cloud-storage/types";
import type { CollectionConfig, Config } from "payload";
import { beforeEach, expect, test, vi } from "vitest";

import { mediaStorageMode, resolveMediaStorage } from "./media-storage";
import {
  blobUrl,
  normalizeStoreId,
  publicBlobBaseUrl,
  vercelBlobOidcStorage,
} from "./vercel-blob-oidc";

const blob = vi.hoisted(() => ({
  copy: vi.fn(),
  del: vi.fn(),
  head: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  ...blob,
  BlobNotFoundError: class BlobNotFoundError extends Error {
    name = "BlobNotFoundError";
  },
}));

const captured = vi.hoisted(() => ({
  options: undefined as
    | { collections: Record<string, { adapter: unknown }> }
    | undefined,
}));

vi.mock("@payloadcms/plugin-cloud-storage", () => ({
  cloudStoragePlugin: (options: typeof captured.options) => {
    captured.options = options;
    return (config: unknown) => config;
  },
}));

const media = { slug: "media", upload: true } as unknown as CollectionConfig;

function generatedAdapter(): GeneratedAdapter {
  const storage = vercelBlobOidcStorage({
    collections: ["media"],
    storeId: "store_AbC123",
  });
  storage.init({ collections: [media] } as unknown as Config);
  const adapter = captured.options?.collections.media?.adapter as (args: {
    collection: CollectionConfig;
  }) => GeneratedAdapter;
  return adapter({ collection: media });
}

beforeEach(() => {
  vi.clearAllMocks();
  captured.options = undefined;
});

test("a read-write token keeps Payload's adapter", () => {
  expect(
    mediaStorageMode({
      BLOB_READ_WRITE_TOKEN: "set",
      BLOB_STORE_ID: "store_abc123",
    })
  ).toBe("token");
});

test("a store connected through OIDC uses the OIDC adapter", () => {
  const env = { BLOB_STORE_ID: "store_abc123" };
  expect(mediaStorageMode(env)).toBe("oidc");
  expect(resolveMediaStorage(env).name).toBe("vercel-blob-oidc");
});

test("no Blob variables means local media storage", () => {
  expect(mediaStorageMode({})).toBe("local");
  expect(resolveMediaStorage({}).name).toBe("vercel-blob");
});

test("store ids lose their prefix and the host is lower case", () => {
  expect(normalizeStoreId(" store_AbC123 ")).toBe("AbC123");
  expect(normalizeStoreId("AbC123")).toBe("AbC123");
  expect(publicBlobBaseUrl("store_AbC123")).toBe(
    "https://abc123.public.blob.vercel-storage.com"
  );
});

test("only the filename of a blob URL is encoded", () => {
  expect(blobUrl("https://x.test", "media/a b/my logo.png")).toBe(
    "https://x.test/media/a b/my%20logo.png"
  );
  expect(blobUrl("https://x.test", "logo.png")).toBe("https://x.test/logo.png");
});

test("init turns off local storage for the media collection", () => {
  const storage = vercelBlobOidcStorage({
    collections: ["media"],
    storeId: "store_AbC123",
  });
  const other = { slug: "jobs" } as unknown as CollectionConfig;
  const config = storage.init({
    collections: [media, other],
  } as unknown as Config) as Config;

  expect(config.collections?.[0]?.upload).toEqual({
    disableLocalStorage: true,
  });
  expect(config.collections?.[1]).toBe(other);
});

test("uploads and deletes pass the store id and no token", async () => {
  const adapter = generatedAdapter();
  const data = { filename: "logo.png" };
  const buffer = Buffer.from("png");

  const result = await adapter.handleUpload({
    collection: media,
    data,
    file: { buffer, mimeType: "image/png" } as never,
    req: {} as never,
    storageFilePath: "logo.png",
  });

  expect(result).toBe(data);
  expect(blob.put).toHaveBeenCalledWith(
    "logo.png",
    buffer,
    expect.objectContaining({
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png",
      storeId: "AbC123",
    })
  );
  expect(blob.put.mock.calls[0]?.[2]).not.toHaveProperty("token");

  await adapter.deleteFile({
    collection: media,
    req: {} as never,
    storageFilePath: "logo.png",
  });
  expect(blob.del).toHaveBeenCalledWith("logo.png", { storeId: "AbC123" });
});

test("generateURL points at the public store host", async () => {
  const adapter = generatedAdapter();
  const url = await adapter.generateURL?.({
    collection: media,
    data: {},
    filename: "my logo.png",
  });

  expect(url).toBe(
    "https://abc123.public.blob.vercel-storage.com/my%20logo.png"
  );
});

test("copyFile refuses to overwrite an existing destination", async () => {
  const adapter = generatedAdapter();
  blob.head.mockResolvedValue({ cacheControl: "", contentType: "image/png" });

  await expect(
    adapter.copyFile({ from: "a.png", to: "b.png" } as never)
  ).rejects.toThrow("Storage destination already exists: b.png");
  expect(blob.copy).not.toHaveBeenCalled();
});
