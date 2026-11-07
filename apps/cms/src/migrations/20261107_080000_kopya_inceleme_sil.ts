import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Kopya inceleme taslağını silme (7 Kasım 2026, kullanıcı: "Sil"). Belgeden yaz aynı Sigma 85mm incelemesini önce Word'den (8,
 * fotoğraflı), sonra PDF'ten (7, fotoğrafsız) taslak yaptı. 7 silinir, sürüm kayıtlarıyla birlikte. Yalnız hâlâ yayımlanmamış taslaksa
 * ve başlığı aynıysa çalışır; tekrar çalışmaya dayanıklı. Geri alınamaz (down boş).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  BEGIN
    IF EXISTS (select 1 from payload.reviews where id = 7 and _status = 'draft' and title like 'Sigma 85mm F1.2 DG | Art İncelemesi%')
       AND NOT EXISTS (select 1 from payload._reviews_v where parent_id = 7 and version__status = 'published') THEN
      DELETE FROM payload._reviews_v WHERE parent_id = 7;
      DELETE FROM payload.reviews WHERE id = 7;
    END IF;
  END $$;
  `)
}

export async function down(_: MigrateDownArgs): Promise<void> {}
