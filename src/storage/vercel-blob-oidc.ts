import path from "node:path";

import { cloudStoragePlugin } from "@payloadcms/plugin-cloud-storage";
import type {
  Adapter,
  GeneratedAdapter,
  StaticHandler,
} from "@payloadcms/plugin-cloud-storage/types";
import {
  buildStoragePathData,
  getFilePrefix,
} from "@payloadcms/plugin-cloud-storage/utilities";
import {
  BlobNotFoundError,
  copy,
  del,
  type HeadBlobResult,
  head,
  put,
} from "@vercel/blob";
import type {
  CollectionConfig,
  Config,
  PayloadRequest,
  StorageAdapter,
  TypeWithID,
} from "payload";
import {
  getRangeRequestInfo,
  isXmlMimeType,
  uploadContentSecurityPolicy,
} from "payload/internal";

// Vercel connects new Blob stores through OIDC: the project gets
// BLOB_STORE_ID and a short-lived token per request, and no
// BLOB_READ_WRITE_TOKEN. Payload's own adapter needs that static token, so a
// board deployed with the Deploy button could not upload a logo. This adapter
// covers the same operations and lets the Blob SDK authenticate with OIDC.

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const STORE_PREFIX = "store_";
const MAX_AGE = /(?:^|,)\s*max-age=(?<seconds>\d+)/u;

export function normalizeStoreId(storeId: string): string {
  const trimmed = storeId.trim();
  return trimmed.startsWith(STORE_PREFIX)
    ? trimmed.slice(STORE_PREFIX.length)
    : trimmed;
}

export function publicBlobBaseUrl(storeId: string): string {
  return `https://${normalizeStoreId(storeId).toLowerCase()}.public.blob.vercel-storage.com`;
}

// The public URL of a stored file. Only the filename is encoded, the same as
// Payload's adapter, so both adapters produce the same URL for the same path.
export function blobUrl(baseUrl: string, storageFilePath: string): string {
  const dir = path.posix.dirname(storageFilePath);
  const filename = encodeURIComponent(path.posix.basename(storageFilePath));
  return `${baseUrl}/${dir === "." ? filename : path.posix.join(dir, filename)}`;
}

function isBlobNotFound(error: unknown): boolean {
  return (
    error instanceof BlobNotFoundError ||
    (error !== null &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "BlobNotFoundError")
  );
}

async function copyBlob(
  storeId: string,
  from: string,
  to: string
): Promise<void> {
  if (from === to) {
    throw new Error("Storage copy requires different source and destination");
  }

  const source = await head(from, { storeId });
  try {
    await head(to, { storeId });
    throw new Error(`Storage destination already exists: ${to}`);
  } catch (error) {
    if (!isBlobNotFound(error)) {
      throw error;
    }
  }

  const sourceMaxAge = MAX_AGE.exec(source.cacheControl);
  const copied = await copy(from, to, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: sourceMaxAge
      ? Number(sourceMaxAge.groups?.seconds)
      : ONE_YEAR_SECONDS,
    contentType: source.contentType,
    storeId,
  });

  if (copied.pathname !== to) {
    await del(copied.pathname, { storeId });
    throw new Error(
      `Vercel Blob assigned an unexpected key: ${copied.pathname}`
    );
  }
}

interface ServeBlobArgs {
  collection: CollectionConfig;
  doc?: TypeWithID;
  incoming?: Headers;
  params: Parameters<StaticHandler>[1]["params"];
  prefix: string;
  req: PayloadRequest;
  storeId: string;
}

type RangeInfo = ReturnType<typeof getRangeRequestInfo>;

function responseHeaders(
  args: ServeBlobArgs,
  blob: HeadBlobResult,
  range: RangeInfo,
  etag: string
): Headers {
  const headers = new Headers(args.incoming);
  for (const [key, value] of Object.entries(range.headers)) {
    headers.append(key, value);
  }
  headers.append("Cache-Control", `public, max-age=${ONE_YEAR_SECONDS}`);
  headers.append("Content-Disposition", blob.contentDisposition);
  headers.append("Content-Type", blob.contentType);
  headers.append("ETag", etag);
  if (isXmlMimeType(blob.contentType)) {
    headers.append("Content-Security-Policy", uploadContentSecurityPolicy);
  }

  const { upload } = args.collection;
  if (
    args.params.operation !== "transform" &&
    typeof upload === "object" &&
    typeof upload.modifyResponseHeaders === "function"
  ) {
    return upload.modifyResponseHeaders({ headers }) || headers;
  }

  return headers;
}

async function readBlob(args: ServeBlobArgs): Promise<Response> {
  const { collection, doc, params, prefix, req, storeId } = args;
  const isTransformSource = params.operation === "transform";
  const docPrefix = await getFilePrefix({
    collection,
    collectionPrefix: prefix,
    doc,
    filename: params.filename,
    req,
    uploadReference: params.uploadReference,
    useCompositePrefixes: false,
  });
  const { storageFilePath } = buildStoragePathData({
    collectionPrefix: prefix,
    docPrefix,
    filename: params.filename,
    useCompositePrefixes: false,
  });
  const blob = await head(storageFilePath, { storeId });
  const uploadedAt = blob.uploadedAt.toISOString();
  const etag = `"${storageFilePath}-${uploadedAt}"`;

  const range = getRangeRequestInfo({
    fileSize: blob.size,
    rangeHeader: isTransformSource ? null : req.headers.get("range"),
  });
  if (range.type === "invalid") {
    return new Response(null, {
      headers: new Headers(range.headers),
      status: range.status,
    });
  }

  const headers = responseHeaders(args, blob, range, etag);
  const requestEtag =
    req.headers.get("etag") || req.headers.get("if-none-match");
  if (!isTransformSource && requestEtag === etag) {
    return new Response(null, { headers, status: 304 });
  }

  const response = await fetch(`${blob.url}?${uploadedAt}`, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      ...(range.type === "partial" && {
        Range: `bytes=${range.rangeStart}-${range.rangeEnd}`,
      }),
    },
  });
  if (response.ok && response.body) {
    headers.append("Last-Modified", uploadedAt);
    return new Response(response.body, { headers, status: range.status });
  }

  // A transformer needs the real failure status. A plain download gets 204.
  return isTransformSource
    ? new Response(null, {
        status: response.status,
        statusText: response.statusText,
      })
    : new Response(null, { status: 204, statusText: "No Content" });
}

async function serveBlob(args: ServeBlobArgs): Promise<Response> {
  try {
    return await readBlob(args);
  } catch (error) {
    if (isBlobNotFound(error)) {
      return new Response(null, { status: 404, statusText: "Not Found" });
    }
    args.req.payload.logger.error({
      err: error,
      msg: "Unexpected error in the Blob static handler",
    });
    return new Response("Internal Server Error", { status: 500 });
  }
}

function createAdapter(storeId: string): Adapter {
  const baseUrl = publicBlobBaseUrl(storeId);

  return ({ collection, prefix = "" }): GeneratedAdapter => {
    const deleteStoredFile: GeneratedAdapter["deleteFile"] = async ({
      storageFilePath,
    }) => {
      await del(storageFilePath, { storeId });
    };

    return {
      copyFile: ({ from, to }) => copyBlob(storeId, from, to),
      deleteFile: deleteStoredFile,
      generateURL: ({ filename, prefix: docPrefix = "" }) =>
        blobUrl(
          baseUrl,
          buildStoragePathData({
            collectionPrefix: prefix,
            docPrefix,
            filename,
            useCompositePrefixes: false,
          }).storageFilePath
        ),
      handleDelete: deleteStoredFile,
      handleUpload: async ({ data, file, storageFilePath }) => {
        await put(storageFilePath, file.buffer, {
          access: "public",
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: ONE_YEAR_SECONDS,
          contentType: file.mimeType,
          storeId,
        });
        return data;
      },
      name: "vercel-blob-oidc",
      staticHandler: (req, { doc, headers, params }) =>
        serveBlob({
          collection,
          doc,
          incoming: headers,
          params,
          prefix,
          req,
          storeId,
        }),
    };
  };
}

export function vercelBlobOidcStorage(options: {
  collections: string[];
  storeId: string;
}): StorageAdapter {
  const adapter = createAdapter(normalizeStoreId(options.storeId));
  const slugs = new Set(options.collections);

  return {
    collections: options.collections,
    init: (incoming: Config): Config => {
      const config: Config = {
        ...incoming,
        collections: (incoming.collections ?? []).map((collection) =>
          slugs.has(collection.slug)
            ? {
                ...collection,
                upload: {
                  ...(typeof collection.upload === "object"
                    ? collection.upload
                    : {}),
                  disableLocalStorage: true,
                },
              }
            : collection
        ),
      };

      return cloudStoragePlugin({
        collections: Object.fromEntries(
          options.collections.map((slug) => [slug, { adapter }])
        ),
      })(config);
    },
    name: "vercel-blob-oidc",
  };
}
