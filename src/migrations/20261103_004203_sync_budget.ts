import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bordfeed_connection" ALTER COLUMN "template_id" SET DEFAULT 'fully-remote';
  ALTER TABLE "bordfeed_connection" ADD COLUMN "jobs_per_sync" numeric DEFAULT 50;
  ALTER TABLE "bordfeed_connection" ADD COLUMN "jobs_per_day" numeric DEFAULT 200;
  ALTER TABLE "bordfeed_connection" ADD COLUMN "sync_state" jsonb;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bordfeed_connection" ALTER COLUMN "template_id" SET DEFAULT 'remote-engineering';
  ALTER TABLE "bordfeed_connection" DROP COLUMN "jobs_per_sync";
  ALTER TABLE "bordfeed_connection" DROP COLUMN "jobs_per_day";
  ALTER TABLE "bordfeed_connection" DROP COLUMN "sync_state";`)
}
