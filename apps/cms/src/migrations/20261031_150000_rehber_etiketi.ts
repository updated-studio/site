import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Rehber etiketi (31 Ekim 2026, kullanıcı: eski WordPress'teki Rehber bölümü): WordPress'te "Rehber ve İpuçları" sayfası "Rehberler"
 * etiketli (post_tag 65) 2 yazıyı listeliyordu; taşımada etiket saklanmadığı için sitedeki Rehber boştu. O iki yazı (WordPress 21590,
 * 19674) "rehber" içerik etiketini alır; yalnız etiketi hâlâ "yok" ise (elle değiştirilmişe dokunulmaz). Son sürüm satırı da güncellenir.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(`
  update payload.news set label = 'rehber' where wp_id in (21590, 19674) and label = 'yok';
  update payload._news_v v set version_label = 'rehber'
    from payload.news n where v.parent_id = n.id and n.wp_id in (21590, 19674) and v.latest and v.version_label = 'yok';
  `))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`
  update payload.news set label = 'yok' where wp_id in (21590, 19674) and label = 'rehber';
  update payload._news_v v set version_label = 'yok'
    from payload.news n where v.parent_id = n.id and n.wp_id in (21590, 19674) and v.latest and v.version_label = 'rehber';
  `))
}
