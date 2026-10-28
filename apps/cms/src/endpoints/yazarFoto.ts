import { headersWithCors, type Endpoint } from 'payload'
import { sql } from '@payloadcms/db-postgres'

/**
 * GET /api/yazar-fotolari — yazar adresine göre editörün Stüdyo profil fotoğrafı (28 Ekim 2026, kullanıcı: "herkes profilden kendi
 * fotoğrafını seçiyordu"). Site derlemesi okur: panelde Yazarlar › Fotoğraf boşsa Stüdyo'daki profil fotoğrafı kullanılır.
 * Eşleme: paneldeki kullanıcının "Yazar profili" alanı; o yoksa Stüdyo profilindeki adla yazar adı aynıysa. Yalnız adres + fotoğraf
 * adresi döner (ikisi de zaten herkese açık), e-posta dönmez. Aynı veritabanı (public.profiles).
 */
let cache: { at: number; body: string } | null = null
export const yazarFoto: Endpoint = {
  path: '/yazar-fotolari',
  method: 'get',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' }), req })
    if (!cache || Date.now() - cache.at > 60_000) {
      let out: Record<string, string> = {}
      try {
        const r: any = await (req.payload.db as any).drizzle.execute(sql`
          select a.slug, p.avatar_url from payload.authors a
            join payload.users u on u.author_id = a.id
            join public.profiles p on lower(p.email) = lower(u.email)
          where coalesce(p.avatar_url, '') <> ''
          union
          select a.slug, p.avatar_url from payload.authors a
            join public.profiles p on lower(btrim(p.name)) = lower(btrim(a.name))
          where coalesce(p.avatar_url, '') <> '' and not exists (select 1 from payload.users u where u.author_id = a.id)`)
        for (const row of (r.rows ?? r) as { slug: string; avatar_url: string }[]) if (row.slug && !out[row.slug]) out[row.slug] = row.avatar_url
      } catch (e) { req.payload.logger.warn(`yazar fotoğrafları okunamadı: ${(e as Error).message}`); out = {} }
      cache = { at: Date.now(), body: JSON.stringify(out) }
    }
    return new Response(cache.body, { headers })
  },
}
