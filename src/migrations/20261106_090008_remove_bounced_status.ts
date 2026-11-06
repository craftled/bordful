import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "alert_subscribers" SET "status" = 'unsubscribed' WHERE "status" = 'bounced';
  ALTER TABLE "alert_subscribers" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "alert_subscribers" ALTER COLUMN "status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_alert_subscribers_status";
  CREATE TYPE "public"."enum_alert_subscribers_status" AS ENUM('pending', 'active', 'unsubscribed');
  ALTER TABLE "alert_subscribers" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_alert_subscribers_status";
  ALTER TABLE "alert_subscribers" ALTER COLUMN "status" SET DATA TYPE "public"."enum_alert_subscribers_status" USING "status"::"public"."enum_alert_subscribers_status";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_alert_subscribers_status" ADD VALUE 'bounced';`)
}
