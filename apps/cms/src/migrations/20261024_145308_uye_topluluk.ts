import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_uyeler_ekipman_tur" AS ENUM('Kamera', 'Lens', 'Gimbal', 'Dron', 'Işık', 'Ses', 'Telefon', 'Bilgisayar', 'Diğer');
  CREATE TYPE "payload"."enum_uyeler_durum" AS ENUM('aktif', 'susturuldu', 'engelli');
  CREATE TYPE "payload"."enum_uyeler_renk" AS ENUM('turuncu', 'mavi', 'siyah', 'gri');
  CREATE TYPE "payload"."enum_uyeler_giris" AS ENUM('email', 'google');
  CREATE TYPE "payload"."enum_yorumlar_durum" AS ENUM('yayinda', 'onay-bekliyor', 'gizli', 'silindi');
  CREATE TABLE "payload"."uyeler_ekipman" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tur" "payload"."enum_uyeler_ekipman_tur" DEFAULT 'Kamera',
  	"ad" varchar NOT NULL,
  	"urun_id" integer
  );
  
  CREATE TABLE "payload"."uyeler" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kullanici_adi" varchar NOT NULL,
  	"ad" varchar NOT NULL,
  	"bio" varchar,
  	"durum" "payload"."enum_uyeler_durum" DEFAULT 'aktif' NOT NULL,
  	"guvenilir" boolean DEFAULT false,
  	"renk" "payload"."enum_uyeler_renk" DEFAULT 'turuncu',
  	"bildirim_eposta" boolean DEFAULT true,
  	"puan" numeric DEFAULT 0,
  	"ekip" boolean DEFAULT false,
  	"email" varchar NOT NULL,
  	"auth_id" varchar NOT NULL,
  	"giris" "payload"."enum_uyeler_giris",
  	"onaylar_sozlesme" timestamp(3) with time zone,
  	"onaylar_kvkk" timestamp(3) with time zone,
  	"son_giris" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."yorumlar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"metin" varchar NOT NULL,
  	"durum" "payload"."enum_yorumlar_durum" DEFAULT 'yayinda' NOT NULL,
  	"neden" varchar,
  	"uye_id" integer,
  	"ust_id" integer,
  	"yanitlanan_id" integer,
  	"begeni" numeric DEFAULT 0,
  	"sikayet" numeric DEFAULT 0,
  	"yol" varchar,
  	"duzenlendi" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."yorumlar_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer,
  	"reviews_id" integer,
  	"comparisons_id" integer
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "uyeler_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "yorumlar_id" integer;
  ALTER TABLE "payload"."uyeler_ekipman" ADD CONSTRAINT "uyeler_ekipman_urun_id_products_id_fk" FOREIGN KEY ("urun_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."uyeler_ekipman" ADD CONSTRAINT "uyeler_ekipman_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."uyeler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."yorumlar" ADD CONSTRAINT "yorumlar_uye_id_uyeler_id_fk" FOREIGN KEY ("uye_id") REFERENCES "payload"."uyeler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."yorumlar" ADD CONSTRAINT "yorumlar_ust_id_yorumlar_id_fk" FOREIGN KEY ("ust_id") REFERENCES "payload"."yorumlar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."yorumlar" ADD CONSTRAINT "yorumlar_yanitlanan_id_yorumlar_id_fk" FOREIGN KEY ("yanitlanan_id") REFERENCES "payload"."yorumlar"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."yorumlar_rels" ADD CONSTRAINT "yorumlar_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."yorumlar"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."yorumlar_rels" ADD CONSTRAINT "yorumlar_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."yorumlar_rels" ADD CONSTRAINT "yorumlar_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."yorumlar_rels" ADD CONSTRAINT "yorumlar_rels_comparisons_fk" FOREIGN KEY ("comparisons_id") REFERENCES "payload"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "uyeler_ekipman_order_idx" ON "payload"."uyeler_ekipman" USING btree ("_order");
  CREATE INDEX "uyeler_ekipman_parent_id_idx" ON "payload"."uyeler_ekipman" USING btree ("_parent_id");
  CREATE INDEX "uyeler_ekipman_urun_idx" ON "payload"."uyeler_ekipman" USING btree ("urun_id");
  CREATE UNIQUE INDEX "uyeler_kullanici_adi_idx" ON "payload"."uyeler" USING btree ("kullanici_adi");
  CREATE UNIQUE INDEX "uyeler_auth_id_idx" ON "payload"."uyeler" USING btree ("auth_id");
  CREATE INDEX "uyeler_updated_at_idx" ON "payload"."uyeler" USING btree ("updated_at");
  CREATE INDEX "uyeler_created_at_idx" ON "payload"."uyeler" USING btree ("created_at");
  CREATE INDEX "yorumlar_durum_idx" ON "payload"."yorumlar" USING btree ("durum");
  CREATE INDEX "yorumlar_uye_idx" ON "payload"."yorumlar" USING btree ("uye_id");
  CREATE INDEX "yorumlar_ust_idx" ON "payload"."yorumlar" USING btree ("ust_id");
  CREATE INDEX "yorumlar_yanitlanan_idx" ON "payload"."yorumlar" USING btree ("yanitlanan_id");
  CREATE INDEX "yorumlar_updated_at_idx" ON "payload"."yorumlar" USING btree ("updated_at");
  CREATE INDEX "yorumlar_created_at_idx" ON "payload"."yorumlar" USING btree ("created_at");
  CREATE INDEX "yorumlar_rels_order_idx" ON "payload"."yorumlar_rels" USING btree ("order");
  CREATE INDEX "yorumlar_rels_parent_idx" ON "payload"."yorumlar_rels" USING btree ("parent_id");
  CREATE INDEX "yorumlar_rels_path_idx" ON "payload"."yorumlar_rels" USING btree ("path");
  CREATE INDEX "yorumlar_rels_news_id_idx" ON "payload"."yorumlar_rels" USING btree ("news_id");
  CREATE INDEX "yorumlar_rels_reviews_id_idx" ON "payload"."yorumlar_rels" USING btree ("reviews_id");
  CREATE INDEX "yorumlar_rels_comparisons_id_idx" ON "payload"."yorumlar_rels" USING btree ("comparisons_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_uyeler_fk" FOREIGN KEY ("uyeler_id") REFERENCES "payload"."uyeler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_yorumlar_fk" FOREIGN KEY ("yorumlar_id") REFERENCES "payload"."yorumlar"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_uyeler_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("uyeler_id");
  CREATE INDEX "payload_locked_documents_rels_yorumlar_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("yorumlar_id");
  -- Uper etkileşimleri (ham tablolar; lib/uye.ts, endpoints/uye.ts). Uper silinince satırları da silinir.
  CREATE TABLE IF NOT EXISTS "payload"."uye_tepki" ("uye_id" integer NOT NULL REFERENCES "payload"."uyeler"("id") ON DELETE cascade, "hedef" text NOT NULL, "tur" text NOT NULL, "at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("uye_id", "hedef"));
  CREATE INDEX IF NOT EXISTS "uye_tepki_hedef_idx" ON "payload"."uye_tepki" ("hedef");
  CREATE TABLE IF NOT EXISTS "payload"."yorum_begeni" ("uye_id" integer NOT NULL REFERENCES "payload"."uyeler"("id") ON DELETE cascade, "yorum_id" integer NOT NULL REFERENCES "payload"."yorumlar"("id") ON DELETE cascade, "at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("uye_id", "yorum_id"));
  CREATE INDEX IF NOT EXISTS "yorum_begeni_yorum_idx" ON "payload"."yorum_begeni" ("yorum_id");
  CREATE TABLE IF NOT EXISTS "payload"."yorum_sikayet" ("uye_id" integer NOT NULL REFERENCES "payload"."uyeler"("id") ON DELETE cascade, "yorum_id" integer NOT NULL REFERENCES "payload"."yorumlar"("id") ON DELETE cascade, "neden" text, "at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("uye_id", "yorum_id"));
  CREATE INDEX IF NOT EXISTS "yorum_sikayet_yorum_idx" ON "payload"."yorum_sikayet" ("yorum_id");
  CREATE TABLE IF NOT EXISTS "payload"."uye_kayit" ("uye_id" integer NOT NULL REFERENCES "payload"."uyeler"("id") ON DELETE cascade, "hedef" text NOT NULL, "at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("uye_id", "hedef"));
  CREATE TABLE IF NOT EXISTS "payload"."uye_bildirim" ("id" bigserial PRIMARY KEY, "uye_id" integer NOT NULL REFERENCES "payload"."uyeler"("id") ON DELETE cascade, "tur" text NOT NULL, "metin" text NOT NULL, "yol" text, "okundu" boolean NOT NULL DEFAULT false, "at" timestamptz NOT NULL DEFAULT now());
  CREATE INDEX IF NOT EXISTS "uye_bildirim_uye_idx" ON "payload"."uye_bildirim" ("uye_id", "at" DESC);
  CREATE TABLE IF NOT EXISTS "payload"."uye_puan" ("id" bigserial PRIMARY KEY, "uye_id" integer NOT NULL REFERENCES "payload"."uyeler"("id") ON DELETE cascade, "tur" text NOT NULL, "puan" integer NOT NULL, "ref" text NOT NULL, "at" timestamptz NOT NULL DEFAULT now(), UNIQUE ("uye_id", "tur", "ref"));
  CREATE INDEX IF NOT EXISTS "uye_puan_gun_idx" ON "payload"."uye_puan" ("uye_id", "tur", "at");
  CREATE TABLE IF NOT EXISTS "payload"."uye_kulup" ("uye_id" integer PRIMARY KEY REFERENCES "payload"."uyeler"("id") ON DELETE cascade, "durum" jsonb NOT NULL, "at" timestamptz NOT NULL DEFAULT now());`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "payload"."uye_tepki", "payload"."yorum_begeni", "payload"."yorum_sikayet", "payload"."uye_kayit", "payload"."uye_bildirim", "payload"."uye_puan", "payload"."uye_kulup" CASCADE;
   ALTER TABLE "payload"."uyeler_ekipman" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."uyeler" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."yorumlar" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."yorumlar_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."uyeler_ekipman" CASCADE;
  DROP TABLE "payload"."uyeler" CASCADE;
  DROP TABLE "payload"."yorumlar" CASCADE;
  DROP TABLE "payload"."yorumlar_rels" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_uyeler_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_yorumlar_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_uyeler_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_yorumlar_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "uyeler_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "yorumlar_id";
  DROP TYPE "payload"."enum_uyeler_ekipman_tur";
  DROP TYPE "payload"."enum_uyeler_durum";
  DROP TYPE "payload"."enum_uyeler_renk";
  DROP TYPE "payload"."enum_uyeler_giris";
  DROP TYPE "payload"."enum_yorumlar_durum";`)
}
