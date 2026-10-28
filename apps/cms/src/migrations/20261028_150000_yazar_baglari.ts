import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Yazar bağları (28 Ekim 2026, kullanıcı onayı): eski içerikler ekip üyelerine bağlanır.
 *  · "Nehir Yalçın" yazar profili Nehir'in hesabına, "Nerdesin admin" (Fatih) Fatih'in hesabına bağlanır; ikincinin adı "Fatih" olur.
 *  · "admin" imzalı içerikler (26 Ekim otomatik taslakları) "Updated Stüdyo" imzasına geçer.
 *  · Yazar profili olmayan her kullanıcıya adıyla yazar profili açılır.
 * Yalnız boş bağlar doldurulur; elle bağlanmış olana dokunulmaz. Tekrar çalıştırılabilir.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  update payload.users u set author_id = a.id from payload.authors a where u.author_id is null and u.name = 'Nehir' and a.slug = 'nehir-y';
  update payload.users u set author_id = a.id from payload.authors a where u.author_id is null and u.name = 'Fatih' and a.slug = 'fateeh';
  update payload.authors set name = 'Fatih', updated_at = now() where slug = 'fateeh' and name = 'Nerdesin admin';
  update payload.news n set author_id = s.id from payload.authors s, payload.authors x where s.slug = 'studyo' and x.slug = 'admin' and n.author_id = x.id;
  update payload._news_v n set version_author_id = s.id from payload.authors s, payload.authors x where s.slug = 'studyo' and x.slug = 'admin' and n.version_author_id = x.id;
  update payload.reviews n set author_id = s.id from payload.authors s, payload.authors x where s.slug = 'studyo' and x.slug = 'admin' and n.author_id = x.id;
  update payload._reviews_v n set version_author_id = s.id from payload.authors s, payload.authors x where s.slug = 'studyo' and x.slug = 'admin' and n.version_author_id = x.id;
  update payload.comparisons n set author_id = s.id from payload.authors s, payload.authors x where s.slug = 'studyo' and x.slug = 'admin' and n.author_id = x.id;
  update payload._comparisons_v n set version_author_id = s.id from payload.authors s, payload.authors x where s.slug = 'studyo' and x.slug = 'admin' and n.version_author_id = x.id;
  insert into payload.authors (name, slug)
    select u.name, translate(lower(btrim(u.name)), 'çğıöşüâî ', 'cgiosuai-') from payload.users u
    where u.author_id is null and coalesce(btrim(u.name), '') <> ''
      and not exists (select 1 from payload.authors a where a.name = u.name or a.slug = translate(lower(btrim(u.name)), 'çğıöşüâî ', 'cgiosuai-'));
  update payload.users u set author_id = a.id from payload.authors a where u.author_id is null and a.name = u.name;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Geri alma: yalnız Fatih profilinin adı; bağlar ve imza değişikliği bilerek geri alınmaz (eski hâl "admin" imzasıydı)
  await db.execute(sql`update payload.authors set name = 'Nerdesin admin' where slug = 'fateeh' and name = 'Fatih';`)
}
