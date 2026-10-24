import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_uyeler_unvan" AS ENUM('kurucu', 'kurucu-ortak');
  ALTER TABLE "payload"."uyeler" ADD COLUMN "unvan" "payload"."enum_uyeler_unvan";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."uyeler" DROP COLUMN "unvan";
  DROP TYPE "payload"."enum_uyeler_unvan";`)
}
