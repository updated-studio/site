import { getFieldsToSign, headersWithCors, jwtSign, type Endpoint } from 'payload'
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'
import { studyoEposta, studyoUyesi } from '../auth/studyo'
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
    return Response.json(semaYap(req.payload.config), { headers })
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
