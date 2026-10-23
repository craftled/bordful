import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { sharpTransformer } from "@payloadcms/transformer-sharp";
import { buildConfig, type Payload } from "payload";
import sharp from "sharp";
import { collections } from "./collections";
import { resolvePayloadSecret } from "./config/payload-secret";
import { resolveServerUrl } from "./config/server-url";
import { globals } from "./globals";
import { bordfeedSyncTask } from "./jobs/bordfeed-sync";
import { expireJobsTask } from "./jobs/expire-job";
import { sendAlertsTask } from "./jobs/send-alerts";
import { ensureSampleJobs } from "./lib/bordfeed/sample";
import { stripDashes } from "./lib/codegen/strip-dashes";
import { ensureInstallId } from "./lib/install/install-id";
import { migrations } from "./migrations";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const serverURL = resolveServerUrl();
const secret = resolvePayloadSecret();
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

async function ensureInstallIdSafely(payload: Payload): Promise<void> {
  try {
    await ensureInstallId(payload);
  } catch (error) {
    payload.logger.warn(
      { err: error },
      "Could not ensure the install id. The database may not be migrated yet."
    );
  }
}

export default buildConfig({
  admin: {
    avatar: "default",
    components: {
      beforeDashboard: [
        "/admin/bordfeed-connect/connect-card#BordfeedConnectCard",
        "/admin/components/update-notice#UpdateNotice",
      ],
    },
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " | Bordful" },
    user: "users",
  },
  cli: { commands: { bordful: "./cli/bordful.js#bordfulCommand" } },
  collections,
  cors: [serverURL],
  csrf: [serverURL],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, "migrations"),
    pool: { connectionString: process.env.DATABASE_URL ?? "" },
    prodMigrations: migrations,
    push: false,
  }),
  defaultDepth: 1,
  editor: lexicalEditor(),
  globals,
  graphQL: { disable: true },
  jobs: {
    access: {
      cancel: () => false,
      queue: () => false,
      run: () => false,
    },
    tasks: [bordfeedSyncTask, expireJobsTask, sendAlertsTask],
  },
  maxDepth: 3,
  onInit: async (payload) => {
    // `next build` boots Payload too. Seeding there would call Bordfeed from
    // the build machine and bake the board into the data cache.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return;
    }

    await ensureInstallIdSafely(payload);
    try {
      await ensureSampleJobs(payload, { signal: AbortSignal.timeout(8000) });
    } catch (error) {
      payload.logger.warn(
        { err: error },
        "Could not ensure sample jobs. The board will retry on the next boot."
      );
    }
  },
  secret,
  serverURL,
  storage: [
    vercelBlobStorage({
      collections: { media: true },
      enabled: Boolean(blobToken),
      token: blobToken,
    }),
  ],
  telemetry: false,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
    postProcess: [({ compiledTypes }) => stripDashes(compiledTypes)],
  },
  upload: {
    limits: { fileSize: 5_000_000 },
    transformers: [
      sharpTransformer({
        collections: {
          media: {
            variants: [
              { height: 96, name: "thumb", width: 96 },
              { name: "card", width: 320 },
              { height: 630, name: "og", width: 1200 },
            ],
          },
        },
        sharp,
      }),
    ],
  },
});
