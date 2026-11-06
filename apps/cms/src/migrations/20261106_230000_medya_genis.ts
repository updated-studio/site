import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Galeri (6 Kasım 2026): yazı içi fotoğraf kendi oranında; "genis" boyu 1400 px, kırpılmaz
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."media" ADD COLUMN IF NOT EXISTS "sizes_genis_url" varchar;
  ALTER TABLE "payload"."media" ADD COLUMN IF NOT EXISTS "sizes_genis_width" numeric;
  ALTER TABLE "payload"."media" ADD COLUMN IF NOT EXISTS "sizes_genis_height" numeric;
  ALTER TABLE "payload"."media" ADD COLUMN IF NOT EXISTS "sizes_genis_mime_type" varchar;
  ALTER TABLE "payload"."media" ADD COLUMN IF NOT EXISTS "sizes_genis_filesize" numeric;
  ALTER TABLE "payload"."media" ADD COLUMN IF NOT EXISTS "sizes_genis_filename" varchar;
  CREATE INDEX IF NOT EXISTS "media_sizes_genis_sizes_genis_filename_idx" ON "payload"."media" USING btree ("sizes_genis_filename");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "payload"."media_sizes_genis_sizes_genis_filename_idx";
  ALTER TABLE "payload"."media" DROP COLUMN IF EXISTS "sizes_genis_url";
  ALTER TABLE "payload"."media" DROP COLUMN IF EXISTS "sizes_genis_width";
  ALTER TABLE "payload"."media" DROP COLUMN IF EXISTS "sizes_genis_height";
  ALTER TABLE "payload"."media" DROP COLUMN IF EXISTS "sizes_genis_mime_type";
  ALTER TABLE "payload"."media" DROP COLUMN IF EXISTS "sizes_genis_filesize";
  ALTER TABLE "payload"."media" DROP COLUMN IF EXISTS "sizes_genis_filename";`)
}
