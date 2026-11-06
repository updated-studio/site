import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Yazar birleştirme (6 Kasım 2026, kullanıcı: "olur düzelt"): panelde aynı kişi için iki yazar kaydı vardı.
 * "Onur" (Onur'un panel hesabına bağlı) → "Onur Kuter" olur; WordPress'ten gelen ve hiçbir yazıda kullanılmayan "Kuter"
 * kaydı silinir, WordPress kimliği kalan kayda geçer. Yalnız beklenen durumda çalışır (adlar ve kullanılmama koşulu), tekrar çalışmaya dayanıklı.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  DECLARE wp numeric;
  BEGIN
    IF EXISTS (select 1 from payload.authors where id = 5 and name = 'Kuter')
       AND NOT EXISTS (select 1 from payload.news where author_id = 5)
       AND NOT EXISTS (select 1 from payload.reviews where author_id = 5)
       AND NOT EXISTS (select 1 from payload.comparisons where author_id = 5)
       AND NOT EXISTS (select 1 from payload.users where author_id = 5)
       AND NOT EXISTS (select 1 from payload._news_v where version_author_id = 5)
       AND NOT EXISTS (select 1 from payload._reviews_v where version_author_id = 5)
       AND NOT EXISTS (select 1 from payload._comparisons_v where version_author_id = 5) THEN
      SELECT wp_id INTO wp FROM payload.authors WHERE id = 5;
      DELETE FROM payload.authors WHERE id = 5;
      UPDATE payload.authors SET wp_id = coalesce(wp_id, wp) WHERE id = 13;
    END IF;
    UPDATE payload.authors SET name = 'Onur Kuter', slug = 'onur-kuter', updated_at = now() WHERE id = 13 AND name = 'Onur';
  END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`UPDATE payload.authors SET name = 'Onur', slug = 'onur' WHERE id = 13 AND name = 'Onur Kuter';`)
}
