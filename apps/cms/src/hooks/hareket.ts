import type { CollectionConfig, GlobalConfig, PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'

/**
 * Hareket geçmişi (28 Ekim 2026, kullanıcı: "kim ne yaptı, her şeyin kaydı tutulsun, yalnız yöneticiler görsün").
 * Paneldeki her oluşturma, değişiklik, yayın, yayından kaldırma, silme ve giriş Stüdyo'nun public.hareketler tablosuna yazılır
 * (aynı Postgres; Stüdyo göçü 0045). Stüdyo'dan gelen istekler de paneldeki kişinin hesabıyla çalıştığı için kim olduğu bellidir.
 * Silinen kaydın tam hâli saklanır; Stüdyo → Hareket geçmişi'nden geri getirilir. Kayıt yalnız eklenir; hiçbir yerden silinmez.
 * Bu kayıt panel işini durdurmaz: yazılamazsa yalnız günlüğe hata düşer.
 */
const ATLA = new Set(['updatedAt', 'createdAt', 'id', '_status', 'sizes', 'thumbnailURL', 'url', 'focalX', 'focalY', 'salt', 'hash', 'sessions', 'loginAttempts', 'lockUntil', 'apiKey', 'apiKeyIndex', 'password', 'resetPasswordToken', 'resetPasswordExpiration'])
const GIZLI = new Set(['salt', 'hash', 'sessions', 'apiKey', 'apiKeyIndex', 'password', 'resetPasswordToken', 'resetPasswordExpiration'])

const baslik = (d: any) => String(d?.title ?? d?.name ?? d?.baslik ?? d?.ad ?? d?.email ?? d?.filename ?? d?.caption ?? '').slice(0, 300)
const kim = (req: PayloadRequest) => {
  const u = req.user as any
  return { kaynak: !u ? 'sistem' : u._strategy === 'studyo' ? 'studyo' : 'panel', eposta: String(u?.email ?? ''), ad: String(u?.name ?? (u ? '' : 'Sistem')) }
}
const degisenler = (yeni: any, eski: any) => {
  if (!eski) return []
  const k = new Set([...Object.keys(yeni || {}), ...Object.keys(eski || {})])
  return [...k].filter((x) => !ATLA.has(x) && JSON.stringify(yeni?.[x] ?? null) !== JSON.stringify(eski?.[x] ?? null))
}
const temiz = (d: any) => { const o: any = {}; for (const [k, v] of Object.entries(d || {})) if (!GIZLI.has(k)) o[k] = v; return o }

export async function hareketYaz(req: PayloadRequest, h: { islem: string; tur: string; nesne?: string | number | null; baslik?: string; ayrinti?: Record<string, unknown> }) {
  try {
    const k = kim(req)
    const ayrinti = JSON.stringify(h.ayrinti ?? {})
    await (req.payload.db as any).drizzle.execute(sql`insert into public.hareketler (kaynak, kim_eposta, kim_ad, islem, tur, nesne_id, baslik, ayrinti)
      values (${k.kaynak}, ${k.eposta}, ${k.ad}, ${h.islem}, ${h.tur}, ${String(h.nesne ?? '')}, ${(h.baslik ?? '').slice(0, 300)}, ${ayrinti}::jsonb)`)
  } catch (e) { req.payload.logger.warn(`hareket yazılamadı (${h.tur} ${h.islem}): ${(e as Error).message}`) }
}

/** Koleksiyona kayıt kancalarını ekler (payload.config.ts'de bütün koleksiyonlara uygulanır) */
export const hareketKaydi = (c: CollectionConfig): CollectionConfig => {
  if (c.slug.startsWith('payload-')) return c
  const afterChange = async ({ doc, previousDoc, operation, req, context }: any) => {
    if (context?.migration || context?.hareketYok) return doc
    const yayinda = (d: any) => d?._status === 'published'
    let islem = operation === 'create' ? 'olustur' : 'degistir'
    if (operation === 'update' && yayinda(doc) && !yayinda(previousDoc)) islem = 'yayinla'
    else if (operation === 'update' && !yayinda(doc) && yayinda(previousDoc)) islem = 'yayindan_kaldir'
    const alanlar = operation === 'update' ? degisenler(doc, previousDoc) : []
    if (islem === 'degistir' && !alanlar.length) return doc // yalnız tarih/sayaç değişti: kayıt yok
    await hareketYaz(req, { islem, tur: c.slug, nesne: doc?.id, baslik: baslik(doc), ayrinti: { alanlar, taslak: doc?._status === 'draft' || undefined } })
    return doc
  }
  // Silinmeden önce kaydın ilişkisiz (depth 0) hâli alınır: geri getirirken ilişkiler kimlik olarak gönderilir
  const beforeDelete = async ({ id, req, context }: any) => {
    if (context?.migration) return
    try { context.hareketKayit = await req.payload.findByID({ collection: c.slug, id, depth: 0, overrideAccess: true, draft: true, req }) } catch { /* bulunamadıysa silme sonrası kayıt kullanılır */ }
  }
  const afterDelete = async ({ doc, id, req, context }: any) => {
    if (context?.migration) return doc
    await hareketYaz(req, { islem: 'sil', tur: c.slug, nesne: id, baslik: baslik(doc), ayrinti: { kayit: temiz(context?.hareketKayit ?? doc) } })
    return doc
  }
  const hooks: any = { ...c.hooks, beforeDelete: [...(c.hooks?.beforeDelete ?? []), beforeDelete], afterChange: [...(c.hooks?.afterChange ?? []), afterChange], afterDelete: [...(c.hooks?.afterDelete ?? []), afterDelete] }
  if (c.auth) hooks.afterLogin = [...((c.hooks as any)?.afterLogin ?? []), async ({ user, req }: any) => { await hareketYaz({ ...req, user } as PayloadRequest, { islem: 'giris', tur: c.slug, nesne: user?.id, baslik: baslik(user) }) }]
  return { ...c, hooks }
}

/** Ayarlar (globals): her değişiklik */
export const hareketKaydiGlobal = (g: GlobalConfig): GlobalConfig => ({
  ...g,
  hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange ?? []), async ({ doc, previousDoc, req, context }: any) => {
    if (context?.migration) return doc
    const alanlar = degisenler(doc, previousDoc)
    if (previousDoc && !alanlar.length) return doc
    await hareketYaz(req, { islem: 'degistir', tur: g.slug, baslik: typeof g.label === 'string' ? g.label : g.slug, ayrinti: { alanlar } })
    return doc
  }] },
})
