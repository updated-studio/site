import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."products" ADD COLUMN "upscore" numeric;
  ALTER TABLE "payload"."products" ADD COLUMN "upscore_review_id" integer;
  ALTER TABLE "payload"."products" ADD COLUMN "amazon" varchar;
  ALTER TABLE "payload"."site" ADD COLUMN "amazon_tag" varchar;
  ALTER TABLE "payload"."products" ADD CONSTRAINT "products_upscore_review_id_reviews_id_fk" FOREIGN KEY ("upscore_review_id") REFERENCES "payload"."reviews"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_upscore_review_idx" ON "payload"."products" USING btree ("upscore_review_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."products" DROP CONSTRAINT "products_upscore_review_id_reviews_id_fk";
  
  DROP INDEX "payload"."products_upscore_review_idx";
  ALTER TABLE "payload"."products" DROP COLUMN "upscore";
  ALTER TABLE "payload"."products" DROP COLUMN "upscore_review_id";
  ALTER TABLE "payload"."products" DROP COLUMN "amazon";
  ALTER TABLE "payload"."site" DROP COLUMN "amazon_tag";`)
}
