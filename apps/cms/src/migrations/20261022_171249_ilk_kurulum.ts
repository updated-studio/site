import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_news_label" AS ENUM('yok', 'son-dakika', 'sizinti', 'rehber', 'sponsorlu');
  CREATE TYPE "payload"."enum_news_certainty" AS ENUM('1', '2', '3', '4');
  CREATE TYPE "payload"."enum_news_workflow_state" AS ENUM('taslak', 'incelemede', 'planlandi', 'yayinda', 'arsiv');
  CREATE TYPE "payload"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__news_v_version_label" AS ENUM('yok', 'son-dakika', 'sizinti', 'rehber', 'sponsorlu');
  CREATE TYPE "payload"."enum__news_v_version_certainty" AS ENUM('1', '2', '3', '4');
  CREATE TYPE "payload"."enum__news_v_version_workflow_state" AS ENUM('taslak', 'incelemede', 'planlandi', 'yayinda', 'arsiv');
  CREATE TYPE "payload"."enum__news_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_reviews_workflow_state" AS ENUM('taslak', 'incelemede', 'planlandi', 'yayinda', 'arsiv');
  CREATE TYPE "payload"."enum_reviews_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__reviews_v_version_workflow_state" AS ENUM('taslak', 'incelemede', 'planlandi', 'yayinda', 'arsiv');
  CREATE TYPE "payload"."enum__reviews_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_comparisons_key_diffs_winner" AS ENUM('a', 'b');
  CREATE TYPE "payload"."enum_comparisons_workflow_state" AS ENUM('taslak', 'incelemede', 'planlandi', 'yayinda', 'arsiv');
  CREATE TYPE "payload"."enum_comparisons_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__comparisons_v_version_key_diffs_winner" AS ENUM('a', 'b');
  CREATE TYPE "payload"."enum__comparisons_v_version_workflow_state" AS ENUM('taslak', 'incelemede', 'planlandi', 'yayinda', 'arsiv');
  CREATE TYPE "payload"."enum__comparisons_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_products_specs_source" AS ENUM('uretici', 'olcum', 'test', 'sizinti', 'takvim', 'diger');
  CREATE TYPE "payload"."enum_products_type" AS ENUM('phone', 'drone', 'cam360', 'camera', 'pad', 'audio', 'laptop', 'other');
  CREATE TYPE "payload"."enum_products_status" AS ENUM('soylenti', 'sizinti', 'test', 'takvim', 'duyuruldu', 'satista', 'eol');
  CREATE TYPE "payload"."enum_videos_kind" AS ENUM('Haber', 'İnceleme', 'Karşılaştırma', 'Rehber');
  CREATE TYPE "payload"."enum_ads_slot" AS ENUM('lb', 'mr', 'in', 'video', 'sponsored');
  CREATE TYPE "payload"."enum_kulup_tracks_modules_steps_kind" AS ENUM('okuma', 'simulator', 'alistirma', 'gorev');
  CREATE TYPE "payload"."enum_kulup_tracks_modules_steps_simulator_id" AS ENUM('expo', 'shutter', 'drone');
  CREATE TYPE "payload"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'yayin-yonetmeni', 'editor', 'video', 'tasarimci', 'sosyal');
  CREATE TYPE "payload"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "payload"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "payload"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "payload"."enum_home_hero_layout" AS ENUM('akordeon', 'vitrin', 'akis');
  CREATE TABLE "payload"."news_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"primary" boolean DEFAULT false
  );
  
  CREATE TABLE "payload"."news_corrections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"note" varchar
  );
  
  CREATE TABLE "payload"."news_seo_geo_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "payload"."news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"spot" varchar,
  	"category_id" integer,
  	"label" "payload"."enum_news_label" DEFAULT 'yok',
  	"cover_id" integer,
  	"short_answer" varchar,
  	"body" jsonb,
  	"certainty" "payload"."enum_news_certainty",
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"path" varchar,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"reading_time" numeric,
  	"workflow_state" "payload"."enum_news_workflow_state" DEFAULT 'taslak',
  	"workflow_owner_user_id" integer,
  	"workflow_second_editor_id" integer,
  	"workflow_approved_by_id" integer,
  	"workflow_checklist_kaynak" boolean DEFAULT false,
  	"workflow_checklist_baslik" boolean DEFAULT false,
  	"workflow_checklist_imla" boolean DEFAULT false,
  	"workflow_checklist_kunye" boolean DEFAULT false,
  	"workflow_checklist_sponsor" boolean DEFAULT false,
  	"workflow_checklist_uzunluk" boolean DEFAULT false,
  	"workflow_checklist_kapak" boolean DEFAULT false,
  	"workflow_checklist_etiket" boolean DEFAULT false,
  	"workflow_checklist_alt" boolean DEFAULT false,
  	"workflow_checklist_mobil" boolean DEFAULT false,
  	"triyaj_priority" numeric,
  	"triyaj_cluster" varchar,
  	"triyaj_studio_id" varchar,
  	"triyaj_imported_at" timestamp(3) with time zone,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_news_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."news_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."news_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "payload"."_news_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"primary" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_news_v_version_corrections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_news_v_version_seo_geo_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_spot" varchar,
  	"version_category_id" integer,
  	"version_label" "payload"."enum__news_v_version_label" DEFAULT 'yok',
  	"version_cover_id" integer,
  	"version_short_answer" varchar,
  	"version_body" jsonb,
  	"version_certainty" "payload"."enum__news_v_version_certainty",
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_path" varchar,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_reading_time" numeric,
  	"version_workflow_state" "payload"."enum__news_v_version_workflow_state" DEFAULT 'taslak',
  	"version_workflow_owner_user_id" integer,
  	"version_workflow_second_editor_id" integer,
  	"version_workflow_approved_by_id" integer,
  	"version_workflow_checklist_kaynak" boolean DEFAULT false,
  	"version_workflow_checklist_baslik" boolean DEFAULT false,
  	"version_workflow_checklist_imla" boolean DEFAULT false,
  	"version_workflow_checklist_kunye" boolean DEFAULT false,
  	"version_workflow_checklist_sponsor" boolean DEFAULT false,
  	"version_workflow_checklist_uzunluk" boolean DEFAULT false,
  	"version_workflow_checklist_kapak" boolean DEFAULT false,
  	"version_workflow_checklist_etiket" boolean DEFAULT false,
  	"version_workflow_checklist_alt" boolean DEFAULT false,
  	"version_workflow_checklist_mobil" boolean DEFAULT false,
  	"version_triyaj_priority" numeric,
  	"version_triyaj_cluster" varchar,
  	"version_triyaj_studio_id" varchar,
  	"version_triyaj_imported_at" timestamp(3) with time zone,
  	"version_wp_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__news_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_news_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."_news_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "payload"."reviews_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"primary" boolean DEFAULT false
  );
  
  CREATE TABLE "payload"."reviews_corrections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"note" varchar
  );
  
  CREATE TABLE "payload"."reviews_seo_geo_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "payload"."reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"spot" varchar,
  	"product_id" integer,
  	"cover_id" integer,
  	"short_answer" varchar,
  	"body" jsonb,
  	"score_box_score" numeric,
  	"score_box_usage_days" numeric,
  	"score_box_device_source" varchar,
  	"method" jsonb,
  	"video_id" integer,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"path" varchar,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"reading_time" numeric,
  	"workflow_state" "payload"."enum_reviews_workflow_state" DEFAULT 'taslak',
  	"workflow_owner_user_id" integer,
  	"workflow_second_editor_id" integer,
  	"workflow_approved_by_id" integer,
  	"workflow_checklist_kaynak" boolean DEFAULT false,
  	"workflow_checklist_baslik" boolean DEFAULT false,
  	"workflow_checklist_imla" boolean DEFAULT false,
  	"workflow_checklist_kunye" boolean DEFAULT false,
  	"workflow_checklist_sponsor" boolean DEFAULT false,
  	"workflow_checklist_uzunluk" boolean DEFAULT false,
  	"workflow_checklist_kapak" boolean DEFAULT false,
  	"workflow_checklist_etiket" boolean DEFAULT false,
  	"workflow_checklist_alt" boolean DEFAULT false,
  	"workflow_checklist_mobil" boolean DEFAULT false,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_reviews_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."reviews_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."_reviews_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"primary" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_reviews_v_version_corrections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_reviews_v_version_seo_geo_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_reviews_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_spot" varchar,
  	"version_product_id" integer,
  	"version_cover_id" integer,
  	"version_short_answer" varchar,
  	"version_body" jsonb,
  	"version_score_box_score" numeric,
  	"version_score_box_usage_days" numeric,
  	"version_score_box_device_source" varchar,
  	"version_method" jsonb,
  	"version_video_id" integer,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_path" varchar,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_reading_time" numeric,
  	"version_workflow_state" "payload"."enum__reviews_v_version_workflow_state" DEFAULT 'taslak',
  	"version_workflow_owner_user_id" integer,
  	"version_workflow_second_editor_id" integer,
  	"version_workflow_approved_by_id" integer,
  	"version_workflow_checklist_kaynak" boolean DEFAULT false,
  	"version_workflow_checklist_baslik" boolean DEFAULT false,
  	"version_workflow_checklist_imla" boolean DEFAULT false,
  	"version_workflow_checklist_kunye" boolean DEFAULT false,
  	"version_workflow_checklist_sponsor" boolean DEFAULT false,
  	"version_workflow_checklist_uzunluk" boolean DEFAULT false,
  	"version_workflow_checklist_kapak" boolean DEFAULT false,
  	"version_workflow_checklist_etiket" boolean DEFAULT false,
  	"version_workflow_checklist_alt" boolean DEFAULT false,
  	"version_workflow_checklist_mobil" boolean DEFAULT false,
  	"version_wp_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__reviews_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_reviews_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."comparisons_key_diffs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"big" varchar,
  	"label" varchar,
  	"winner" "payload"."enum_comparisons_key_diffs_winner"
  );
  
  CREATE TABLE "payload"."comparisons_seo_geo_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "payload"."comparisons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"a_id" integer,
  	"b_id" integer,
  	"spot" varchar,
  	"short_answer" varchar,
  	"who_for_a" varchar,
  	"who_for_b" varchar,
  	"method" varchar,
  	"cover_id" integer,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"path" varchar,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"workflow_state" "payload"."enum_comparisons_workflow_state" DEFAULT 'taslak',
  	"workflow_owner_user_id" integer,
  	"workflow_second_editor_id" integer,
  	"workflow_approved_by_id" integer,
  	"workflow_checklist_kaynak" boolean DEFAULT false,
  	"workflow_checklist_baslik" boolean DEFAULT false,
  	"workflow_checklist_imla" boolean DEFAULT false,
  	"workflow_checklist_kunye" boolean DEFAULT false,
  	"workflow_checklist_sponsor" boolean DEFAULT false,
  	"workflow_checklist_uzunluk" boolean DEFAULT false,
  	"workflow_checklist_kapak" boolean DEFAULT false,
  	"workflow_checklist_etiket" boolean DEFAULT false,
  	"workflow_checklist_alt" boolean DEFAULT false,
  	"workflow_checklist_mobil" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_comparisons_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."comparisons_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."_comparisons_v_version_key_diffs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"big" varchar,
  	"label" varchar,
  	"winner" "payload"."enum__comparisons_v_version_key_diffs_winner",
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_comparisons_v_version_seo_geo_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_comparisons_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_a_id" integer,
  	"version_b_id" integer,
  	"version_spot" varchar,
  	"version_short_answer" varchar,
  	"version_who_for_a" varchar,
  	"version_who_for_b" varchar,
  	"version_method" varchar,
  	"version_cover_id" integer,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_path" varchar,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_workflow_state" "payload"."enum__comparisons_v_version_workflow_state" DEFAULT 'taslak',
  	"version_workflow_owner_user_id" integer,
  	"version_workflow_second_editor_id" integer,
  	"version_workflow_approved_by_id" integer,
  	"version_workflow_checklist_kaynak" boolean DEFAULT false,
  	"version_workflow_checklist_baslik" boolean DEFAULT false,
  	"version_workflow_checklist_imla" boolean DEFAULT false,
  	"version_workflow_checklist_kunye" boolean DEFAULT false,
  	"version_workflow_checklist_sponsor" boolean DEFAULT false,
  	"version_workflow_checklist_uzunluk" boolean DEFAULT false,
  	"version_workflow_checklist_kapak" boolean DEFAULT false,
  	"version_workflow_checklist_etiket" boolean DEFAULT false,
  	"version_workflow_checklist_alt" boolean DEFAULT false,
  	"version_workflow_checklist_mobil" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__comparisons_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."_comparisons_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."products_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"value" varchar,
  	"num" numeric,
  	"unit" varchar,
  	"source" "payload"."enum_products_specs_source" DEFAULT 'uretici',
  	"source_url" varchar,
  	"at" timestamp(3) with time zone,
  	"group" varchar,
  	"higher_is_better" boolean DEFAULT true,
  	"search_weight" numeric DEFAULT 3
  );
  
  CREATE TABLE "payload"."products_parts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "payload"."products_seo_geo_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"brand" varchar NOT NULL,
  	"slug" varchar,
  	"type" "payload"."enum_products_type" NOT NULL,
  	"category_id" integer,
  	"status" "payload"."enum_products_status" DEFAULT 'satista',
  	"certainty" numeric DEFAULT 4,
  	"release_when" varchar,
  	"on_radar" boolean DEFAULT false,
  	"image_id" integer,
  	"blurb" varchar,
  	"legacy" boolean DEFAULT false,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"path" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."products_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "payload"."categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"in_nav" boolean DEFAULT false,
  	"order" numeric DEFAULT 10,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"title" varchar,
  	"bio" varchar,
  	"avatar_id" integer,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."authors_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"credit" varchar NOT NULL,
  	"representative" boolean DEFAULT false,
  	"ai_generated" boolean DEFAULT false,
  	"source_url" varchar,
  	"prefix" varchar DEFAULT 'media',
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
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar,
  	"sizes_reel_url" varchar,
  	"sizes_reel_width" numeric,
  	"sizes_reel_height" numeric,
  	"sizes_reel_mime_type" varchar,
  	"sizes_reel_filesize" numeric,
  	"sizes_reel_filename" varchar
  );
  
  CREATE TABLE "payload"."videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"youtube_id" varchar NOT NULL,
  	"kind" "payload"."enum_videos_kind" DEFAULT 'İnceleme',
  	"thumb_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."videos_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "payload"."reels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"caption" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"cover_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."ads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"advertiser" varchar NOT NULL,
  	"slot" "payload"."enum_ads_slot" NOT NULL,
  	"image_id" integer,
  	"mobile_image_id" integer,
  	"video_url" varchar,
  	"title" varchar,
  	"url" varchar NOT NULL,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"weight" numeric DEFAULT 1,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."ads_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "payload"."kulup_tracks_modules_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "payload"."enum_kulup_tracks_modules_steps_kind" DEFAULT 'okuma',
  	"minutes" numeric,
  	"xp" numeric DEFAULT 20,
  	"simulator_id" "payload"."enum_kulup_tracks_modules_steps_simulator_id",
  	"quiz_id" integer,
  	"body" jsonb
  );
  
  CREATE TABLE "payload"."kulup_tracks_modules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."kulup_tracks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"order" numeric DEFAULT 1,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."kulup_quizzes_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"answer" numeric NOT NULL,
  	"why" varchar
  );
  
  CREATE TABLE "payload"."kulup_quizzes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."kulup_quizzes_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."pages_seo_geo_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar
  );
  
  CREATE TABLE "payload"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"spot" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_canonical" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."pages_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_version_seo_geo_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"q" varchar,
  	"a" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_spot" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."_pages_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "payload"."enum_users_role" DEFAULT 'editor' NOT NULL,
  	"author_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
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
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "payload"."enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "payload"."enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload"."payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "payload"."enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer,
  	"reviews_id" integer,
  	"comparisons_id" integer,
  	"products_id" integer,
  	"categories_id" integer,
  	"authors_id" integer,
  	"media_id" integer,
  	"videos_id" integer,
  	"reels_id" integer,
  	"ads_id" integer,
  	"kulup_tracks_id" integer,
  	"kulup_quizzes_id" integer,
  	"pages_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_layout" "payload"."enum_home_hero_layout" DEFAULT 'akordeon',
  	"modules_radar" boolean DEFAULT true,
  	"modules_kiyas_robotu" boolean DEFAULT true,
  	"modules_altmis_saniye" boolean DEFAULT true,
  	"modules_kunye_rafi" boolean DEFAULT true,
  	"modules_videolar" boolean DEFAULT true,
  	"modules_reels" boolean DEFAULT true,
  	"modules_cok_okunan" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."home_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer,
  	"reviews_id" integer,
  	"comparisons_id" integer
  );
  
  CREATE TABLE "payload"."site_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tagline" varchar DEFAULT 'Teknoloji haberleri, incelemeler ve karşılaştırmalar.',
  	"youtube" varchar DEFAULT 'https://www.youtube.com/@nerdesinfatih',
  	"instagram" varchar DEFAULT 'https://www.instagram.com/updated.tr/',
  	"kulup_url" varchar DEFAULT '/kulup',
  	"newsletter_note" varchar DEFAULT 'Haftalık bülten pazartesi 08.30.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."news_sources" ADD CONSTRAINT "news_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."news_corrections" ADD CONSTRAINT "news_corrections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."news_seo_geo_faq" ADD CONSTRAINT "news_seo_geo_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."news" ADD CONSTRAINT "news_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "payload"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."news" ADD CONSTRAINT "news_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."news" ADD CONSTRAINT "news_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."news" ADD CONSTRAINT "news_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."news" ADD CONSTRAINT "news_workflow_owner_user_id_users_id_fk" FOREIGN KEY ("workflow_owner_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."news" ADD CONSTRAINT "news_workflow_second_editor_id_users_id_fk" FOREIGN KEY ("workflow_second_editor_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."news" ADD CONSTRAINT "news_workflow_approved_by_id_users_id_fk" FOREIGN KEY ("workflow_approved_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."news_texts" ADD CONSTRAINT "news_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."news_rels" ADD CONSTRAINT "news_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."news_rels" ADD CONSTRAINT "news_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_news_v_version_sources" ADD CONSTRAINT "_news_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_news_v_version_corrections" ADD CONSTRAINT "_news_v_version_corrections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_news_v_version_seo_geo_faq" ADD CONSTRAINT "_news_v_version_seo_geo_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_news_v" ADD CONSTRAINT "_news_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "payload"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_news_v" ADD CONSTRAINT "_news_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_news_v" ADD CONSTRAINT "_news_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_news_v" ADD CONSTRAINT "_news_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_news_v" ADD CONSTRAINT "_news_v_version_workflow_owner_user_id_users_id_fk" FOREIGN KEY ("version_workflow_owner_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_news_v" ADD CONSTRAINT "_news_v_version_workflow_second_editor_id_users_id_fk" FOREIGN KEY ("version_workflow_second_editor_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_news_v" ADD CONSTRAINT "_news_v_version_workflow_approved_by_id_users_id_fk" FOREIGN KEY ("version_workflow_approved_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_news_v_texts" ADD CONSTRAINT "_news_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_news_v_rels" ADD CONSTRAINT "_news_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_news_v_rels" ADD CONSTRAINT "_news_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reviews_sources" ADD CONSTRAINT "reviews_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reviews_corrections" ADD CONSTRAINT "reviews_corrections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reviews_seo_geo_faq" ADD CONSTRAINT "reviews_seo_geo_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "payload"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_workflow_owner_user_id_users_id_fk" FOREIGN KEY ("workflow_owner_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_workflow_second_editor_id_users_id_fk" FOREIGN KEY ("workflow_second_editor_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_workflow_approved_by_id_users_id_fk" FOREIGN KEY ("workflow_approved_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews_texts" ADD CONSTRAINT "reviews_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v_version_sources" ADD CONSTRAINT "_reviews_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_reviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v_version_corrections" ADD CONSTRAINT "_reviews_v_version_corrections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_reviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v_version_seo_geo_faq" ADD CONSTRAINT "_reviews_v_version_seo_geo_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_reviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v" ADD CONSTRAINT "_reviews_v_parent_id_reviews_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."reviews"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v" ADD CONSTRAINT "_reviews_v_version_product_id_products_id_fk" FOREIGN KEY ("version_product_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v" ADD CONSTRAINT "_reviews_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v" ADD CONSTRAINT "_reviews_v_version_video_id_videos_id_fk" FOREIGN KEY ("version_video_id") REFERENCES "payload"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v" ADD CONSTRAINT "_reviews_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v" ADD CONSTRAINT "_reviews_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v" ADD CONSTRAINT "_reviews_v_version_workflow_owner_user_id_users_id_fk" FOREIGN KEY ("version_workflow_owner_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v" ADD CONSTRAINT "_reviews_v_version_workflow_second_editor_id_users_id_fk" FOREIGN KEY ("version_workflow_second_editor_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v" ADD CONSTRAINT "_reviews_v_version_workflow_approved_by_id_users_id_fk" FOREIGN KEY ("version_workflow_approved_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v_texts" ADD CONSTRAINT "_reviews_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_reviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."comparisons_key_diffs" ADD CONSTRAINT "comparisons_key_diffs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."comparisons_seo_geo_faq" ADD CONSTRAINT "comparisons_seo_geo_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."comparisons" ADD CONSTRAINT "comparisons_a_id_products_id_fk" FOREIGN KEY ("a_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."comparisons" ADD CONSTRAINT "comparisons_b_id_products_id_fk" FOREIGN KEY ("b_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."comparisons" ADD CONSTRAINT "comparisons_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."comparisons" ADD CONSTRAINT "comparisons_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."comparisons" ADD CONSTRAINT "comparisons_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."comparisons" ADD CONSTRAINT "comparisons_workflow_owner_user_id_users_id_fk" FOREIGN KEY ("workflow_owner_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."comparisons" ADD CONSTRAINT "comparisons_workflow_second_editor_id_users_id_fk" FOREIGN KEY ("workflow_second_editor_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."comparisons" ADD CONSTRAINT "comparisons_workflow_approved_by_id_users_id_fk" FOREIGN KEY ("workflow_approved_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."comparisons_texts" ADD CONSTRAINT "comparisons_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v_version_key_diffs" ADD CONSTRAINT "_comparisons_v_version_key_diffs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_comparisons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v_version_seo_geo_faq" ADD CONSTRAINT "_comparisons_v_version_seo_geo_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_comparisons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v" ADD CONSTRAINT "_comparisons_v_parent_id_comparisons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."comparisons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v" ADD CONSTRAINT "_comparisons_v_version_a_id_products_id_fk" FOREIGN KEY ("version_a_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v" ADD CONSTRAINT "_comparisons_v_version_b_id_products_id_fk" FOREIGN KEY ("version_b_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v" ADD CONSTRAINT "_comparisons_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v" ADD CONSTRAINT "_comparisons_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v" ADD CONSTRAINT "_comparisons_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v" ADD CONSTRAINT "_comparisons_v_version_workflow_owner_user_id_users_id_fk" FOREIGN KEY ("version_workflow_owner_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v" ADD CONSTRAINT "_comparisons_v_version_workflow_second_editor_id_users_id_fk" FOREIGN KEY ("version_workflow_second_editor_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v" ADD CONSTRAINT "_comparisons_v_version_workflow_approved_by_id_users_id_fk" FOREIGN KEY ("version_workflow_approved_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_comparisons_v_texts" ADD CONSTRAINT "_comparisons_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_comparisons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_specs" ADD CONSTRAINT "products_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_parts" ADD CONSTRAINT "products_parts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_seo_geo_faq" ADD CONSTRAINT "products_seo_geo_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "payload"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."products" ADD CONSTRAINT "products_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."products" ADD CONSTRAINT "products_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."products_texts" ADD CONSTRAINT "products_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."authors" ADD CONSTRAINT "authors_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."authors_texts" ADD CONSTRAINT "authors_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."videos" ADD CONSTRAINT "videos_thumb_id_media_id_fk" FOREIGN KEY ("thumb_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."videos_rels" ADD CONSTRAINT "videos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."videos_rels" ADD CONSTRAINT "videos_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reels" ADD CONSTRAINT "reels_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."ads" ADD CONSTRAINT "ads_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."ads" ADD CONSTRAINT "ads_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."ads_rels" ADD CONSTRAINT "ads_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."ads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."ads_rels" ADD CONSTRAINT "ads_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."kulup_tracks_modules_steps" ADD CONSTRAINT "kulup_tracks_modules_steps_quiz_id_kulup_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "payload"."kulup_quizzes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."kulup_tracks_modules_steps" ADD CONSTRAINT "kulup_tracks_modules_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."kulup_tracks_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."kulup_tracks_modules" ADD CONSTRAINT "kulup_tracks_modules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."kulup_tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."kulup_tracks" ADD CONSTRAINT "kulup_tracks_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."kulup_quizzes_questions" ADD CONSTRAINT "kulup_quizzes_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."kulup_quizzes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."kulup_quizzes_texts" ADD CONSTRAINT "kulup_quizzes_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."kulup_quizzes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_seo_geo_faq" ADD CONSTRAINT "pages_seo_geo_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages" ADD CONSTRAINT "pages_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_texts" ADD CONSTRAINT "pages_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_version_seo_geo_faq" ADD CONSTRAINT "_pages_v_version_seo_geo_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_texts" ADD CONSTRAINT "_pages_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."users" ADD CONSTRAINT "users_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "payload"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comparisons_fk" FOREIGN KEY ("comparisons_id") REFERENCES "payload"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "payload"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "payload"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reels_fk" FOREIGN KEY ("reels_id") REFERENCES "payload"."reels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ads_fk" FOREIGN KEY ("ads_id") REFERENCES "payload"."ads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kulup_tracks_fk" FOREIGN KEY ("kulup_tracks_id") REFERENCES "payload"."kulup_tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kulup_quizzes_fk" FOREIGN KEY ("kulup_quizzes_id") REFERENCES "payload"."kulup_quizzes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_rels" ADD CONSTRAINT "home_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_rels" ADD CONSTRAINT "home_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_rels" ADD CONSTRAINT "home_rels_comparisons_fk" FOREIGN KEY ("comparisons_id") REFERENCES "payload"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_nav" ADD CONSTRAINT "site_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "news_sources_order_idx" ON "payload"."news_sources" USING btree ("_order");
  CREATE INDEX "news_sources_parent_id_idx" ON "payload"."news_sources" USING btree ("_parent_id");
  CREATE INDEX "news_corrections_order_idx" ON "payload"."news_corrections" USING btree ("_order");
  CREATE INDEX "news_corrections_parent_id_idx" ON "payload"."news_corrections" USING btree ("_parent_id");
  CREATE INDEX "news_seo_geo_faq_order_idx" ON "payload"."news_seo_geo_faq" USING btree ("_order");
  CREATE INDEX "news_seo_geo_faq_parent_id_idx" ON "payload"."news_seo_geo_faq" USING btree ("_parent_id");
  CREATE INDEX "news_category_idx" ON "payload"."news" USING btree ("category_id");
  CREATE INDEX "news_cover_idx" ON "payload"."news" USING btree ("cover_id");
  CREATE INDEX "news_seo_seo_image_idx" ON "payload"."news" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "news_slug_idx" ON "payload"."news" USING btree ("slug");
  CREATE INDEX "news_path_idx" ON "payload"."news" USING btree ("path");
  CREATE INDEX "news_author_idx" ON "payload"."news" USING btree ("author_id");
  CREATE INDEX "news_workflow_workflow_owner_user_idx" ON "payload"."news" USING btree ("workflow_owner_user_id");
  CREATE INDEX "news_workflow_workflow_second_editor_idx" ON "payload"."news" USING btree ("workflow_second_editor_id");
  CREATE INDEX "news_workflow_workflow_approved_by_idx" ON "payload"."news" USING btree ("workflow_approved_by_id");
  CREATE INDEX "news_triyaj_triyaj_studio_id_idx" ON "payload"."news" USING btree ("triyaj_studio_id");
  CREATE INDEX "news_updated_at_idx" ON "payload"."news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "payload"."news" USING btree ("created_at");
  CREATE INDEX "news__status_idx" ON "payload"."news" USING btree ("_status");
  CREATE INDEX "news_texts_order_parent" ON "payload"."news_texts" USING btree ("order","parent_id");
  CREATE INDEX "news_rels_order_idx" ON "payload"."news_rels" USING btree ("order");
  CREATE INDEX "news_rels_parent_idx" ON "payload"."news_rels" USING btree ("parent_id");
  CREATE INDEX "news_rels_path_idx" ON "payload"."news_rels" USING btree ("path");
  CREATE INDEX "news_rels_products_id_idx" ON "payload"."news_rels" USING btree ("products_id");
  CREATE INDEX "_news_v_version_sources_order_idx" ON "payload"."_news_v_version_sources" USING btree ("_order");
  CREATE INDEX "_news_v_version_sources_parent_id_idx" ON "payload"."_news_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_news_v_version_corrections_order_idx" ON "payload"."_news_v_version_corrections" USING btree ("_order");
  CREATE INDEX "_news_v_version_corrections_parent_id_idx" ON "payload"."_news_v_version_corrections" USING btree ("_parent_id");
  CREATE INDEX "_news_v_version_seo_geo_faq_order_idx" ON "payload"."_news_v_version_seo_geo_faq" USING btree ("_order");
  CREATE INDEX "_news_v_version_seo_geo_faq_parent_id_idx" ON "payload"."_news_v_version_seo_geo_faq" USING btree ("_parent_id");
  CREATE INDEX "_news_v_parent_idx" ON "payload"."_news_v" USING btree ("parent_id");
  CREATE INDEX "_news_v_version_version_category_idx" ON "payload"."_news_v" USING btree ("version_category_id");
  CREATE INDEX "_news_v_version_version_cover_idx" ON "payload"."_news_v" USING btree ("version_cover_id");
  CREATE INDEX "_news_v_version_seo_version_seo_image_idx" ON "payload"."_news_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_news_v_version_version_slug_idx" ON "payload"."_news_v" USING btree ("version_slug");
  CREATE INDEX "_news_v_version_version_path_idx" ON "payload"."_news_v" USING btree ("version_path");
  CREATE INDEX "_news_v_version_version_author_idx" ON "payload"."_news_v" USING btree ("version_author_id");
  CREATE INDEX "_news_v_version_workflow_version_workflow_owner_user_idx" ON "payload"."_news_v" USING btree ("version_workflow_owner_user_id");
  CREATE INDEX "_news_v_version_workflow_version_workflow_second_editor_idx" ON "payload"."_news_v" USING btree ("version_workflow_second_editor_id");
  CREATE INDEX "_news_v_version_workflow_version_workflow_approved_by_idx" ON "payload"."_news_v" USING btree ("version_workflow_approved_by_id");
  CREATE INDEX "_news_v_version_triyaj_version_triyaj_studio_id_idx" ON "payload"."_news_v" USING btree ("version_triyaj_studio_id");
  CREATE INDEX "_news_v_version_version_updated_at_idx" ON "payload"."_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_v_version_version_created_at_idx" ON "payload"."_news_v" USING btree ("version_created_at");
  CREATE INDEX "_news_v_version_version__status_idx" ON "payload"."_news_v" USING btree ("version__status");
  CREATE INDEX "_news_v_created_at_idx" ON "payload"."_news_v" USING btree ("created_at");
  CREATE INDEX "_news_v_updated_at_idx" ON "payload"."_news_v" USING btree ("updated_at");
  CREATE INDEX "_news_v_latest_idx" ON "payload"."_news_v" USING btree ("latest");
  CREATE INDEX "_news_v_autosave_idx" ON "payload"."_news_v" USING btree ("autosave");
  CREATE INDEX "_news_v_texts_order_parent" ON "payload"."_news_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_news_v_rels_order_idx" ON "payload"."_news_v_rels" USING btree ("order");
  CREATE INDEX "_news_v_rels_parent_idx" ON "payload"."_news_v_rels" USING btree ("parent_id");
  CREATE INDEX "_news_v_rels_path_idx" ON "payload"."_news_v_rels" USING btree ("path");
  CREATE INDEX "_news_v_rels_products_id_idx" ON "payload"."_news_v_rels" USING btree ("products_id");
  CREATE INDEX "reviews_sources_order_idx" ON "payload"."reviews_sources" USING btree ("_order");
  CREATE INDEX "reviews_sources_parent_id_idx" ON "payload"."reviews_sources" USING btree ("_parent_id");
  CREATE INDEX "reviews_corrections_order_idx" ON "payload"."reviews_corrections" USING btree ("_order");
  CREATE INDEX "reviews_corrections_parent_id_idx" ON "payload"."reviews_corrections" USING btree ("_parent_id");
  CREATE INDEX "reviews_seo_geo_faq_order_idx" ON "payload"."reviews_seo_geo_faq" USING btree ("_order");
  CREATE INDEX "reviews_seo_geo_faq_parent_id_idx" ON "payload"."reviews_seo_geo_faq" USING btree ("_parent_id");
  CREATE INDEX "reviews_product_idx" ON "payload"."reviews" USING btree ("product_id");
  CREATE INDEX "reviews_cover_idx" ON "payload"."reviews" USING btree ("cover_id");
  CREATE INDEX "reviews_video_idx" ON "payload"."reviews" USING btree ("video_id");
  CREATE INDEX "reviews_seo_seo_image_idx" ON "payload"."reviews" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "reviews_slug_idx" ON "payload"."reviews" USING btree ("slug");
  CREATE INDEX "reviews_path_idx" ON "payload"."reviews" USING btree ("path");
  CREATE INDEX "reviews_author_idx" ON "payload"."reviews" USING btree ("author_id");
  CREATE INDEX "reviews_workflow_workflow_owner_user_idx" ON "payload"."reviews" USING btree ("workflow_owner_user_id");
  CREATE INDEX "reviews_workflow_workflow_second_editor_idx" ON "payload"."reviews" USING btree ("workflow_second_editor_id");
  CREATE INDEX "reviews_workflow_workflow_approved_by_idx" ON "payload"."reviews" USING btree ("workflow_approved_by_id");
  CREATE INDEX "reviews_updated_at_idx" ON "payload"."reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "payload"."reviews" USING btree ("created_at");
  CREATE INDEX "reviews__status_idx" ON "payload"."reviews" USING btree ("_status");
  CREATE INDEX "reviews_texts_order_parent" ON "payload"."reviews_texts" USING btree ("order","parent_id");
  CREATE INDEX "_reviews_v_version_sources_order_idx" ON "payload"."_reviews_v_version_sources" USING btree ("_order");
  CREATE INDEX "_reviews_v_version_sources_parent_id_idx" ON "payload"."_reviews_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_reviews_v_version_corrections_order_idx" ON "payload"."_reviews_v_version_corrections" USING btree ("_order");
  CREATE INDEX "_reviews_v_version_corrections_parent_id_idx" ON "payload"."_reviews_v_version_corrections" USING btree ("_parent_id");
  CREATE INDEX "_reviews_v_version_seo_geo_faq_order_idx" ON "payload"."_reviews_v_version_seo_geo_faq" USING btree ("_order");
  CREATE INDEX "_reviews_v_version_seo_geo_faq_parent_id_idx" ON "payload"."_reviews_v_version_seo_geo_faq" USING btree ("_parent_id");
  CREATE INDEX "_reviews_v_parent_idx" ON "payload"."_reviews_v" USING btree ("parent_id");
  CREATE INDEX "_reviews_v_version_version_product_idx" ON "payload"."_reviews_v" USING btree ("version_product_id");
  CREATE INDEX "_reviews_v_version_version_cover_idx" ON "payload"."_reviews_v" USING btree ("version_cover_id");
  CREATE INDEX "_reviews_v_version_version_video_idx" ON "payload"."_reviews_v" USING btree ("version_video_id");
  CREATE INDEX "_reviews_v_version_seo_version_seo_image_idx" ON "payload"."_reviews_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_reviews_v_version_version_slug_idx" ON "payload"."_reviews_v" USING btree ("version_slug");
  CREATE INDEX "_reviews_v_version_version_path_idx" ON "payload"."_reviews_v" USING btree ("version_path");
  CREATE INDEX "_reviews_v_version_version_author_idx" ON "payload"."_reviews_v" USING btree ("version_author_id");
  CREATE INDEX "_reviews_v_version_workflow_version_workflow_owner_user_idx" ON "payload"."_reviews_v" USING btree ("version_workflow_owner_user_id");
  CREATE INDEX "_reviews_v_version_workflow_version_workflow_second_edit_idx" ON "payload"."_reviews_v" USING btree ("version_workflow_second_editor_id");
  CREATE INDEX "_reviews_v_version_workflow_version_workflow_approved_by_idx" ON "payload"."_reviews_v" USING btree ("version_workflow_approved_by_id");
  CREATE INDEX "_reviews_v_version_version_updated_at_idx" ON "payload"."_reviews_v" USING btree ("version_updated_at");
  CREATE INDEX "_reviews_v_version_version_created_at_idx" ON "payload"."_reviews_v" USING btree ("version_created_at");
  CREATE INDEX "_reviews_v_version_version__status_idx" ON "payload"."_reviews_v" USING btree ("version__status");
  CREATE INDEX "_reviews_v_created_at_idx" ON "payload"."_reviews_v" USING btree ("created_at");
  CREATE INDEX "_reviews_v_updated_at_idx" ON "payload"."_reviews_v" USING btree ("updated_at");
  CREATE INDEX "_reviews_v_latest_idx" ON "payload"."_reviews_v" USING btree ("latest");
  CREATE INDEX "_reviews_v_autosave_idx" ON "payload"."_reviews_v" USING btree ("autosave");
  CREATE INDEX "_reviews_v_texts_order_parent" ON "payload"."_reviews_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "comparisons_key_diffs_order_idx" ON "payload"."comparisons_key_diffs" USING btree ("_order");
  CREATE INDEX "comparisons_key_diffs_parent_id_idx" ON "payload"."comparisons_key_diffs" USING btree ("_parent_id");
  CREATE INDEX "comparisons_seo_geo_faq_order_idx" ON "payload"."comparisons_seo_geo_faq" USING btree ("_order");
  CREATE INDEX "comparisons_seo_geo_faq_parent_id_idx" ON "payload"."comparisons_seo_geo_faq" USING btree ("_parent_id");
  CREATE INDEX "comparisons_a_idx" ON "payload"."comparisons" USING btree ("a_id");
  CREATE INDEX "comparisons_b_idx" ON "payload"."comparisons" USING btree ("b_id");
  CREATE INDEX "comparisons_cover_idx" ON "payload"."comparisons" USING btree ("cover_id");
  CREATE INDEX "comparisons_seo_seo_image_idx" ON "payload"."comparisons" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "comparisons_slug_idx" ON "payload"."comparisons" USING btree ("slug");
  CREATE INDEX "comparisons_path_idx" ON "payload"."comparisons" USING btree ("path");
  CREATE INDEX "comparisons_author_idx" ON "payload"."comparisons" USING btree ("author_id");
  CREATE INDEX "comparisons_workflow_workflow_owner_user_idx" ON "payload"."comparisons" USING btree ("workflow_owner_user_id");
  CREATE INDEX "comparisons_workflow_workflow_second_editor_idx" ON "payload"."comparisons" USING btree ("workflow_second_editor_id");
  CREATE INDEX "comparisons_workflow_workflow_approved_by_idx" ON "payload"."comparisons" USING btree ("workflow_approved_by_id");
  CREATE INDEX "comparisons_updated_at_idx" ON "payload"."comparisons" USING btree ("updated_at");
  CREATE INDEX "comparisons_created_at_idx" ON "payload"."comparisons" USING btree ("created_at");
  CREATE INDEX "comparisons__status_idx" ON "payload"."comparisons" USING btree ("_status");
  CREATE INDEX "comparisons_texts_order_parent" ON "payload"."comparisons_texts" USING btree ("order","parent_id");
  CREATE INDEX "_comparisons_v_version_key_diffs_order_idx" ON "payload"."_comparisons_v_version_key_diffs" USING btree ("_order");
  CREATE INDEX "_comparisons_v_version_key_diffs_parent_id_idx" ON "payload"."_comparisons_v_version_key_diffs" USING btree ("_parent_id");
  CREATE INDEX "_comparisons_v_version_seo_geo_faq_order_idx" ON "payload"."_comparisons_v_version_seo_geo_faq" USING btree ("_order");
  CREATE INDEX "_comparisons_v_version_seo_geo_faq_parent_id_idx" ON "payload"."_comparisons_v_version_seo_geo_faq" USING btree ("_parent_id");
  CREATE INDEX "_comparisons_v_parent_idx" ON "payload"."_comparisons_v" USING btree ("parent_id");
  CREATE INDEX "_comparisons_v_version_version_a_idx" ON "payload"."_comparisons_v" USING btree ("version_a_id");
  CREATE INDEX "_comparisons_v_version_version_b_idx" ON "payload"."_comparisons_v" USING btree ("version_b_id");
  CREATE INDEX "_comparisons_v_version_version_cover_idx" ON "payload"."_comparisons_v" USING btree ("version_cover_id");
  CREATE INDEX "_comparisons_v_version_seo_version_seo_image_idx" ON "payload"."_comparisons_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_comparisons_v_version_version_slug_idx" ON "payload"."_comparisons_v" USING btree ("version_slug");
  CREATE INDEX "_comparisons_v_version_version_path_idx" ON "payload"."_comparisons_v" USING btree ("version_path");
  CREATE INDEX "_comparisons_v_version_version_author_idx" ON "payload"."_comparisons_v" USING btree ("version_author_id");
  CREATE INDEX "_comparisons_v_version_workflow_version_workflow_owner_u_idx" ON "payload"."_comparisons_v" USING btree ("version_workflow_owner_user_id");
  CREATE INDEX "_comparisons_v_version_workflow_version_workflow_second__idx" ON "payload"."_comparisons_v" USING btree ("version_workflow_second_editor_id");
  CREATE INDEX "_comparisons_v_version_workflow_version_workflow_approve_idx" ON "payload"."_comparisons_v" USING btree ("version_workflow_approved_by_id");
  CREATE INDEX "_comparisons_v_version_version_updated_at_idx" ON "payload"."_comparisons_v" USING btree ("version_updated_at");
  CREATE INDEX "_comparisons_v_version_version_created_at_idx" ON "payload"."_comparisons_v" USING btree ("version_created_at");
  CREATE INDEX "_comparisons_v_version_version__status_idx" ON "payload"."_comparisons_v" USING btree ("version__status");
  CREATE INDEX "_comparisons_v_created_at_idx" ON "payload"."_comparisons_v" USING btree ("created_at");
  CREATE INDEX "_comparisons_v_updated_at_idx" ON "payload"."_comparisons_v" USING btree ("updated_at");
  CREATE INDEX "_comparisons_v_latest_idx" ON "payload"."_comparisons_v" USING btree ("latest");
  CREATE INDEX "_comparisons_v_texts_order_parent" ON "payload"."_comparisons_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "products_specs_order_idx" ON "payload"."products_specs" USING btree ("_order");
  CREATE INDEX "products_specs_parent_id_idx" ON "payload"."products_specs" USING btree ("_parent_id");
  CREATE INDEX "products_parts_order_idx" ON "payload"."products_parts" USING btree ("_order");
  CREATE INDEX "products_parts_parent_id_idx" ON "payload"."products_parts" USING btree ("_parent_id");
  CREATE INDEX "products_seo_geo_faq_order_idx" ON "payload"."products_seo_geo_faq" USING btree ("_order");
  CREATE INDEX "products_seo_geo_faq_parent_id_idx" ON "payload"."products_seo_geo_faq" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "payload"."products" USING btree ("slug");
  CREATE INDEX "products_category_idx" ON "payload"."products" USING btree ("category_id");
  CREATE INDEX "products_image_idx" ON "payload"."products" USING btree ("image_id");
  CREATE INDEX "products_seo_seo_image_idx" ON "payload"."products" USING btree ("seo_image_id");
  CREATE INDEX "products_updated_at_idx" ON "payload"."products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "payload"."products" USING btree ("created_at");
  CREATE INDEX "products_texts_order_parent" ON "payload"."products_texts" USING btree ("order","parent_id");
  CREATE INDEX "products_rels_order_idx" ON "payload"."products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "payload"."products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "payload"."products_rels" USING btree ("path");
  CREATE INDEX "products_rels_products_id_idx" ON "payload"."products_rels" USING btree ("products_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "payload"."categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "payload"."categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "payload"."categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "payload"."authors" USING btree ("slug");
  CREATE INDEX "authors_avatar_idx" ON "payload"."authors" USING btree ("avatar_id");
  CREATE INDEX "authors_updated_at_idx" ON "payload"."authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "payload"."authors" USING btree ("created_at");
  CREATE INDEX "authors_texts_order_parent" ON "payload"."authors_texts" USING btree ("order","parent_id");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "payload"."media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "payload"."media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "payload"."media" USING btree ("sizes_og_filename");
  CREATE INDEX "media_sizes_reel_sizes_reel_filename_idx" ON "payload"."media" USING btree ("sizes_reel_filename");
  CREATE UNIQUE INDEX "videos_youtube_id_idx" ON "payload"."videos" USING btree ("youtube_id");
  CREATE INDEX "videos_thumb_idx" ON "payload"."videos" USING btree ("thumb_id");
  CREATE INDEX "videos_updated_at_idx" ON "payload"."videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "payload"."videos" USING btree ("created_at");
  CREATE INDEX "videos_rels_order_idx" ON "payload"."videos_rels" USING btree ("order");
  CREATE INDEX "videos_rels_parent_idx" ON "payload"."videos_rels" USING btree ("parent_id");
  CREATE INDEX "videos_rels_path_idx" ON "payload"."videos_rels" USING btree ("path");
  CREATE INDEX "videos_rels_products_id_idx" ON "payload"."videos_rels" USING btree ("products_id");
  CREATE INDEX "reels_cover_idx" ON "payload"."reels" USING btree ("cover_id");
  CREATE INDEX "reels_updated_at_idx" ON "payload"."reels" USING btree ("updated_at");
  CREATE INDEX "reels_created_at_idx" ON "payload"."reels" USING btree ("created_at");
  CREATE INDEX "ads_image_idx" ON "payload"."ads" USING btree ("image_id");
  CREATE INDEX "ads_mobile_image_idx" ON "payload"."ads" USING btree ("mobile_image_id");
  CREATE INDEX "ads_updated_at_idx" ON "payload"."ads" USING btree ("updated_at");
  CREATE INDEX "ads_created_at_idx" ON "payload"."ads" USING btree ("created_at");
  CREATE INDEX "ads_rels_order_idx" ON "payload"."ads_rels" USING btree ("order");
  CREATE INDEX "ads_rels_parent_idx" ON "payload"."ads_rels" USING btree ("parent_id");
  CREATE INDEX "ads_rels_path_idx" ON "payload"."ads_rels" USING btree ("path");
  CREATE INDEX "ads_rels_categories_id_idx" ON "payload"."ads_rels" USING btree ("categories_id");
  CREATE INDEX "kulup_tracks_modules_steps_order_idx" ON "payload"."kulup_tracks_modules_steps" USING btree ("_order");
  CREATE INDEX "kulup_tracks_modules_steps_parent_id_idx" ON "payload"."kulup_tracks_modules_steps" USING btree ("_parent_id");
  CREATE INDEX "kulup_tracks_modules_steps_quiz_idx" ON "payload"."kulup_tracks_modules_steps" USING btree ("quiz_id");
  CREATE INDEX "kulup_tracks_modules_order_idx" ON "payload"."kulup_tracks_modules" USING btree ("_order");
  CREATE INDEX "kulup_tracks_modules_parent_id_idx" ON "payload"."kulup_tracks_modules" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "kulup_tracks_slug_idx" ON "payload"."kulup_tracks" USING btree ("slug");
  CREATE INDEX "kulup_tracks_image_idx" ON "payload"."kulup_tracks" USING btree ("image_id");
  CREATE INDEX "kulup_tracks_updated_at_idx" ON "payload"."kulup_tracks" USING btree ("updated_at");
  CREATE INDEX "kulup_tracks_created_at_idx" ON "payload"."kulup_tracks" USING btree ("created_at");
  CREATE INDEX "kulup_quizzes_questions_order_idx" ON "payload"."kulup_quizzes_questions" USING btree ("_order");
  CREATE INDEX "kulup_quizzes_questions_parent_id_idx" ON "payload"."kulup_quizzes_questions" USING btree ("_parent_id");
  CREATE INDEX "kulup_quizzes_updated_at_idx" ON "payload"."kulup_quizzes" USING btree ("updated_at");
  CREATE INDEX "kulup_quizzes_created_at_idx" ON "payload"."kulup_quizzes" USING btree ("created_at");
  CREATE INDEX "kulup_quizzes_texts_order_parent" ON "payload"."kulup_quizzes_texts" USING btree ("order","parent_id");
  CREATE INDEX "pages_seo_geo_faq_order_idx" ON "payload"."pages_seo_geo_faq" USING btree ("_order");
  CREATE INDEX "pages_seo_geo_faq_parent_id_idx" ON "payload"."pages_seo_geo_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_seo_seo_image_idx" ON "payload"."pages" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "payload"."pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "payload"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "payload"."pages" USING btree ("_status");
  CREATE INDEX "pages_texts_order_parent" ON "payload"."pages_texts" USING btree ("order","parent_id");
  CREATE INDEX "_pages_v_version_seo_geo_faq_order_idx" ON "payload"."_pages_v_version_seo_geo_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_version_seo_geo_faq_parent_id_idx" ON "payload"."_pages_v_version_seo_geo_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "payload"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_seo_version_seo_image_idx" ON "payload"."_pages_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "payload"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "payload"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "payload"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "payload"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "payload"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "payload"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "payload"."_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_texts_order_parent" ON "payload"."_pages_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_author_idx" ON "payload"."users" USING btree ("author_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload"."payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload"."payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload"."payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload"."payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload"."payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload"."payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload"."payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload"."payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload"."payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload"."payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload"."payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_comparisons_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("comparisons_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_locked_documents_rels_reels_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("reels_id");
  CREATE INDEX "payload_locked_documents_rels_ads_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("ads_id");
  CREATE INDEX "payload_locked_documents_rels_kulup_tracks_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("kulup_tracks_id");
  CREATE INDEX "payload_locked_documents_rels_kulup_quizzes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("kulup_quizzes_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "home_rels_order_idx" ON "payload"."home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "payload"."home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "payload"."home_rels" USING btree ("path");
  CREATE INDEX "home_rels_news_id_idx" ON "payload"."home_rels" USING btree ("news_id");
  CREATE INDEX "home_rels_reviews_id_idx" ON "payload"."home_rels" USING btree ("reviews_id");
  CREATE INDEX "home_rels_comparisons_id_idx" ON "payload"."home_rels" USING btree ("comparisons_id");
  CREATE INDEX "site_nav_order_idx" ON "payload"."site_nav" USING btree ("_order");
  CREATE INDEX "site_nav_parent_id_idx" ON "payload"."site_nav" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."news_sources" CASCADE;
  DROP TABLE "payload"."news_corrections" CASCADE;
  DROP TABLE "payload"."news_seo_geo_faq" CASCADE;
  DROP TABLE "payload"."news" CASCADE;
  DROP TABLE "payload"."news_texts" CASCADE;
  DROP TABLE "payload"."news_rels" CASCADE;
  DROP TABLE "payload"."_news_v_version_sources" CASCADE;
  DROP TABLE "payload"."_news_v_version_corrections" CASCADE;
  DROP TABLE "payload"."_news_v_version_seo_geo_faq" CASCADE;
  DROP TABLE "payload"."_news_v" CASCADE;
  DROP TABLE "payload"."_news_v_texts" CASCADE;
  DROP TABLE "payload"."_news_v_rels" CASCADE;
  DROP TABLE "payload"."reviews_sources" CASCADE;
  DROP TABLE "payload"."reviews_corrections" CASCADE;
  DROP TABLE "payload"."reviews_seo_geo_faq" CASCADE;
  DROP TABLE "payload"."reviews" CASCADE;
  DROP TABLE "payload"."reviews_texts" CASCADE;
  DROP TABLE "payload"."_reviews_v_version_sources" CASCADE;
  DROP TABLE "payload"."_reviews_v_version_corrections" CASCADE;
  DROP TABLE "payload"."_reviews_v_version_seo_geo_faq" CASCADE;
  DROP TABLE "payload"."_reviews_v" CASCADE;
  DROP TABLE "payload"."_reviews_v_texts" CASCADE;
  DROP TABLE "payload"."comparisons_key_diffs" CASCADE;
  DROP TABLE "payload"."comparisons_seo_geo_faq" CASCADE;
  DROP TABLE "payload"."comparisons" CASCADE;
  DROP TABLE "payload"."comparisons_texts" CASCADE;
  DROP TABLE "payload"."_comparisons_v_version_key_diffs" CASCADE;
  DROP TABLE "payload"."_comparisons_v_version_seo_geo_faq" CASCADE;
  DROP TABLE "payload"."_comparisons_v" CASCADE;
  DROP TABLE "payload"."_comparisons_v_texts" CASCADE;
  DROP TABLE "payload"."products_specs" CASCADE;
  DROP TABLE "payload"."products_parts" CASCADE;
  DROP TABLE "payload"."products_seo_geo_faq" CASCADE;
  DROP TABLE "payload"."products" CASCADE;
  DROP TABLE "payload"."products_texts" CASCADE;
  DROP TABLE "payload"."products_rels" CASCADE;
  DROP TABLE "payload"."categories" CASCADE;
  DROP TABLE "payload"."authors" CASCADE;
  DROP TABLE "payload"."authors_texts" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."videos" CASCADE;
  DROP TABLE "payload"."videos_rels" CASCADE;
  DROP TABLE "payload"."reels" CASCADE;
  DROP TABLE "payload"."ads" CASCADE;
  DROP TABLE "payload"."ads_rels" CASCADE;
  DROP TABLE "payload"."kulup_tracks_modules_steps" CASCADE;
  DROP TABLE "payload"."kulup_tracks_modules" CASCADE;
  DROP TABLE "payload"."kulup_tracks" CASCADE;
  DROP TABLE "payload"."kulup_quizzes_questions" CASCADE;
  DROP TABLE "payload"."kulup_quizzes" CASCADE;
  DROP TABLE "payload"."kulup_quizzes_texts" CASCADE;
  DROP TABLE "payload"."pages_seo_geo_faq" CASCADE;
  DROP TABLE "payload"."pages" CASCADE;
  DROP TABLE "payload"."pages_texts" CASCADE;
  DROP TABLE "payload"."_pages_v_version_seo_geo_faq" CASCADE;
  DROP TABLE "payload"."_pages_v" CASCADE;
  DROP TABLE "payload"."_pages_v_texts" CASCADE;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_jobs_log" CASCADE;
  DROP TABLE "payload"."payload_jobs" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."home" CASCADE;
  DROP TABLE "payload"."home_rels" CASCADE;
  DROP TABLE "payload"."site_nav" CASCADE;
  DROP TABLE "payload"."site" CASCADE;
  DROP TYPE "payload"."enum_news_label";
  DROP TYPE "payload"."enum_news_certainty";
  DROP TYPE "payload"."enum_news_workflow_state";
  DROP TYPE "payload"."enum_news_status";
  DROP TYPE "payload"."enum__news_v_version_label";
  DROP TYPE "payload"."enum__news_v_version_certainty";
  DROP TYPE "payload"."enum__news_v_version_workflow_state";
  DROP TYPE "payload"."enum__news_v_version_status";
  DROP TYPE "payload"."enum_reviews_workflow_state";
  DROP TYPE "payload"."enum_reviews_status";
  DROP TYPE "payload"."enum__reviews_v_version_workflow_state";
  DROP TYPE "payload"."enum__reviews_v_version_status";
  DROP TYPE "payload"."enum_comparisons_key_diffs_winner";
  DROP TYPE "payload"."enum_comparisons_workflow_state";
  DROP TYPE "payload"."enum_comparisons_status";
  DROP TYPE "payload"."enum__comparisons_v_version_key_diffs_winner";
  DROP TYPE "payload"."enum__comparisons_v_version_workflow_state";
  DROP TYPE "payload"."enum__comparisons_v_version_status";
  DROP TYPE "payload"."enum_products_specs_source";
  DROP TYPE "payload"."enum_products_type";
  DROP TYPE "payload"."enum_products_status";
  DROP TYPE "payload"."enum_videos_kind";
  DROP TYPE "payload"."enum_ads_slot";
  DROP TYPE "payload"."enum_kulup_tracks_modules_steps_kind";
  DROP TYPE "payload"."enum_kulup_tracks_modules_steps_simulator_id";
  DROP TYPE "payload"."enum_pages_status";
  DROP TYPE "payload"."enum__pages_v_version_status";
  DROP TYPE "payload"."enum_users_role";
  DROP TYPE "payload"."enum_payload_jobs_log_task_slug";
  DROP TYPE "payload"."enum_payload_jobs_log_state";
  DROP TYPE "payload"."enum_payload_jobs_task_slug";
  DROP TYPE "payload"."enum_home_hero_layout";`)
}
