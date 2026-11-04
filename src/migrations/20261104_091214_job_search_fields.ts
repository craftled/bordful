import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "jobs_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "_jobs_v_version_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "jobs" ADD COLUMN "summary" varchar;
  ALTER TABLE "_jobs_v" ADD COLUMN "version_summary" varchar;
  ALTER TABLE "jobs_skills" ADD CONSTRAINT "jobs_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_version_skills" ADD CONSTRAINT "_jobs_v_version_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "jobs_skills_order_idx" ON "jobs_skills" USING btree ("_order");
  CREATE INDEX "jobs_skills_parent_id_idx" ON "jobs_skills" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_version_skills_order_idx" ON "_jobs_v_version_skills" USING btree ("_order");
  CREATE INDEX "_jobs_v_version_skills_parent_id_idx" ON "_jobs_v_version_skills" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "jobs_skills" CASCADE;
  DROP TABLE "_jobs_v_version_skills" CASCADE;
  ALTER TABLE "jobs" DROP COLUMN "summary";
  ALTER TABLE "_jobs_v" DROP COLUMN "version_summary";`)
}
