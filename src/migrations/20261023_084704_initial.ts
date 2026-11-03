import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_companies_origin" AS ENUM('manual', 'paid', 'bordfeed', 'bordfeed_sample');
  CREATE TYPE "public"."enum_jobs_career_level" AS ENUM('Internship', 'Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level', 'Founder');
  CREATE TYPE "public"."enum_jobs_employment_type" AS ENUM('full-time', 'part-time', 'contract', 'temporary', 'internship', 'volunteer', 'per-diem', 'other');
  CREATE TYPE "public"."enum_jobs_workplace_type" AS ENUM('onsite', 'hybrid', 'remote');
  CREATE TYPE "public"."enum_jobs_seniority" AS ENUM('intern', 'entry', 'mid', 'senior', 'lead', 'principal', 'director', 'vp', 'c_level');
  CREATE TYPE "public"."enum_jobs_origin" AS ENUM('manual', 'paid', 'bordfeed', 'bordfeed_sample');
  CREATE TYPE "public"."enum_jobs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__jobs_v_version_career_level" AS ENUM('Internship', 'Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level', 'Founder');
  CREATE TYPE "public"."enum__jobs_v_version_employment_type" AS ENUM('full-time', 'part-time', 'contract', 'temporary', 'internship', 'volunteer', 'per-diem', 'other');
  CREATE TYPE "public"."enum__jobs_v_version_workplace_type" AS ENUM('onsite', 'hybrid', 'remote');
  CREATE TYPE "public"."enum__jobs_v_version_seniority" AS ENUM('intern', 'entry', 'mid', 'senior', 'lead', 'principal', 'director', 'vp', 'c_level');
  CREATE TYPE "public"."enum__jobs_v_version_origin" AS ENUM('manual', 'paid', 'bordfeed', 'bordfeed_sample');
  CREATE TYPE "public"."enum__jobs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_alert_subscribers_status" AS ENUM('pending', 'active', 'unsubscribed', 'bounced');
  CREATE TYPE "public"."enum_alert_subscribers_frequency" AS ENUM('weekly', 'daily');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'bordfeed-sync', 'expire-jobs', 'send-alerts');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_log_parent_task_slug" AS ENUM('inline', 'bordfeed-sync', 'expire-jobs', 'send-alerts');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'bordfeed-sync', 'expire-jobs', 'send-alerts');
  CREATE TYPE "public"."enum_payload_llm_instructions_entity_type" AS ENUM('collection', 'global');
  CREATE TYPE "public"."enum_site_settings_board_public_detail_fields" AS ENUM('salary', 'location', 'employmentType', 'workplaceType', 'careerLevel', 'languages', 'categories', 'validThrough');
  CREATE TYPE "public"."enum_site_settings_theme_font_heading" AS ENUM('system', 'sans', 'serif', 'mono');
  CREATE TYPE "public"."enum_site_settings_theme_font_body" AS ENUM('system', 'sans', 'serif', 'mono');
  CREATE TYPE "public"."enum_site_settings_alerts_default_frequency" AS ENUM('weekly', 'daily');
  CREATE TYPE "public"."enum__site_settings_v_version_board_public_detail_fields" AS ENUM('salary', 'location', 'employmentType', 'workplaceType', 'careerLevel', 'languages', 'categories', 'validThrough');
  CREATE TYPE "public"."enum__site_settings_v_version_theme_font_heading" AS ENUM('system', 'sans', 'serif', 'mono');
  CREATE TYPE "public"."enum__site_settings_v_version_theme_font_body" AS ENUM('system', 'sans', 'serif', 'mono');
  CREATE TYPE "public"."enum__site_settings_v_version_alerts_default_frequency" AS ENUM('weekly', 'daily');
  CREATE TYPE "public"."enum_bordfeed_connection_state" AS ENUM('sample', 'awaiting_code', 'connected', 'error');
  CREATE TYPE "public"."enum_bordfeed_connection_previous_state" AS ENUM('sample', 'connected');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"api_key" varchar,
  	"api_key_last4" varchar,
  	"api_key_index" varchar,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"prefix" varchar DEFAULT '',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"original_filename" varchar,
  	"original_url" varchar,
  	"original_mime_type" varchar,
  	"original_filesize" numeric,
  	"original_width" numeric,
  	"original_height" numeric,
  	"original_prefix" varchar,
  	"original__objectkey" varchar,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"variants_thumb_url" varchar,
  	"variants_thumb_width" numeric,
  	"variants_thumb_height" numeric,
  	"variants_thumb_mime_type" varchar,
  	"variants_thumb_filesize" numeric,
  	"variants_thumb_filename" varchar,
  	"variants_thumb_prefix" varchar,
  	"variants_thumb__objectkey" varchar,
  	"variants_card_url" varchar,
  	"variants_card_width" numeric,
  	"variants_card_height" numeric,
  	"variants_card_mime_type" varchar,
  	"variants_card_filesize" numeric,
  	"variants_card_filename" varchar,
  	"variants_card_prefix" varchar,
  	"variants_card__objectkey" varchar,
  	"variants_og_url" varchar,
  	"variants_og_width" numeric,
  	"variants_og_height" numeric,
  	"variants_og_mime_type" varchar,
  	"variants_og_filesize" numeric,
  	"variants_og_filename" varchar,
  	"variants_og_prefix" varchar,
  	"variants_og__objectkey" varchar
  );
  
  CREATE TABLE "media_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "companies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"logo_id" integer,
  	"logo_url" varchar,
  	"domain" varchar,
  	"website" varchar,
  	"careers_url" varchar,
  	"linkedin_url" varchar,
  	"twitter_url" varchar,
  	"description" jsonb,
  	"industry" varchar,
  	"location" varchar,
  	"headcount" numeric,
  	"origin" "enum_companies_origin" DEFAULT 'manual' NOT NULL,
  	"bordfeed_company_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "companies_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "jobs_career_level" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_jobs_career_level",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "jobs_languages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "jobs_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"company_id" integer,
  	"company_name" varchar,
  	"company_slug" varchar,
  	"company_logo_id" integer,
  	"company_domain" varchar,
  	"description" jsonb,
  	"apply_url" varchar,
  	"apply_email" varchar,
  	"apply_method" varchar,
  	"employment_type" "enum_jobs_employment_type",
  	"workplace_type" "enum_jobs_workplace_type",
  	"location_display" varchar,
  	"locality" varchar,
  	"region" varchar,
  	"country_code" varchar,
  	"remote_region" varchar,
  	"salary_min" numeric,
  	"salary_max" numeric,
  	"salary_currency" varchar,
  	"salary_min_usd" numeric,
  	"salary_max_usd" numeric,
  	"seniority" "enum_jobs_seniority",
  	"visa_sponsorship" varchar,
  	"featured" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"valid_through" timestamp(3) with time zone,
  	"origin" "enum_jobs_origin" DEFAULT 'manual',
  	"bordfeed_job_id" varchar,
  	"bordfeed_description_hash" varchar,
  	"source_listing_url" varchar,
  	"payment_reference" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_jobs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "jobs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "_jobs_v_version_career_level" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__jobs_v_version_career_level",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_jobs_v_version_languages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_jobs_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_jobs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_company_id" integer,
  	"version_company_name" varchar,
  	"version_company_slug" varchar,
  	"version_company_logo_id" integer,
  	"version_company_domain" varchar,
  	"version_description" jsonb,
  	"version_apply_url" varchar,
  	"version_apply_email" varchar,
  	"version_apply_method" varchar,
  	"version_employment_type" "enum__jobs_v_version_employment_type",
  	"version_workplace_type" "enum__jobs_v_version_workplace_type",
  	"version_location_display" varchar,
  	"version_locality" varchar,
  	"version_region" varchar,
  	"version_country_code" varchar,
  	"version_remote_region" varchar,
  	"version_salary_min" numeric,
  	"version_salary_max" numeric,
  	"version_salary_currency" varchar,
  	"version_salary_min_usd" numeric,
  	"version_salary_max_usd" numeric,
  	"version_seniority" "enum__jobs_v_version_seniority",
  	"version_visa_sponsorship" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_published_at" timestamp(3) with time zone,
  	"version_valid_through" timestamp(3) with time zone,
  	"version_origin" "enum__jobs_v_version_origin" DEFAULT 'manual',
  	"version_bordfeed_job_id" varchar,
  	"version_bordfeed_description_hash" varchar,
  	"version_source_listing_url" varchar,
  	"version_payment_reference" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__jobs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_jobs_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "alert_subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"status" "enum_alert_subscribers_status" DEFAULT 'pending' NOT NULL,
  	"query" jsonb DEFAULT '{"languages":[],"remote":false,"salary":[],"seniority":[],"types":[],"visa":false}'::jsonb,
  	"frequency" "enum_alert_subscribers_frequency" DEFAULT 'weekly' NOT NULL,
  	"confirm_token_hash" varchar,
  	"unsubscribe_token_hash" varchar,
  	"watermark" timestamp(3) with time zone,
  	"last_sent_at" timestamp(3) with time zone,
  	"confirmed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb NOT NULL,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb,
  	"parent_task_slug" "enum_payload_jobs_log_parent_task_slug",
  	"parent_task_i_d" varchar
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"meta" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing_until" timestamp(3) with time zone,
  	"processing_token" varchar,
  	"concurrency_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"companies_id" integer,
  	"jobs_id" integer,
  	"alert_subscribers_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_llm_instructions" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"entity_slug" varchar NOT NULL,
  	"entity_type" "enum_payload_llm_instructions_entity_type" NOT NULL,
  	"additional_instructions" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_llm_instructions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "site_settings_board_public_detail_fields" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_site_settings_board_public_detail_fields",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'Job Board' NOT NULL,
  	"tagline" varchar DEFAULT '',
  	"logo_id" integer,
  	"theme_colors_background" varchar,
  	"theme_colors_foreground" varchar,
  	"theme_colors_primary" varchar,
  	"theme_colors_primary_foreground" varchar,
  	"theme_colors_muted" varchar,
  	"theme_colors_muted_foreground" varchar,
  	"theme_colors_accent" varchar,
  	"theme_colors_accent_foreground" varchar,
  	"theme_colors_border" varchar,
  	"theme_colors_ring" varchar,
  	"theme_font_heading" "enum_site_settings_theme_font_heading" DEFAULT 'system',
  	"theme_font_body" "enum_site_settings_theme_font_body" DEFAULT 'system',
  	"theme_radius" numeric DEFAULT 0.625,
  	"board_title" varchar DEFAULT '',
  	"board_description" varchar DEFAULT '',
  	"board_jobs_per_page" numeric DEFAULT 20,
  	"post_job_enabled" boolean DEFAULT false,
  	"post_job_payment_link_url" varchar DEFAULT '',
  	"post_job_price_label" varchar DEFAULT '',
  	"post_job_duration_days" numeric DEFAULT 30 NOT NULL,
  	"alerts_enabled" boolean DEFAULT false,
  	"alerts_default_frequency" "enum_site_settings_alerts_default_frequency" DEFAULT 'weekly',
  	"alerts_from_name" varchar DEFAULT '',
  	"alerts_from_email" varchar,
  	"showcase_list_my_board" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "_site_settings_v_version_board_public_detail_fields" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__site_settings_v_version_board_public_detail_fields",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_name" varchar DEFAULT 'Job Board' NOT NULL,
  	"version_tagline" varchar DEFAULT '',
  	"version_logo_id" integer,
  	"version_theme_colors_background" varchar,
  	"version_theme_colors_foreground" varchar,
  	"version_theme_colors_primary" varchar,
  	"version_theme_colors_primary_foreground" varchar,
  	"version_theme_colors_muted" varchar,
  	"version_theme_colors_muted_foreground" varchar,
  	"version_theme_colors_accent" varchar,
  	"version_theme_colors_accent_foreground" varchar,
  	"version_theme_colors_border" varchar,
  	"version_theme_colors_ring" varchar,
  	"version_theme_font_heading" "enum__site_settings_v_version_theme_font_heading" DEFAULT 'system',
  	"version_theme_font_body" "enum__site_settings_v_version_theme_font_body" DEFAULT 'system',
  	"version_theme_radius" numeric DEFAULT 0.625,
  	"version_board_title" varchar DEFAULT '',
  	"version_board_description" varchar DEFAULT '',
  	"version_board_jobs_per_page" numeric DEFAULT 20,
  	"version_post_job_enabled" boolean DEFAULT false,
  	"version_post_job_payment_link_url" varchar DEFAULT '',
  	"version_post_job_price_label" varchar DEFAULT '',
  	"version_post_job_duration_days" numeric DEFAULT 30 NOT NULL,
  	"version_alerts_enabled" boolean DEFAULT false,
  	"version_alerts_default_frequency" "enum__site_settings_v_version_alerts_default_frequency" DEFAULT 'weekly',
  	"version_alerts_from_name" varchar DEFAULT '',
  	"version_alerts_from_email" varchar,
  	"version_showcase_list_my_board" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "bordfeed_connection" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"state" "enum_bordfeed_connection_state" DEFAULT 'sample' NOT NULL,
  	"previous_state" "enum_bordfeed_connection_previous_state",
  	"template_id" varchar DEFAULT 'remote-engineering' NOT NULL,
  	"filters" jsonb,
  	"registration_id" varchar,
  	"registration_expires_at" timestamp(3) with time zone,
  	"api_key_encrypted" varchar,
  	"key_hint" varchar,
  	"feed_id" varchar,
  	"last_sync_at" timestamp(3) with time zone,
  	"last_sync_summary" jsonb,
  	"last_error" jsonb,
  	"show_attribution" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "install_state" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"install_id" varchar,
  	"latest_version" varchar,
  	"latest_checked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies" ADD CONSTRAINT "companies_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "companies_rels" ADD CONSTRAINT "companies_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_rels" ADD CONSTRAINT "companies_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_career_level" ADD CONSTRAINT "jobs_career_level_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_languages" ADD CONSTRAINT "jobs_languages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_categories" ADD CONSTRAINT "jobs_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_logo_id_media_id_fk" FOREIGN KEY ("company_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs_rels" ADD CONSTRAINT "jobs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_rels" ADD CONSTRAINT "jobs_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_version_career_level" ADD CONSTRAINT "_jobs_v_version_career_level_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_version_languages" ADD CONSTRAINT "_jobs_v_version_languages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_version_categories" ADD CONSTRAINT "_jobs_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_parent_id_jobs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_version_company_id_companies_id_fk" FOREIGN KEY ("version_company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v" ADD CONSTRAINT "_jobs_v_version_company_logo_id_media_id_fk" FOREIGN KEY ("version_company_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_jobs_v_rels" ADD CONSTRAINT "_jobs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_jobs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_jobs_v_rels" ADD CONSTRAINT "_jobs_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_companies_fk" FOREIGN KEY ("companies_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_alert_subscribers_fk" FOREIGN KEY ("alert_subscribers_id") REFERENCES "public"."alert_subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_llm_instructions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_board_public_detail_fields" ADD CONSTRAINT "site_settings_board_public_detail_fields_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_board_public_detail_fields" ADD CONSTRAINT "_site_settings_v_version_board_public_detail_fields_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_rels" ADD CONSTRAINT "_site_settings_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_rels" ADD CONSTRAINT "_site_settings_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_original_original_filename_idx" ON "media" USING btree ("original_filename");
  CREATE INDEX "media_variants_thumb_variants_thumb_filename_idx" ON "media" USING btree ("variants_thumb_filename");
  CREATE INDEX "media_variants_card_variants_card_filename_idx" ON "media" USING btree ("variants_card_filename");
  CREATE INDEX "media_variants_og_variants_og_filename_idx" ON "media" USING btree ("variants_og_filename");
  CREATE INDEX "media_rels_order_idx" ON "media_rels" USING btree ("order");
  CREATE INDEX "media_rels_parent_idx" ON "media_rels" USING btree ("parent_id");
  CREATE INDEX "media_rels_path_idx" ON "media_rels" USING btree ("path");
  CREATE INDEX "media_rels_users_id_idx" ON "media_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "companies_slug_idx" ON "companies" USING btree ("slug");
  CREATE INDEX "companies_logo_idx" ON "companies" USING btree ("logo_id");
  CREATE UNIQUE INDEX "companies_domain_idx" ON "companies" USING btree ("domain");
  CREATE UNIQUE INDEX "companies_bordfeed_company_id_idx" ON "companies" USING btree ("bordfeed_company_id");
  CREATE INDEX "companies_updated_at_idx" ON "companies" USING btree ("updated_at");
  CREATE INDEX "companies_created_at_idx" ON "companies" USING btree ("created_at");
  CREATE INDEX "companies_rels_order_idx" ON "companies_rels" USING btree ("order");
  CREATE INDEX "companies_rels_parent_idx" ON "companies_rels" USING btree ("parent_id");
  CREATE INDEX "companies_rels_path_idx" ON "companies_rels" USING btree ("path");
  CREATE INDEX "companies_rels_users_id_idx" ON "companies_rels" USING btree ("users_id");
  CREATE INDEX "jobs_career_level_order_idx" ON "jobs_career_level" USING btree ("order");
  CREATE INDEX "jobs_career_level_parent_idx" ON "jobs_career_level" USING btree ("parent_id");
  CREATE INDEX "jobs_languages_order_idx" ON "jobs_languages" USING btree ("_order");
  CREATE INDEX "jobs_languages_parent_id_idx" ON "jobs_languages" USING btree ("_parent_id");
  CREATE INDEX "jobs_categories_order_idx" ON "jobs_categories" USING btree ("_order");
  CREATE INDEX "jobs_categories_parent_id_idx" ON "jobs_categories" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "jobs_slug_idx" ON "jobs" USING btree ("slug");
  CREATE INDEX "jobs_company_idx" ON "jobs" USING btree ("company_id");
  CREATE INDEX "jobs_company_slug_idx" ON "jobs" USING btree ("company_slug");
  CREATE INDEX "jobs_company_logo_idx" ON "jobs" USING btree ("company_logo_id");
  CREATE INDEX "jobs_employment_type_idx" ON "jobs" USING btree ("employment_type");
  CREATE INDEX "jobs_workplace_type_idx" ON "jobs" USING btree ("workplace_type");
  CREATE INDEX "jobs_country_code_idx" ON "jobs" USING btree ("country_code");
  CREATE INDEX "jobs_seniority_idx" ON "jobs" USING btree ("seniority");
  CREATE INDEX "jobs_published_at_idx" ON "jobs" USING btree ("published_at");
  CREATE INDEX "jobs_valid_through_idx" ON "jobs" USING btree ("valid_through");
  CREATE INDEX "jobs_origin_idx" ON "jobs" USING btree ("origin");
  CREATE UNIQUE INDEX "jobs_bordfeed_job_id_idx" ON "jobs" USING btree ("bordfeed_job_id");
  CREATE INDEX "jobs_updated_at_idx" ON "jobs" USING btree ("updated_at");
  CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");
  CREATE INDEX "jobs__status_idx" ON "jobs" USING btree ("_status");
  CREATE INDEX "jobs_rels_order_idx" ON "jobs_rels" USING btree ("order");
  CREATE INDEX "jobs_rels_parent_idx" ON "jobs_rels" USING btree ("parent_id");
  CREATE INDEX "jobs_rels_path_idx" ON "jobs_rels" USING btree ("path");
  CREATE INDEX "jobs_rels_users_id_idx" ON "jobs_rels" USING btree ("users_id");
  CREATE INDEX "_jobs_v_version_career_level_order_idx" ON "_jobs_v_version_career_level" USING btree ("order");
  CREATE INDEX "_jobs_v_version_career_level_parent_idx" ON "_jobs_v_version_career_level" USING btree ("parent_id");
  CREATE INDEX "_jobs_v_version_languages_order_idx" ON "_jobs_v_version_languages" USING btree ("_order");
  CREATE INDEX "_jobs_v_version_languages_parent_id_idx" ON "_jobs_v_version_languages" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_version_categories_order_idx" ON "_jobs_v_version_categories" USING btree ("_order");
  CREATE INDEX "_jobs_v_version_categories_parent_id_idx" ON "_jobs_v_version_categories" USING btree ("_parent_id");
  CREATE INDEX "_jobs_v_parent_idx" ON "_jobs_v" USING btree ("parent_id");
  CREATE INDEX "_jobs_v_version_version_slug_idx" ON "_jobs_v" USING btree ("version_slug");
  CREATE INDEX "_jobs_v_version_version_company_idx" ON "_jobs_v" USING btree ("version_company_id");
  CREATE INDEX "_jobs_v_version_version_company_slug_idx" ON "_jobs_v" USING btree ("version_company_slug");
  CREATE INDEX "_jobs_v_version_version_company_logo_idx" ON "_jobs_v" USING btree ("version_company_logo_id");
  CREATE INDEX "_jobs_v_version_version_employment_type_idx" ON "_jobs_v" USING btree ("version_employment_type");
  CREATE INDEX "_jobs_v_version_version_workplace_type_idx" ON "_jobs_v" USING btree ("version_workplace_type");
  CREATE INDEX "_jobs_v_version_version_country_code_idx" ON "_jobs_v" USING btree ("version_country_code");
  CREATE INDEX "_jobs_v_version_version_seniority_idx" ON "_jobs_v" USING btree ("version_seniority");
  CREATE INDEX "_jobs_v_version_version_published_at_idx" ON "_jobs_v" USING btree ("version_published_at");
  CREATE INDEX "_jobs_v_version_version_valid_through_idx" ON "_jobs_v" USING btree ("version_valid_through");
  CREATE INDEX "_jobs_v_version_version_origin_idx" ON "_jobs_v" USING btree ("version_origin");
  CREATE INDEX "_jobs_v_version_version_bordfeed_job_id_idx" ON "_jobs_v" USING btree ("version_bordfeed_job_id");
  CREATE INDEX "_jobs_v_version_version_updated_at_idx" ON "_jobs_v" USING btree ("version_updated_at");
  CREATE INDEX "_jobs_v_version_version_created_at_idx" ON "_jobs_v" USING btree ("version_created_at");
  CREATE INDEX "_jobs_v_version_version__status_idx" ON "_jobs_v" USING btree ("version__status");
  CREATE INDEX "_jobs_v_created_at_idx" ON "_jobs_v" USING btree ("created_at");
  CREATE INDEX "_jobs_v_updated_at_idx" ON "_jobs_v" USING btree ("updated_at");
  CREATE INDEX "_jobs_v_latest_idx" ON "_jobs_v" USING btree ("latest");
  CREATE INDEX "_jobs_v_rels_order_idx" ON "_jobs_v_rels" USING btree ("order");
  CREATE INDEX "_jobs_v_rels_parent_idx" ON "_jobs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_jobs_v_rels_path_idx" ON "_jobs_v_rels" USING btree ("path");
  CREATE INDEX "_jobs_v_rels_users_id_idx" ON "_jobs_v_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "alert_subscribers_email_idx" ON "alert_subscribers" USING btree ("email");
  CREATE INDEX "alert_subscribers_status_idx" ON "alert_subscribers" USING btree ("status");
  CREATE INDEX "alert_subscribers_confirm_token_hash_idx" ON "alert_subscribers" USING btree ("confirm_token_hash");
  CREATE INDEX "alert_subscribers_unsubscribe_token_hash_idx" ON "alert_subscribers" USING btree ("unsubscribe_token_hash");
  CREATE INDEX "alert_subscribers_updated_at_idx" ON "alert_subscribers" USING btree ("updated_at");
  CREATE INDEX "alert_subscribers_created_at_idx" ON "alert_subscribers" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_until_idx" ON "payload_jobs" USING btree ("processing_until");
  CREATE INDEX "payload_jobs_concurrency_key_idx" ON "payload_jobs" USING btree ("concurrency_key");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_companies_id_idx" ON "payload_locked_documents_rels" USING btree ("companies_id");
  CREATE INDEX "payload_locked_documents_rels_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("jobs_id");
  CREATE INDEX "payload_locked_documents_rels_alert_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("alert_subscribers_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "payload_llm_instructions_entity_slug_idx" ON "payload_llm_instructions" USING btree ("entity_slug");
  CREATE INDEX "payload_llm_instructions_updated_at_idx" ON "payload_llm_instructions" USING btree ("updated_at");
  CREATE INDEX "payload_llm_instructions_created_at_idx" ON "payload_llm_instructions" USING btree ("created_at");
  CREATE INDEX "payload_llm_instructions_rels_order_idx" ON "payload_llm_instructions_rels" USING btree ("order");
  CREATE INDEX "payload_llm_instructions_rels_parent_idx" ON "payload_llm_instructions_rels" USING btree ("parent_id");
  CREATE INDEX "payload_llm_instructions_rels_path_idx" ON "payload_llm_instructions_rels" USING btree ("path");
  CREATE INDEX "payload_llm_instructions_rels_users_id_idx" ON "payload_llm_instructions_rels" USING btree ("users_id");
  CREATE INDEX "site_settings_board_public_detail_fields_order_idx" ON "site_settings_board_public_detail_fields" USING btree ("order");
  CREATE INDEX "site_settings_board_public_detail_fields_parent_idx" ON "site_settings_board_public_detail_fields" USING btree ("parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_rels_order_idx" ON "site_settings_rels" USING btree ("order");
  CREATE INDEX "site_settings_rels_parent_idx" ON "site_settings_rels" USING btree ("parent_id");
  CREATE INDEX "site_settings_rels_path_idx" ON "site_settings_rels" USING btree ("path");
  CREATE INDEX "site_settings_rels_users_id_idx" ON "site_settings_rels" USING btree ("users_id");
  CREATE INDEX "_site_settings_v_version_board_public_detail_fields_order_idx" ON "_site_settings_v_version_board_public_detail_fields" USING btree ("order");
  CREATE INDEX "_site_settings_v_version_board_public_detail_fields_parent_idx" ON "_site_settings_v_version_board_public_detail_fields" USING btree ("parent_id");
  CREATE INDEX "_site_settings_v_version_version_logo_idx" ON "_site_settings_v" USING btree ("version_logo_id");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_rels_order_idx" ON "_site_settings_v_rels" USING btree ("order");
  CREATE INDEX "_site_settings_v_rels_parent_idx" ON "_site_settings_v_rels" USING btree ("parent_id");
  CREATE INDEX "_site_settings_v_rels_path_idx" ON "_site_settings_v_rels" USING btree ("path");
  CREATE INDEX "_site_settings_v_rels_users_id_idx" ON "_site_settings_v_rels" USING btree ("users_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_rels" CASCADE;
  DROP TABLE "companies" CASCADE;
  DROP TABLE "companies_rels" CASCADE;
  DROP TABLE "jobs_career_level" CASCADE;
  DROP TABLE "jobs_languages" CASCADE;
  DROP TABLE "jobs_categories" CASCADE;
  DROP TABLE "jobs" CASCADE;
  DROP TABLE "jobs_rels" CASCADE;
  DROP TABLE "_jobs_v_version_career_level" CASCADE;
  DROP TABLE "_jobs_v_version_languages" CASCADE;
  DROP TABLE "_jobs_v_version_categories" CASCADE;
  DROP TABLE "_jobs_v" CASCADE;
  DROP TABLE "_jobs_v_rels" CASCADE;
  DROP TABLE "alert_subscribers" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "payload_llm_instructions" CASCADE;
  DROP TABLE "payload_llm_instructions_rels" CASCADE;
  DROP TABLE "site_settings_board_public_detail_fields" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_rels" CASCADE;
  DROP TABLE "_site_settings_v_version_board_public_detail_fields" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "_site_settings_v_rels" CASCADE;
  DROP TABLE "bordfeed_connection" CASCADE;
  DROP TABLE "install_state" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_companies_origin";
  DROP TYPE "public"."enum_jobs_career_level";
  DROP TYPE "public"."enum_jobs_employment_type";
  DROP TYPE "public"."enum_jobs_workplace_type";
  DROP TYPE "public"."enum_jobs_seniority";
  DROP TYPE "public"."enum_jobs_origin";
  DROP TYPE "public"."enum_jobs_status";
  DROP TYPE "public"."enum__jobs_v_version_career_level";
  DROP TYPE "public"."enum__jobs_v_version_employment_type";
  DROP TYPE "public"."enum__jobs_v_version_workplace_type";
  DROP TYPE "public"."enum__jobs_v_version_seniority";
  DROP TYPE "public"."enum__jobs_v_version_origin";
  DROP TYPE "public"."enum__jobs_v_version_status";
  DROP TYPE "public"."enum_alert_subscribers_status";
  DROP TYPE "public"."enum_alert_subscribers_frequency";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_log_parent_task_slug";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_payload_llm_instructions_entity_type";
  DROP TYPE "public"."enum_site_settings_board_public_detail_fields";
  DROP TYPE "public"."enum_site_settings_theme_font_heading";
  DROP TYPE "public"."enum_site_settings_theme_font_body";
  DROP TYPE "public"."enum_site_settings_alerts_default_frequency";
  DROP TYPE "public"."enum__site_settings_v_version_board_public_detail_fields";
  DROP TYPE "public"."enum__site_settings_v_version_theme_font_heading";
  DROP TYPE "public"."enum__site_settings_v_version_theme_font_body";
  DROP TYPE "public"."enum__site_settings_v_version_alerts_default_frequency";
  DROP TYPE "public"."enum_bordfeed_connection_state";
  DROP TYPE "public"."enum_bordfeed_connection_previous_state";`)
}
