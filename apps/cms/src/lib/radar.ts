/**
 * Çıkış radarı işleyicisi (31 Ekim 2026, kullanıcı: "çıkış radarlarını da otomatiğe bağlamak istiyorum"): Stüdyo'daki radar-otomatik
 * fonksiyonunun doğruladığı ürünler public.radar_adaylari'nda "bekliyor" durur (Stüdyo göçü 0059). Panel 15 dakikada bir onları künyeye işler:
 * künye yoksa açar (radarOto işaretli), varsa durum/kesinlik/tarihi günceller. Editör sistemin açtığı bir ürünü radardan çıkardıysa
 * (radarOto açık, onRadar kapalı) dokunmaz. Ürün satışa çıktıysa durum "Satışta" olur, radardan kendiliğinden düşer.
 */
import type { Payload } from 'payload'
import { havuz } from './uye'

const KESINLIK: Record<string, number> = { soylenti: 1, sizinti: 2, test: 3, takvim: 3, duyuruldu: 4, satista: 4 }
const sade = (x: string) => String(x ?? '').toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[^a-z0-9]/g, '')
type Aday = { id: number; marka: string; ad: string; tur: string; durum: string; tarih: string | null; tarih_notu: string; ozet: string; urun_id: number | null }

export async function radarIsle(p: Payload) {
  const db = havuz(p)
  const r = await db.query(`select id, marka, ad, tur, durum, tarih::text, tarih_notu, ozet, urun_id from public.radar_adaylari where islem = 'bekliyor' order by id limit 20`).catch(() => null)
  if (!r?.rows.length) return
  for (const a of r.rows as Aday[]) {
    const not = (islem: string, notu: string, urunId?: number) =>
      db.query(`update public.radar_adaylari set islem = $2, islem_notu = $3, urun_id = coalesce($4, urun_id), updated_at = now() where id = $1`, [a.id, islem, notu.slice(0, 200), urunId ?? null])
    try {
      // Aynı ürün: kayıtlı bağ ya da marka + ad (marka adın başında tekrar ediyorsa çıkarılır)
      let urun: any = a.urun_id ? await p.findByID({ collection: 'products', id: a.urun_id, depth: 0, overrideAccess: true }).catch(() => null) : null
      if (!urun) {
        const bul = await p.find({ collection: 'products', where: { brand: { like: a.marka } }, limit: 200, depth: 0, overrideAccess: true, pagination: false })
        urun = bul.docs.find((d: any) => sade(d.brand) === sade(a.marka) && [sade(d.name), sade(`${d.brand} ${d.name}`)].includes(sade(a.ad))) ?? null
      }
      const satista = a.durum === 'satista'
      const ortak = { status: a.durum, certainty: KESINLIK[a.durum] ?? 2, releaseWhen: a.tarih_notu || undefined, releaseDate: a.tarih ? `${a.tarih}T00:00:00.000Z` : undefined }
      if (urun) {
        if (urun.radarOto && !urun.onRadar && !satista) { await not('atlandi', 'Editör radardan çıkarmış', urun.id); continue }
        if (['satista', 'eol'].includes(urun.status) && !satista) { await not('atlandi', 'Künyede zaten satışta', urun.id); continue }
        await p.update({ collection: 'products', id: urun.id, data: { ...ortak, onRadar: !satista } as any, overrideAccess: true, context: { radar: true } })
        await not('uygulandi', satista ? 'Satışa çıktı, radardan düştü' : 'Künye güncellendi', urun.id)
      } else {
        if (satista) { await not('atlandi', 'Satışta, künyesi yok'); continue }
        const yeni = await p.create({ collection: 'products', data: { name: a.ad, brand: a.marka, type: a.tur, blurb: a.ozet || undefined, ...ortak, onRadar: true, radarOto: true } as any, overrideAccess: true, context: { radar: true } })
        await not('uygulandi', 'Künye açıldı', yeni.id as number)
      }
    } catch (e) { await not('hata', String((e as Error).message ?? e)).catch(() => {}) }
  }
}
let radarSaati: NodeJS.Timeout | null = null
export function radarZamanlayici(p: Payload) {
  if (radarSaati) return
  const tur = () => radarIsle(p).catch((e) => p.logger.warn(`çıkış radarı: ${e}`))
  setTimeout(tur, 90_000); radarSaati = setInterval(tur, 15 * 60_000)
}
