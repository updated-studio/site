import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_reviews_score_box_alt_puanlar_baslik" AS ENUM('Görüntü', 'Video', 'Ses', 'Pil', 'Ekran', 'Performans', 'Kullanım', 'Taşınabilirlik', 'Yapı kalitesi', 'Yazılım', 'Fiyat / performans');
  CREATE TYPE "payload"."enum__reviews_v_version_score_box_alt_puanlar_baslik" AS ENUM('Görüntü', 'Video', 'Ses', 'Pil', 'Ekran', 'Performans', 'Kullanım', 'Taşınabilirlik', 'Yapı kalitesi', 'Yazılım', 'Fiyat / performans');
  CREATE TABLE "payload"."reviews_score_box_alt_puanlar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"baslik" "payload"."enum_reviews_score_box_alt_puanlar_baslik",
  	"puan" numeric
  );
  
  CREATE TABLE "payload"."reviews_video_bolumleri" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"zaman" varchar,
  	"ad" varchar
  );
  
  CREATE TABLE "payload"."_reviews_v_version_score_box_alt_puanlar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"baslik" "payload"."enum__reviews_v_version_score_box_alt_puanlar_baslik",
  	"puan" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_reviews_v_version_video_bolumleri" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"zaman" varchar,
  	"ad" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "payload"."reviews_score_box_alt_puanlar" ADD CONSTRAINT "reviews_score_box_alt_puanlar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reviews_video_bolumleri" ADD CONSTRAINT "reviews_video_bolumleri_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v_version_score_box_alt_puanlar" ADD CONSTRAINT "_reviews_v_version_score_box_alt_puanlar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_reviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_reviews_v_version_video_bolumleri" ADD CONSTRAINT "_reviews_v_version_video_bolumleri_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_reviews_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reviews_score_box_alt_puanlar_order_idx" ON "payload"."reviews_score_box_alt_puanlar" USING btree ("_order");
  CREATE INDEX "reviews_score_box_alt_puanlar_parent_id_idx" ON "payload"."reviews_score_box_alt_puanlar" USING btree ("_parent_id");
  CREATE INDEX "reviews_video_bolumleri_order_idx" ON "payload"."reviews_video_bolumleri" USING btree ("_order");
  CREATE INDEX "reviews_video_bolumleri_parent_id_idx" ON "payload"."reviews_video_bolumleri" USING btree ("_parent_id");
  CREATE INDEX "_reviews_v_version_score_box_alt_puanlar_order_idx" ON "payload"."_reviews_v_version_score_box_alt_puanlar" USING btree ("_order");
  CREATE INDEX "_reviews_v_version_score_box_alt_puanlar_parent_id_idx" ON "payload"."_reviews_v_version_score_box_alt_puanlar" USING btree ("_parent_id");
  CREATE INDEX "_reviews_v_version_video_bolumleri_order_idx" ON "payload"."_reviews_v_version_video_bolumleri" USING btree ("_order");
  CREATE INDEX "_reviews_v_version_video_bolumleri_parent_id_idx" ON "payload"."_reviews_v_version_video_bolumleri" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."reviews_score_box_alt_puanlar" CASCADE;
  DROP TABLE "payload"."reviews_video_bolumleri" CASCADE;
  DROP TABLE "payload"."_reviews_v_version_score_box_alt_puanlar" CASCADE;
  DROP TABLE "payload"."_reviews_v_version_video_bolumleri" CASCADE;
  DROP TYPE "payload"."enum_reviews_score_box_alt_puanlar_baslik";
  DROP TYPE "payload"."enum__reviews_v_version_score_box_alt_puanlar_baslik";`)
}
