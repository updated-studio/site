import { headersWithCors, type Endpoint, type Payload } from 'payload'

/**
 * Kendi okunma sayacımız (çerezsiz, kişisel veri tutmaz): yalnız "hangi sayfa, hangi gün, kaç kez".
 * POST /api/okunma   gövde: düz metin sayfa yolu (navigator.sendBeacon) → günlük sayaç +1
 * GET  /api/en-cok-okunan?saat=48&n=10 → son N saatin en çok okunan sayfaları (5 dk önbellek)
 * Tablo: payload.okunma_gunluk (gun, yol, sayi). Site derlenirken "En çok okunanlar" buradan gelir.
 */
const pool = (p: Payload) => (p.db as any).pool as { query: (q: string, v?: any[]) => Promise<{ rows: any[] }> }

export const okunmaInit = async (payload: Payload) => {
  try {
    await pool(payload).query(`create table if not exists payload.okunma_gunluk (gun date not null, yol text not null, sayi integer not null default 0, primary key (gun, yol))`)
  } catch (e) { payload.logger.warn(`okunma tablosu kurulamadı: ${e}`) }
}

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i
const YOL = /^\/[a-z0-9-]+(\/[a-z0-9-]+)*$/
let top: { key: string; at: number; body: string } | null = null

export const okunmaEndpoints: Endpoint[] = [
  {
    path: '/okunma',
    method: 'post',
    handler: async (req) => {
      const headers = headersWithCors({ headers: new Headers(), req })
      if (BOT.test(req.headers.get('user-agent') || '')) return new Response(null, { status: 204, headers })
      const yol = (await req.text?.())?.trim().slice(0, 200) || ''
      if (!YOL.test(yol)) return new Response(null, { status: 204, headers })
      await pool(req.payload).query(`insert into payload.okunma_gunluk (gun, yol, sayi) values ((now() at time zone 'Europe/Istanbul')::date, $1, 1) on conflict (gun, yol) do update set sayi = payload.okunma_gunluk.sayi + 1`, [yol]).catch(() => {})
      return new Response(null, { status: 204, headers })
    },
  },
  {
    path: '/en-cok-okunan',
    method: 'get',
    handler: async (req) => {
      const headers = headersWithCors({ headers: new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' }), req })
      const u = new URL(req.url || '', 'http://x')
      const saat = Math.min(24 * 30, Math.max(6, Number(u.searchParams.get('saat')) || 48)), n = Math.min(50, Math.max(1, Number(u.searchParams.get('n')) || 10))
      const key = `${saat}:${n}`
      if (!top || top.key !== key || Date.now() - top.at > 300_000) {
        const r = await pool(req.payload).query(`select yol, sum(sayi)::int as sayi from payload.okunma_gunluk where gun >= ((now() - ($1 || ' hours')::interval) at time zone 'Europe/Istanbul')::date group by yol order by sayi desc limit $2`, [String(saat), n]).catch(() => ({ rows: [] }))
        top = { key, at: Date.now(), body: JSON.stringify(r.rows) }
      }
      return new Response(top.body, { headers })
    },
  },
]
