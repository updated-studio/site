import { headersWithCors, type Endpoint } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { createHash } from 'node:crypto'

/**
 * GET /api/yazar-fotolari — yazar adresine göre editörün fotoğrafı (28 Ekim 2026, kullanıcı: "herkes profilden kendi fotoğrafını seçiyordu";
 * "Nehir'in WordPress'ten gelen gravatarı da Stüdyo üyeliği de vardı"). Site derlemesi okur; panelde Yazarlar › Fotoğraf doluysa o öne geçer.
 * Kişi tek: yazar → paneldeki kullanıcı (Yazar profili) → aynı e-postalı Stüdyo profili ve Uper üyeliği. Fotoğraf sırası:
 *   Stüdyo profil fotoğrafı → Uper profil fotoğrafı (Gravatar/Google/yüklenen) → e-postanın Gravatar'ı (varsa; Stüdyo da böyle gösterir).
 * Kullanıcıya bağlı olmayan yazar için aynı ada sahip Stüdyo profili. Yalnız adres + fotoğraf adresi döner, e-posta dönmez.
 */
let cache: { at: number; body: string } | null = null
const gravatarVar = new Map<string, string | null>()
async function gravatar(eposta: string): Promise<string | null> {
  const e = eposta.trim().toLowerCase()
  if (!e) return null
  if (gravatarVar.has(e)) return gravatarVar.get(e)!
  const url = `https://www.gravatar.com/avatar/${createHash('md5').update(e).digest('hex')}?s=160&d=404`
  let sonuc: string | null = null
  try { const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(4000) }); if (r.ok) sonuc = url } catch { /* ağ yok: sonra yine bakılır */ return null }
  gravatarVar.set(e, sonuc)
  return sonuc
}

export const yazarFoto: Endpoint = {
  path: '/yazar-fotolari',
  method: 'get',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' }), req })
    if (!cache || Date.now() - cache.at > 60_000) {
      const out: Record<string, string> = {}
      // Stüdyo profilini okuma izni (Stüdyo göçü 0047) yoksa Uper ve Gravatar ile devam edilir
      const yedek = sql`
          select a.slug, u.email, null as studyo, nullif(y.foto, '') as uper
            from payload.authors a
            join payload.users u on u.author_id = a.id
            left join payload.uyeler y on lower(y.email) = lower(u.email)`
      try {
        const db = (req.payload.db as any).drizzle
        const r: any = await db.execute(sql`
          select a.slug, u.email, nullif(p.avatar_url, '') as studyo, nullif(y.foto, '') as uper
            from payload.authors a
            join payload.users u on u.author_id = a.id
            left join public.profiles p on lower(p.email) = lower(u.email)
            left join payload.uyeler y on lower(y.email) = lower(u.email)
          union all
          select a.slug, p.email, nullif(p.avatar_url, ''), nullif(y.foto, '')
            from payload.authors a
            join public.profiles p on lower(btrim(p.name)) = lower(btrim(a.name))
            left join payload.uyeler y on lower(y.email) = lower(p.email)
          where not exists (select 1 from payload.users u where u.author_id = a.id)`).catch(() => db.execute(yedek))
        for (const row of (r.rows ?? r) as { slug: string; email: string; studyo: string | null; uper: string | null }[]) {
          if (!row.slug || out[row.slug]) continue
          const foto = row.studyo || row.uper || (await gravatar(row.email || ''))
          if (foto) out[row.slug] = foto
        }
      } catch (e) { req.payload.logger.warn(`yazar fotoğrafları okunamadı: ${(e as Error).message}`) }
      cache = { at: Date.now(), body: JSON.stringify(out) }
    }
    return new Response(cache.body, { headers })
  },
}
