import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_gorevler_durum" AS ENUM('yayinda', 'taslak');
  CREATE TYPE "payload"."enum_gorev_fotolari_durum" AS ENUM('bekliyor', 'onaylandi', 'reddedildi');
  CREATE TABLE "payload"."gorevler" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"baslik" varchar NOT NULL,
  	"aciklama" varchar,
  	"baslangic" timestamp(3) with time zone NOT NULL,
  	"durum" "payload"."enum_gorevler_durum" DEFAULT 'yayinda',
  	"bitis" timestamp(3) with time zone,
  	"oylama_bitis" timestamp(3) with time zone,
  	"sonuc_aciklandi" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."gorev_fotolari" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"gorev_id" integer NOT NULL,
  	"uye_id" integer NOT NULL,
  	"gorsel_id" integer NOT NULL,
  	"aciklama" varchar,
  	"durum" "payload"."enum_gorev_fotolari_durum" DEFAULT 'bekliyor' NOT NULL,
  	"oy" numeric,
  	"sira" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."gorev_gorselleri" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"prefix" varchar DEFAULT 'gorev',
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
  	"sizes_kucuk_url" varchar,
  	"sizes_kucuk_width" numeric,
  	"sizes_kucuk_height" numeric,
  	"sizes_kucuk_mime_type" varchar,
  	"sizes_kucuk_filesize" numeric,
  	"sizes_kucuk_filename" varchar,
  	"sizes_buyuk_url" varchar,
  	"sizes_buyuk_width" numeric,
  	"sizes_buyuk_height" numeric,
  	"sizes_buyuk_mime_type" varchar,
  	"sizes_buyuk_filesize" numeric,
  	"sizes_buyuk_filename" varchar
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "gorevler_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "gorev_fotolari_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "gorev_gorselleri_id" integer;
  ALTER TABLE "payload"."gorev_fotolari" ADD CONSTRAINT "gorev_fotolari_gorev_id_gorevler_id_fk" FOREIGN KEY ("gorev_id") REFERENCES "payload"."gorevler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."gorev_fotolari" ADD CONSTRAINT "gorev_fotolari_uye_id_uyeler_id_fk" FOREIGN KEY ("uye_id") REFERENCES "payload"."uyeler"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."gorev_fotolari" ADD CONSTRAINT "gorev_fotolari_gorsel_id_gorev_gorselleri_id_fk" FOREIGN KEY ("gorsel_id") REFERENCES "payload"."gorev_gorselleri"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "gorevler_baslangic_idx" ON "payload"."gorevler" USING btree ("baslangic");
  CREATE INDEX "gorevler_updated_at_idx" ON "payload"."gorevler" USING btree ("updated_at");
  CREATE INDEX "gorevler_created_at_idx" ON "payload"."gorevler" USING btree ("created_at");
  CREATE INDEX "gorev_fotolari_gorev_idx" ON "payload"."gorev_fotolari" USING btree ("gorev_id");
  CREATE INDEX "gorev_fotolari_uye_idx" ON "payload"."gorev_fotolari" USING btree ("uye_id");
  CREATE INDEX "gorev_fotolari_gorsel_idx" ON "payload"."gorev_fotolari" USING btree ("gorsel_id");
  CREATE INDEX "gorev_fotolari_durum_idx" ON "payload"."gorev_fotolari" USING btree ("durum");
  CREATE INDEX "gorev_fotolari_updated_at_idx" ON "payload"."gorev_fotolari" USING btree ("updated_at");
  CREATE INDEX "gorev_fotolari_created_at_idx" ON "payload"."gorev_fotolari" USING btree ("created_at");
  CREATE INDEX "gorev_gorselleri_updated_at_idx" ON "payload"."gorev_gorselleri" USING btree ("updated_at");
  CREATE INDEX "gorev_gorselleri_created_at_idx" ON "payload"."gorev_gorselleri" USING btree ("created_at");
  CREATE UNIQUE INDEX "gorev_gorselleri_filename_idx" ON "payload"."gorev_gorselleri" USING btree ("filename");
  CREATE INDEX "gorev_gorselleri_sizes_kucuk_sizes_kucuk_filename_idx" ON "payload"."gorev_gorselleri" USING btree ("sizes_kucuk_filename");
  CREATE INDEX "gorev_gorselleri_sizes_buyuk_sizes_buyuk_filename_idx" ON "payload"."gorev_gorselleri" USING btree ("sizes_buyuk_filename");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gorevler_fk" FOREIGN KEY ("gorevler_id") REFERENCES "payload"."gorevler"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gorev_fotolari_fk" FOREIGN KEY ("gorev_fotolari_id") REFERENCES "payload"."gorev_fotolari"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gorev_gorselleri_fk" FOREIGN KEY ("gorev_gorselleri_id") REFERENCES "payload"."gorev_gorselleri"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_gorevler_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("gorevler_id");
  CREATE INDEX "payload_locked_documents_rels_gorev_fotolari_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("gorev_fotolari_id");
  CREATE INDEX "payload_locked_documents_rels_gorev_gorselleri_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("gorev_gorselleri_id");
  ALTER TABLE "payload"."gorevler" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."gorev_fotolari" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."gorev_gorselleri" ENABLE ROW LEVEL SECURITY;
  -- Kör oylama: kim hangi fotoğrafa oy verdi (görev başına en çok 3; uç /api/uye/gorev/oy)
  CREATE TABLE IF NOT EXISTS "payload"."gorev_oy" ("uye_id" integer NOT NULL REFERENCES "payload"."uyeler"("id") ON DELETE cascade, "foto_id" integer NOT NULL REFERENCES "payload"."gorev_fotolari"("id") ON DELETE cascade, "gorev_id" integer NOT NULL REFERENCES "payload"."gorevler"("id") ON DELETE cascade, "at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("uye_id", "foto_id"));
  CREATE INDEX IF NOT EXISTS "gorev_oy_foto_idx" ON "payload"."gorev_oy" ("foto_id");
  CREATE INDEX IF NOT EXISTS "gorev_oy_uye_gorev_idx" ON "payload"."gorev_oy" ("uye_id", "gorev_id");
  ALTER TABLE "payload"."gorev_oy" ENABLE ROW LEVEL SECURITY;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "payload"."gorev_oy" CASCADE;
   ALTER TABLE "payload"."gorevler" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."gorev_fotolari" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."gorev_gorselleri" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."gorevler" CASCADE;
  DROP TABLE "payload"."gorev_fotolari" CASCADE;
  DROP TABLE "payload"."gorev_gorselleri" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gorevler_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gorev_fotolari_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gorev_gorselleri_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_gorevler_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_gorev_fotolari_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_gorev_gorselleri_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "gorevler_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "gorev_fotolari_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "gorev_gorselleri_id";
  DROP TYPE "payload"."enum_gorevler_durum";
  DROP TYPE "payload"."enum_gorev_fotolari_durum";`)
}
