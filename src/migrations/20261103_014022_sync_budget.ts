import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

// bordfeed_sync_state is not a Payload collection or global. Only
// src/lib/bordfeed/sync-budget.ts reads and writes it, with raw SQL, so a
// Payload save of the Bordfeed connection can never wind back sync usage.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bordfeed_connection" ALTER COLUMN "template_id" SET DEFAULT 'fully-remote';
  ALTER TABLE "bordfeed_connection" ADD COLUMN "jobs_per_sync" numeric;
  ALTER TABLE "bordfeed_connection" ADD COLUMN "jobs_per_day" numeric;
  CREATE TABLE "bordfeed_sync_state" (
    "id" integer PRIMARY KEY CHECK ("id" = 1),
    "state" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "lease_token" text,
    "lease_until" timestamp(3) with time zone
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "bordfeed_sync_state";
  ALTER TABLE "bordfeed_connection" ALTER COLUMN "template_id" SET DEFAULT 'remote-engineering';
  ALTER TABLE "bordfeed_connection" DROP COLUMN "jobs_per_sync";
  ALTER TABLE "bordfeed_connection" DROP COLUMN "jobs_per_day";`)
}
