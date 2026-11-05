import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Künye albümü (6 Kasım 2026): ürünlerde "Albüm" görsel listesi (Products.gallery). Elle yazıldı; Stüdyo künye onayı doldurur. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "payload"."products_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  ALTER TABLE "payload"."products_gallery" ADD CONSTRAINT "products_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "products_gallery_order_idx" ON "payload"."products_gallery" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "products_gallery_parent_id_idx" ON "payload"."products_gallery" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "products_gallery_image_idx" ON "payload"."products_gallery" USING btree ("image_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "payload"."products_gallery" CASCADE;`)
}
