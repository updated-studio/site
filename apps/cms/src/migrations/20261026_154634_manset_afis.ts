import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_ads_slot" ADD VALUE 'hp' BEFORE 'in';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."ads" ALTER COLUMN "slot" SET DATA TYPE text;
  DROP TYPE "payload"."enum_ads_slot";
  CREATE TYPE "payload"."enum_ads_slot" AS ENUM('lb', 'mr', 'in', 'video', 'sponsored');
  ALTER TABLE "payload"."ads" ALTER COLUMN "slot" SET DATA TYPE "payload"."enum_ads_slot" USING "slot"::"payload"."enum_ads_slot";`)
}
