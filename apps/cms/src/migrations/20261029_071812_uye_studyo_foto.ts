import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_uyeler_foto_tur" ADD VALUE 'studyo';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."uyeler" ALTER COLUMN "foto_tur" SET DATA TYPE text;
  ALTER TABLE "payload"."uyeler" ALTER COLUMN "foto_tur" SET DEFAULT 'harf'::text;
  DROP TYPE "payload"."enum_uyeler_foto_tur";
  CREATE TYPE "payload"."enum_uyeler_foto_tur" AS ENUM('harf', 'google', 'gravatar', 'emoji');
  ALTER TABLE "payload"."uyeler" ALTER COLUMN "foto_tur" SET DEFAULT 'harf'::"payload"."enum_uyeler_foto_tur";
  ALTER TABLE "payload"."uyeler" ALTER COLUMN "foto_tur" SET DATA TYPE "payload"."enum_uyeler_foto_tur" USING "foto_tur"::"payload"."enum_uyeler_foto_tur";`)
}
