import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."news_liste" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"urun_id" integer,
  	"baslik" varchar,
  	"gerekce" varchar
  );
  
  CREATE TABLE "payload"."_news_v_version_liste" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"urun_id" integer,
  	"baslik" varchar,
  	"gerekce" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "payload"."news_liste" ADD CONSTRAINT "news_liste_urun_id_products_id_fk" FOREIGN KEY ("urun_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."news_liste" ADD CONSTRAINT "news_liste_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_news_v_version_liste" ADD CONSTRAINT "_news_v_version_liste_urun_id_products_id_fk" FOREIGN KEY ("urun_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_news_v_version_liste" ADD CONSTRAINT "_news_v_version_liste_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "news_liste_order_idx" ON "payload"."news_liste" USING btree ("_order");
  CREATE INDEX "news_liste_parent_id_idx" ON "payload"."news_liste" USING btree ("_parent_id");
  CREATE INDEX "news_liste_urun_idx" ON "payload"."news_liste" USING btree ("urun_id");
  CREATE INDEX "_news_v_version_liste_order_idx" ON "payload"."_news_v_version_liste" USING btree ("_order");
  CREATE INDEX "_news_v_version_liste_parent_id_idx" ON "payload"."_news_v_version_liste" USING btree ("_parent_id");
  CREATE INDEX "_news_v_version_liste_urun_idx" ON "payload"."_news_v_version_liste" USING btree ("urun_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."news_liste" CASCADE;
  DROP TABLE "payload"."_news_v_version_liste" CASCADE;`)
}
