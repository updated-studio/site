import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."uye_giris" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"son_istek" varchar,
  	"google_id" varchar,
  	"google_secret" varchar,
  	"turnstile_site" varchar,
  	"turnstile_secret" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."uye_giris" CASCADE;`)
}
