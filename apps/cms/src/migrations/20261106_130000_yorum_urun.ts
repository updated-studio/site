import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Yorum künyeye de bağlanır (6 Kasım 2026, kullanıcı: "künyeye bağla"): Yorumlar.hedef artık ürün de olabilir.
 * Elle yazıldı; yalnız yeni, boş bırakılabilir bir sütun ekler, eski yorumlara dokunmaz. Ürün silinirse yorum bağı da gider.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload"."yorumlar_rels" ADD COLUMN IF NOT EXISTS "products_id" integer;
  DO $$ BEGIN
    ALTER TABLE "payload"."yorumlar_rels" ADD CONSTRAINT "yorumlar_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE INDEX IF NOT EXISTS "yorumlar_rels_products_id_idx" ON "payload"."yorumlar_rels" USING btree ("products_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload"."yorumlar_rels" DROP CONSTRAINT IF EXISTS "yorumlar_rels_products_fk";
  DROP INDEX IF EXISTS "payload"."yorumlar_rels_products_id_idx";
  ALTER TABLE "payload"."yorumlar_rels" DROP COLUMN IF EXISTS "products_id";`)
}
