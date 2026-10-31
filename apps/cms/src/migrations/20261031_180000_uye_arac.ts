import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Üye araç kayıtları (31 Ekim 2026): storyboard, maliyet, ekipman listesi Uper hesabında saklanır (endpoints/uye.ts /uye/arac/:arac). Hesap silinince gider. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "payload"."uye_arac" (
    "uye_id" integer NOT NULL REFERENCES "payload"."uyeler"("id") ON DELETE cascade,
    "arac" text NOT NULL,
    "veri" jsonb,
    "guncel" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("uye_id", "arac")
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "payload"."uye_arac";`)
}
