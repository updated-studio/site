import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Künyede kısa ad (3 Kasım 2026, kullanıcı: "lensin adını o kadar uzun yazmaya gerek var mı"): kartlarda kısa ad, ürün sayfasında tam ad.
 *  Elle yazıldı (anlık görüntü .json yok); sonraki otomatik göç bu sütunu yeniden eklemeye çalışırsa o satır silinir. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "payload"."products" ADD COLUMN IF NOT EXISTS "short_name" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "payload"."products" DROP COLUMN IF EXISTS "short_name";`)
}
