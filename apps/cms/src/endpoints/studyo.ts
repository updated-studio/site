import { headersWithCors, type Endpoint } from 'payload'
import { CHECKLIST, LABELS, LIMIT, STATES, BANNED_WORDS } from '../lib/kit'
import { semaYap } from '../lib/sema'

/**
 * Stüdyo Site modülünün yardımcı uçları (giriş gerekir; Stüdyo girişi auth/studyo.ts ile tanınır).
 * GET /api/studyo/sema — kit kuralları tek yerden: kontrol listesi, içerik etiketleri, karakter sınırları, durumlar
 * GET /api/studyo/alanlar — bütün koleksiyon ve ayarların alan yapısı (Stüdyo formlarını buradan kurar)
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
