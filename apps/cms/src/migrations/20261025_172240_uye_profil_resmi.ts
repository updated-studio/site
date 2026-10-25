import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_uyeler_foto_tur" AS ENUM('harf', 'google', 'gravatar', 'emoji');
  ALTER TABLE "payload"."uyeler" ADD COLUMN "foto_tur" "payload"."enum_uyeler_foto_tur" DEFAULT 'harf';
  ALTER TABLE "payload"."uyeler" ADD COLUMN "foto" varchar;
  ALTER TABLE "payload"."uyeler" ADD COLUMN "emoji" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."uyeler" DROP COLUMN "foto_tur";
  ALTER TABLE "payload"."uyeler" DROP COLUMN "foto";
  ALTER TABLE "payload"."uyeler" DROP COLUMN "emoji";
  DROP TYPE "payload"."enum_uyeler_foto_tur";`)
}
