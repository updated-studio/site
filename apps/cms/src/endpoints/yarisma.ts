import type { Endpoint } from 'payload'

/**
 * Stüdyo'nun yarışma tarayıcısı (supabase/functions/yarisma-bul) bulduklarını buraya bırakır: "öneri" olarak eklenir,
 * ekip Stüdyo → Site → Yarışmalar'da bilgileri kontrol edip "Yayında" yapar. Anahtar: x-studio-key = STUDIO_IMPORT_KEY.
 * Aynı yarışma (aynı bağlantı ya da aynı ad + son tarih) ikinci kez eklenmez.
 */
const yetkili = (h: Headers) => !!process.env.STUDIO_IMPORT_KEY && h.get('x-studio-key') === process.env.STUDIO_IMPORT_KEY
const anahtar = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü]+/g, ' ').trim()
const adres = (u: string) => { try { const x = new URL(u); return (x.host.replace(/^www\./, '') + x.pathname.replace(/\/+$/, '')).toLowerCase() } catch { return '' } }
const TUR = ['fotograf', 'kisa-film', 'video', 'karma'], KAPSAM = ['turkiye', 'uluslararasi']

export const yarismaOneri: Endpoint = {
  path: '/yarisma/oneri',
  method: 'post',
  handler: async (req) => {
    if (!yetkili(req.headers)) return Response.json({ hata: 'Yetkisiz' }, { status: 401 })
    const b = await req.json?.().catch(() => null) as { yarismalar?: any[] } | null
    const gelen = (b?.yarismalar ?? []).slice(0, 40)
    const mevcut = await req.payload.find({ collection: 'yarismalar', limit: 2000, depth: 0, overrideAccess: true, select: { ad: true, sonTarih: true, baglanti: true } as any })
    const adresler = new Set(mevcut.docs.map((d: any) => adres(d.baglanti)).filter(Boolean))
    const adlar = new Set(mevcut.docs.map((d: any) => `${anahtar(d.ad)}|${String(d.sonTarih).slice(0, 10)}`))
    const eklenen: string[] = [], atlanan: string[] = []
    for (const y of gelen) {
      const son = new Date(y?.sonTarih)
      if (!y?.ad || !/^https?:\/\//.test(y?.baglanti || '') || isNaN(+son) || +son < Date.now()) { atlanan.push(String(y?.ad || '?')); continue }
      const a = adres(y.baglanti), k = `${anahtar(y.ad)}|${son.toISOString().slice(0, 10)}`
      if (adresler.has(a) || adlar.has(k)) { atlanan.push(y.ad); continue }
      await req.payload.create({ collection: 'yarismalar', overrideAccess: true, data: {
        ad: String(y.ad).slice(0, 160), duzenleyen: y.duzenleyen ? String(y.duzenleyen).slice(0, 120) : undefined, durum: 'oneri',
        tur: TUR.includes(y.tur) ? y.tur : 'fotograf', kapsam: KAPSAM.includes(y.kapsam) ? y.kapsam : undefined,
        sonTarih: son.toISOString(), sonucTarihi: y.sonucTarihi && !isNaN(+new Date(y.sonucTarihi)) ? new Date(y.sonucTarihi).toISOString() : undefined,
        ucretsiz: y.ucretsiz === true, konu: y.konu ? String(y.konu).slice(0, 120) : undefined, baglanti: String(y.baglanti).slice(0, 500),
        odul: y.odul ? String(y.odul).slice(0, 200) : undefined, ucret: y.ucret ? String(y.ucret).slice(0, 120) : undefined,
        aciklama: y.aciklama ? String(y.aciklama).slice(0, 600) : undefined, kaynak: y.kaynak ? String(y.kaynak).slice(0, 500) : undefined,
      } as any })
      adresler.add(a); adlar.add(k); eklenen.push(y.ad)
    }
    return Response.json({ eklenen, atlanan })
  },
}
