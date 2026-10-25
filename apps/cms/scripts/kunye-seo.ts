// Künye SEO başlık/açıklamasını marka + adla yeniden üretir (boşaltınca autoSeo doldurur). Elle yazılmış olanlar da yenilenir:
// yalnız otomatik biçimdekiler ("… künyesi: özellikler ve haberler") boşaltılır. Kullanım: npx payload run scripts/kunye-seo.ts
import { getPayload } from 'payload'
import config from '@payload-config'
const p = await getPayload({ config })
const r = await p.find({ collection: 'products', limit: 5000, depth: 0, overrideAccess: true })
let n = 0
for (const d of r.docs as any[]) {
  if (!/künyesi: özellikler ve haberler$/.test(d.seo?.title || '')) continue
  await p.update({ collection: 'products', id: d.id, overrideAccess: true, data: { seo: { ...d.seo, title: '', description: d.blurb ? d.seo.description : '' } } as never })
  n++
}
console.log(`${n} künyenin SEO başlığı yenilendi`)
process.exit(0)
