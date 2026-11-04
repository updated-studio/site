import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Haberde gömülü video alanı (4 Kasım 2026; fields/editorial.ts videoField). Elle yazıldı (anlık görüntü .json yok); sonraki otomatik göç
 *  bu sütunları yeniden eklemeye çalışırsa o satırlar silinir. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload"."news" ADD COLUMN IF NOT EXISTS "video_url" varchar;
  ALTER TABLE "payload"."news" ADD COLUMN IF NOT EXISTS "video_baslik" varchar;
  ALTER TABLE "payload"."news" ADD COLUMN IF NOT EXISTS "video_kanal" varchar;
  ALTER TABLE "payload"."news" ADD COLUMN IF NOT EXISTS "video_resmi_sayfa" varchar;
  ALTER TABLE "payload"."news" ADD COLUMN IF NOT EXISTS "video_spot_altinda" boolean DEFAULT false;
  ALTER TABLE "payload"."_news_v" ADD COLUMN IF NOT EXISTS "version_video_url" varchar;
  ALTER TABLE "payload"."_news_v" ADD COLUMN IF NOT EXISTS "version_video_baslik" varchar;
  ALTER TABLE "payload"."_news_v" ADD COLUMN IF NOT EXISTS "version_video_kanal" varchar;
  ALTER TABLE "payload"."_news_v" ADD COLUMN IF NOT EXISTS "version_video_resmi_sayfa" varchar;
  ALTER TABLE "payload"."_news_v" ADD COLUMN IF NOT EXISTS "version_video_spot_altinda" boolean DEFAULT false;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload"."news" DROP COLUMN IF EXISTS "video_url", DROP COLUMN IF EXISTS "video_baslik", DROP COLUMN IF EXISTS "video_kanal", DROP COLUMN IF EXISTS "video_resmi_sayfa", DROP COLUMN IF EXISTS "video_spot_altinda";
  ALTER TABLE "payload"."_news_v" DROP COLUMN IF EXISTS "version_video_url", DROP COLUMN IF EXISTS "version_video_baslik", DROP COLUMN IF EXISTS "version_video_kanal", DROP COLUMN IF EXISTS "version_video_resmi_sayfa", DROP COLUMN IF EXISTS "version_video_spot_altinda";`)
}
