import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_yarismalar_durum" AS ENUM('oneri', 'yayinda', 'gizli');
  CREATE TYPE "payload"."enum_yarismalar_tur" AS ENUM('fotograf', 'kisa-film', 'video', 'karma');
  CREATE TYPE "payload"."enum_yarismalar_kapsam" AS ENUM('turkiye', 'uluslararasi');
  CREATE TABLE "payload"."yarismalar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ad" varchar NOT NULL,
  	"duzenleyen" varchar,
  	"durum" "payload"."enum_yarismalar_durum" DEFAULT 'yayinda' NOT NULL,
  	"tur" "payload"."enum_yarismalar_tur" DEFAULT 'fotograf' NOT NULL,
  	"kapsam" "payload"."enum_yarismalar_kapsam" DEFAULT 'turkiye',
  	"son_tarih" timestamp(3) with time zone NOT NULL,
  	"sonuc_tarihi" timestamp(3) with time zone,
  	"ucretsiz" boolean,
  	"konu" varchar,
  	"baglanti" varchar NOT NULL,
  	"odul" varchar,
  	"ucret" varchar,
  	"aciklama" varchar,
  	"kaynak" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "yarismalar_id" integer;
  CREATE INDEX "yarismalar_updated_at_idx" ON "payload"."yarismalar" USING btree ("updated_at");
  CREATE INDEX "yarismalar_created_at_idx" ON "payload"."yarismalar" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_yarismalar_fk" FOREIGN KEY ("yarismalar_id") REFERENCES "payload"."yarismalar"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_yarismalar_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("yarismalar_id");
  CREATE INDEX "yarismalar_son_tarih_idx" ON "payload"."yarismalar" USING btree ("son_tarih");
  ALTER TABLE "payload"."yarismalar" ENABLE ROW LEVEL SECURITY;
  -- Uper'in yarışma kaydı: takip (son tarihten 3 gün önce hatırlatma) ve "katıldım"
  CREATE TABLE IF NOT EXISTS "payload"."uye_yarisma" ("uye_id" integer NOT NULL REFERENCES "payload"."uyeler"("id") ON DELETE cascade, "yarisma_id" integer NOT NULL REFERENCES "payload"."yarismalar"("id") ON DELETE cascade, "takip" boolean NOT NULL DEFAULT false, "katildi" boolean NOT NULL DEFAULT false, "hatirlatildi" boolean NOT NULL DEFAULT false, "at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("uye_id", "yarisma_id"));
  CREATE INDEX IF NOT EXISTS "uye_yarisma_yarisma_idx" ON "payload"."uye_yarisma" ("yarisma_id");
  ALTER TABLE "payload"."uye_yarisma" ENABLE ROW LEVEL SECURITY;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "payload"."uye_yarisma" CASCADE;
  ALTER TABLE "payload"."yarismalar" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."yarismalar" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_yarismalar_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_yarismalar_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "yarismalar_id";
  DROP TYPE "payload"."enum_yarismalar_durum";
  DROP TYPE "payload"."enum_yarismalar_tur";
  DROP TYPE "payload"."enum_yarismalar_kapsam";`)
}
