import type { Endpoint } from 'payload'

/**
 * Amazon fiyatları (5 Kasım 2026): Stüdyo'nun amazon-fiyat fonksiyonu Amazon Creators API'den (amazon.com.tr) aldığı fiyat, ortaklık
 * bağlantısı ve eşleşen ASIN'i buraya yazar. Anahtar: x-studio-key = STUDIO_IMPORT_KEY. Hareket geçmişine yazılmaz (günde iki kez
 * her ürün güncellenir; geçmiş bununla dolmasın). Editörün elle girdiği ASIN ezilmez: fonksiyon yalnız ASIN'i boş ürünlere ASIN yazar.
 */
const yetkili = (h: Headers) => !!process.env.STUDIO_IMPORT_KEY && h.get('x-studio-key') === process.env.STUDIO_IMPORT_KEY
type Gelen = { id: number; asin?: string | null; url?: string | null; fiyat?: number | null; fiyatMetni?: string | null; durum?: string }

export const amazonYaz: Endpoint = {
  path: '/studyo/amazon-yaz',
  method: 'post',
  handler: async (req) => {
    if (!yetkili(req.headers)) return Response.json({ hata: 'Yetkisiz' }, { status: 401 })
    const b = (await req.json?.().catch(() => null)) as { urunler?: Gelen[] } | null
    const sonuc: { id: number; ok: boolean; hata?: string }[] = []
    for (const u of (b?.urunler ?? []).slice(0, 200)) {
      if (!Number.isInteger(u?.id)) continue
      try {
        const simdi = await req.payload.findByID({ collection: 'products', id: u.id, depth: 0, overrideAccess: true, select: { amazonAsin: true } as any }) as any
        const asin = typeof u.asin === 'string' && /^[A-Z0-9]{10}$/.test(u.asin) ? u.asin : null
        // Editör bu arada ASIN'i değiştirdiyse başka ürünün fiyatı yazılmaz
        if (simdi?.amazonAsin && asin && simdi.amazonAsin !== asin) { sonuc.push({ id: u.id, ok: false, hata: 'ASIN değişmiş' }); continue }
        const url = typeof u.url === 'string' && /^https:\/\/www\.amazon\.com\.tr\//.test(u.url) ? u.url.slice(0, 600) : null
        await req.payload.update({
          collection: 'products', id: u.id, overrideAccess: true, depth: 0, context: { hareketYok: true },
          data: {
            ...(asin && !simdi?.amazonAsin ? { amazonAsin: asin } : {}),
            amazonUrl: url, amazonFiyat: typeof u.fiyat === 'number' && isFinite(u.fiyat) ? u.fiyat : null,
            amazonFiyatMetni: u.fiyatMetni ? String(u.fiyatMetni).slice(0, 60) : null,
            amazonDurum: String(u.durum ?? '').slice(0, 80) || null, amazonGuncel: new Date().toISOString(),
          } as any,
        })
        sonuc.push({ id: u.id, ok: true })
      } catch (e) { sonuc.push({ id: u.id, ok: false, hata: String((e as Error).message ?? e).slice(0, 120) }) }
    }
    return Response.json({ sonuc })
  },
}
