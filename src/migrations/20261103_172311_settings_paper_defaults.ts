import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "theme_font_heading" SET DEFAULT 'sans';
  ALTER TABLE "site_settings" ALTER COLUMN "theme_font_body" SET DEFAULT 'sans';
  ALTER TABLE "site_settings" ALTER COLUMN "theme_radius" SET DEFAULT 0.5;
  ALTER TABLE "_site_settings_v" ALTER COLUMN "version_theme_font_heading" SET DEFAULT 'sans';
  ALTER TABLE "_site_settings_v" ALTER COLUMN "version_theme_font_body" SET DEFAULT 'sans';
  ALTER TABLE "_site_settings_v" ALTER COLUMN "version_theme_radius" SET DEFAULT 0.5;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "theme_font_heading" SET DEFAULT 'system';
  ALTER TABLE "site_settings" ALTER COLUMN "theme_font_body" SET DEFAULT 'system';
  ALTER TABLE "site_settings" ALTER COLUMN "theme_radius" SET DEFAULT 0.625;
  ALTER TABLE "_site_settings_v" ALTER COLUMN "version_theme_font_heading" SET DEFAULT 'system';
  ALTER TABLE "_site_settings_v" ALTER COLUMN "version_theme_font_body" SET DEFAULT 'system';
  ALTER TABLE "_site_settings_v" ALTER COLUMN "version_theme_radius" SET DEFAULT 0.625;`)
}
