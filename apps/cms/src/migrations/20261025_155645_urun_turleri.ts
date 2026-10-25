import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."products" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "payload"."enum_products_type";
  CREATE TYPE "payload"."enum_products_type" AS ENUM('camera', 'lens', 'drone', 'cam360', 'phone', 'gimbal', 'light', 'mic', 'headphones', 'laptop', 'tablet', 'watch', 'pad', 'audio', 'accessory', 'other');
  ALTER TABLE "payload"."products" ALTER COLUMN "type" SET DATA TYPE "payload"."enum_products_type" USING "type"::"payload"."enum_products_type";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."products" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "payload"."enum_products_type";
  CREATE TYPE "payload"."enum_products_type" AS ENUM('phone', 'drone', 'cam360', 'camera', 'pad', 'audio', 'laptop', 'other');
  ALTER TABLE "payload"."products" ALTER COLUMN "type" SET DATA TYPE "payload"."enum_products_type" USING "type"::"payload"."enum_products_type";`)
}
