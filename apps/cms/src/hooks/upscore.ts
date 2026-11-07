import type { CollectionAfterChangeHook } from 'payload'
import { PUANSIZ_TUR } from '../lib/kit'

/**
 * UPscore tek puan (6 Kasım 2026, kullanıcı: "tüm puan sistemimizi UPscore yapacağız, 10'lu sistem üzerinden").
 * İnceleme yayındayken puanı künyenin UPscore'u olur ve künye bu incelemeyi gerekçe gösterir; puan iki yere ayrı girilmez.
 * Künyenin başka bir incelemesi daha yeni yayınlandıysa ona dokunulmaz (en yeni inceleme belirler).
 */
export const upscoreKunyeye: CollectionAfterChangeHook = async ({ doc, req, context }) => {
  if (context?.upscore || doc._status !== 'published') return doc
  const puan = doc.scoreBox?.score
  const urun = doc.product && typeof doc.product === 'object' ? doc.product.id : doc.product
  if (puan == null || !urun) return doc
  try {
    const p: any = await req.payload.findByID({ collection: 'products', id: urun, depth: 0, req })
    if (PUANSIZ_TUR.includes(p?.type)) return doc // lens ve kamerada puan yok (7 Kasım 2026)
    const onceki = p?.upscoreReview && typeof p.upscoreReview === 'object' ? p.upscoreReview.id : p?.upscoreReview
    if (onceki && String(onceki) !== String(doc.id)) {
      const o: any = await req.payload.findByID({ collection: 'reviews', id: onceki, depth: 0, req }).catch(() => null)
      if (o?._status === 'published' && Date.parse(o.publishedAt || 0) > Date.parse(doc.publishedAt || 0)) return doc
    }
    if (Number(p?.upscore) === Number(puan) && String(onceki) === String(doc.id)) return doc
    await req.payload.update({ collection: 'products', id: urun, data: { upscore: Number(puan), upscoreReview: doc.id } as any, req, context: { upscore: true } })
  } catch (e) {
    req.payload.logger.warn(`UPscore künyeye yazılamadı (inceleme ${doc.id}): ${e}`)
  }
  return doc
}
