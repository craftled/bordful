import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_sessions" ADD COLUMN "refresh_count" numeric;
  ALTER TABLE "users_sessions" ADD COLUMN "refreshed_at" timestamp(3) with time zone;
  ALTER TABLE "users_sessions" ADD COLUMN "label" varchar;
  ALTER TABLE "users_sessions" ADD COLUMN "type" varchar;
  ALTER TABLE "users_sessions" ADD COLUMN "metadata" jsonb;
  ALTER TABLE "media" ADD COLUMN "_stored" boolean;
  ALTER TABLE "media" ADD COLUMN "_transforms" jsonb;
  ALTER TABLE "media" ADD COLUMN "original__stored" boolean;
  ALTER TABLE "media" ADD COLUMN "variants_thumb__stored" boolean;
  ALTER TABLE "media" ADD COLUMN "variants_card__stored" boolean;
  ALTER TABLE "media" ADD COLUMN "variants_og__stored" boolean;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_sessions" DROP COLUMN "refresh_count";
  ALTER TABLE "users_sessions" DROP COLUMN "refreshed_at";
  ALTER TABLE "users_sessions" DROP COLUMN "label";
  ALTER TABLE "users_sessions" DROP COLUMN "type";
  ALTER TABLE "users_sessions" DROP COLUMN "metadata";
  ALTER TABLE "media" DROP COLUMN "_stored";
  ALTER TABLE "media" DROP COLUMN "_transforms";
  ALTER TABLE "media" DROP COLUMN "original__stored";
  ALTER TABLE "media" DROP COLUMN "variants_thumb__stored";
  ALTER TABLE "media" DROP COLUMN "variants_card__stored";
  ALTER TABLE "media" DROP COLUMN "variants_og__stored";`)
}
