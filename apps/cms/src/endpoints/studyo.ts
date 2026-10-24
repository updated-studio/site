import { getFieldsToSign, headersWithCors, jwtSign, type Endpoint } from 'payload'
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'
import { studyoEposta, studyoUyesi } from '../auth/studyo'
import { canPublish } from '../access/roles'
import { CHECKLIST, LABELS, LIMIT, STATES, BANNED_WORDS } from '../lib/kit'
import { semaYap } from '../lib/sema'

/**
 * Stüdyo Site modülünün yardımcı uçları (giriş gerekir; Stüdyo girişi auth/studyo.ts ile tanınır).
 * GET /api/studyo/sema — kit kuralları tek yerden: kontrol listesi, içerik etiketleri, karakter sınırları, durumlar
 * GET /api/studyo/alanlar — bütün koleksiyon ve ayarların alan yapısı (Stüdyo formlarını buradan kurar)
 * POST /api/studyo/giris — Payload'un kendi paneline Stüdyo hesabıyla giriş (yalnız yöneticiler; Stüdyo'nun /#/panel-giris sayfası gönderir)
 * GET /api/studyo/onizleme/:tur/:id — önizleme adresi (gizli önizleme anahtarı Stüdyo'nun koduna girmesin diye burada eklenir)
 */
const TUR = { news: 'haber', reviews: 'inceleme', comparisons: 'karsilastirma' } as const

export const studyoSema: Endpoint = {
  path: '/studyo/sema',
  method: 'get',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Cache-Control': 'no-store' }), req })
    if (!req.user) return Response.json({ error: 'Giriş gerekli' }, { status: 401, headers })
    return Response.json({ checklist: CHECKLIST, labels: LABELS, limit: LIMIT, states: STATES, yasakKelimeler: BANNED_WORDS }, { headers })
  },
}

export const studyoOnizleme: Endpoint = {
  path: '/studyo/onizleme/:koleksiyon/:id',
  method: 'get',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Cache-Control': 'no-store' }), req })
    if (!req.user) return Response.json({ error: 'Giriş gerekli' }, { status: 401, headers })
    const tur = TUR[String(req.routeParams?.koleksiyon) as keyof typeof TUR]
    const id = Number(req.routeParams?.id)
    if (!tur || !Number.isInteger(id)) return Response.json({ error: 'Geçersiz' }, { status: 400, headers })
    const url = `${process.env.WEB_URL}/onizleme?tur=${tur}&id=${id}&k=${process.env.PREVIEW_SECRET || ''}`
    return Response.json({ url }, { headers })
  },
}

export const studyoAlanlar: Endpoint = {
  path: '/studyo/alanlar',
  method: 'get',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Cache-Control': 'no-store' }), req })
    if (!req.user) return Response.json({ error: 'Giriş gerekli' }, { status: 401, headers })
    return Response.json(semaYap(req.payload.config, req), { headers })
  },
}

/** Stüdyo oturum anahtarı form ile gelir (adres çubuğunda görünmesin); doğruysa panelin kendi oturum çerezi verilip panele yönlenir. */
export const studyoGiris: Endpoint = {
  path: '/studyo/giris',
  method: 'post',
  handler: async (req) => {
    const don = (yol: string, cerez?: string) => new Response(null, { status: 303, headers: { Location: yol, 'Cache-Control': 'no-store', ...(cerez ? { 'Set-Cookie': cerez } : {}) } })
    const anahtar = new URLSearchParams((await req.text?.()) ?? '').get('anahtar') ?? ''
    const eposta = anahtar ? await studyoEposta(anahtar) : null
    const uye = eposta ? await studyoUyesi(req.payload, eposta) : null
    if (!uye || uye.role !== 'admin') return don('/admin/login?studyo=yetki-yok')
    const coll = req.payload.collections.users.config
    const ham = (await req.payload.db.findOne({ collection: 'users', where: { id: { equals: uye.id } }, req })) as Record<string, any> | null
    if (!ham) return don('/admin/login?studyo=yetki-yok')
    const { sid } = await addSessionToUser({ collectionConfig: coll, payload: req.payload, req, user: ham as any })
    const fieldsToSign = getFieldsToSign({ collectionConfig: coll, email: eposta!, user: { ...ham, collection: 'users' } as any, ...(sid ? { sid } : {}) })
    const { token } = await jwtSign({ fieldsToSign, secret: req.payload.secret, tokenExpiration: coll.auth.tokenExpiration })
    return don('/admin', generatePayloadCookie({ collectionAuthConfig: coll.auth, cookiePrefix: req.payload.config.cookiePrefix, token }))
  },
}

/**
 * Zamanlanmış yayın (panelin kendi "schedulePublish" işi; iş kuyruğu dakikada bir çalışır, yayını zamanlayan kişinin yetkisiyle yapar —
 * yayın kuralları o an yeniden denetlenir). Yalnız yayın yönetmeni/yönetici.
 * GET  /api/studyo/zamanla?koleksiyon=news&id=12  (ya da ?genel=site-settings) — bekleyen ve son 7 günde başarısız olan zamanlamalar
 * POST /api/studyo/zamanla  { koleksiyon, id | genel, tur: 'publish'|'unpublish', zaman: ISO }
 * DELETE /api/studyo/zamanla?is=<iş no>
 */
const ZAMANLAMA_HEDEF = (s: URLSearchParams | Record<string, unknown>) => {
  const al = (k: string) => (s instanceof URLSearchParams ? s.get(k) : (s[k] as string | number | undefined)) ?? null
  const koleksiyon = al('koleksiyon'), genel = al('genel'), id = al('id')
  return { koleksiyon: koleksiyon ? String(koleksiyon) : null, genel: genel ? String(genel) : null, id: id !== null ? String(id) : null }
}
export const studyoZamanla: Endpoint = {
  path: '/studyo/zamanla',
  method: 'get',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Cache-Control': 'no-store' }), req })
    if (!canPublish(req.user)) return Response.json({ error: 'Zamanlama yalnız yayın yönetmeni ve yöneticide.' }, { status: 403, headers })
    const h = ZAMANLAMA_HEDEF(new URL(req.url!).searchParams)
    if (!(h.koleksiyon && h.id) && !h.genel) return Response.json({ error: 'Geçersiz' }, { status: 400, headers })
    const hedef = h.genel ? [{ 'input.global': { equals: h.genel } }] : [{ 'input.doc.value': { equals: h.id } }, { 'input.doc.relationTo': { equals: h.koleksiyon } }]
    const r = await req.payload.find({
      collection: 'payload-jobs', limit: 50, sort: 'waitUntil', depth: 0, overrideAccess: true,
      where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, ...hedef, { or: [{ completedAt: { exists: false } }, { and: [{ hasError: { equals: true } }, { updatedAt: { greater_than: new Date(Date.now() - 7 * 864e5).toISOString() } }] }] }] } as any,
    })
    const isler = r.docs.map((j: any) => ({ id: j.id, tur: j.input?.type === 'unpublish' ? 'unpublish' : 'publish', zaman: j.waitUntil, hata: j.hasError ? String(j.error?.message ?? j.log?.at?.(-1)?.error?.message ?? 'Yayınlanamadı') : null }))
    return Response.json({ isler }, { headers })
  },
}
export const studyoZamanlaEkle: Endpoint = {
  path: '/studyo/zamanla',
  method: 'post',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Cache-Control': 'no-store' }), req })
    if (!canPublish(req.user)) return Response.json({ error: 'Zamanlama yalnız yayın yönetmeni ve yöneticide.' }, { status: 403, headers })
    const g = ((await req.json?.()) ?? {}) as Record<string, unknown>
    const h = ZAMANLAMA_HEDEF(g)
    const zaman = new Date(String(g.zaman ?? ''))
    const tur = g.tur === 'unpublish' ? 'unpublish' : 'publish'
    const uygun = h.genel ? req.payload.config.globals.some((x) => x.slug === h.genel) : !!(h.koleksiyon && req.payload.collections[h.koleksiyon as never] && h.id)
    if (!uygun || isNaN(zaman.getTime()) || zaman.getTime() < Date.now() + 30_000) return Response.json({ error: 'Geçerli ve ileri bir zaman seçin.' }, { status: 400, headers })
    const is: { id: number | string } = await (req.payload.jobs.queue as any)({
      task: 'schedulePublish',
      waitUntil: zaman,
      input: { type: tur, ...(h.genel ? { global: h.genel } : { doc: { relationTo: h.koleksiyon, value: h.id } }), user: { relationTo: 'users', value: req.user!.id } },
    })
    return Response.json({ id: is.id }, { headers })
  },
}
export const studyoZamanlaSil: Endpoint = {
  path: '/studyo/zamanla',
  method: 'delete',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Cache-Control': 'no-store' }), req })
    if (!canPublish(req.user)) return Response.json({ error: 'Zamanlama yalnız yayın yönetmeni ve yöneticide.' }, { status: 403, headers })
    const is = new URL(req.url!).searchParams.get('is')
    if (!is) return Response.json({ error: 'Geçersiz' }, { status: 400, headers })
    const { docs } = await req.payload.delete({ collection: 'payload-jobs', overrideAccess: true, where: { and: [{ id: { equals: is } }, { taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }] } as any })
    // Bekleyen başka yayın zamanlaması kalmadıysa "Planlandı" durumu "İncelemede"ye döner (iş akışı olan koleksiyonlarda)
    const girdi = (docs[0] as any)?.input
    const hedef = girdi?.doc
    if (girdi?.type === 'publish' && hedef?.relationTo && hedef.value) {
      const kalan = await req.payload.count({ collection: 'payload-jobs', overrideAccess: true, where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }, { 'input.doc.value': { equals: String(hedef.value) } }, { 'input.doc.relationTo': { equals: hedef.relationTo } }] } as any })
      const d: any = kalan.totalDocs ? null : await req.payload.findByID({ collection: hedef.relationTo, id: hedef.value, draft: true, depth: 0, req }).catch(() => null)
      if (d?.workflow?.state === 'planlandi') await req.payload.update({ collection: hedef.relationTo, id: hedef.value, draft: true, data: { workflow: { ...d.workflow, state: 'incelemede' } } as any, req })
    }
    return Response.json({ ok: true }, { headers })
  },
}
