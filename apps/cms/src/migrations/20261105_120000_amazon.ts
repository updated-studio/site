import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Ürünlerde Amazon fiyatı ve ortaklık bağlantısı (5 Kasım 2026). Elle yazıldı; Stüdyo amazon-fiyat fonksiyonu /api/studyo/amazon-yaz ile doldurur. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."products" ADD COLUMN IF NOT EXISTS "amazon_asin" varchar;
   ALTER TABLE "payload"."products" ADD COLUMN IF NOT EXISTS "amazon_gizle" boolean DEFAULT false;
   ALTER TABLE "payload"."products" ADD COLUMN IF NOT EXISTS "amazon_fiyat" numeric;
   ALTER TABLE "payload"."products" ADD COLUMN IF NOT EXISTS "amazon_fiyat_metni" varchar;
   ALTER TABLE "payload"."products" ADD COLUMN IF NOT EXISTS "amazon_guncel" timestamp(3) with time zone;
   ALTER TABLE "payload"."products" ADD COLUMN IF NOT EXISTS "amazon_url" varchar;
   ALTER TABLE "payload"."products" ADD COLUMN IF NOT EXISTS "amazon_durum" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."products" DROP COLUMN IF EXISTS "amazon_asin";
   ALTER TABLE "payload"."products" DROP COLUMN IF EXISTS "amazon_gizle";
   ALTER TABLE "payload"."products" DROP COLUMN IF EXISTS "amazon_fiyat";
   ALTER TABLE "payload"."products" DROP COLUMN IF EXISTS "amazon_fiyat_metni";
   ALTER TABLE "payload"."products" DROP COLUMN IF EXISTS "amazon_guncel";
   ALTER TABLE "payload"."products" DROP COLUMN IF EXISTS "amazon_url";
   ALTER TABLE "payload"."products" DROP COLUMN IF EXISTS "amazon_durum";`)
}
