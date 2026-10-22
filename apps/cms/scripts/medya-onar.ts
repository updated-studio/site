/**
 * Görsel onarımı: veritabanında kaydı olup dosyası Supabase Storage'da bulunmayan görselleri kaynağından (WordPress) yeniden yükler.
 * Çalıştırma: NODE_ENV=production npx tsx --tsconfig tsconfig.json scripts/medya-onar.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { writeFileSync } from 'node:fs'

const YENIDEN = process.env.YENIDEN === '1' // tüm görselleri kaynağından yeni kalite ayarlarıyla yeniden üret
const sonuc = { yeniden: YENIDEN, onceMB: 0, sonraMB: 0, toplam: 0, saglam: 0, onarilan: 0, hata: [] as string[], s3: !!process.env.S3_BUCKET }
async function main() {
  const payload = await getPayload({ config })
  console.log(`S3 açık mı: ${sonuc.s3} · kova: ${process.env.S3_BUCKET} · uç: ${process.env.S3_ENDPOINT}`)
  for (let page = 1; ; page++) {
    const r = await payload.find({ collection: 'media', limit: 100, page, depth: 0 })
    for (const m of r.docs as any[]) {
      sonuc.toplam++
      const var_ = m.url ? (await fetch(m.url, { method: 'HEAD' }).catch(() => null))?.ok : false
      const boy = (d: any) => ((d.filesize || 0) + Object.values(d.sizes || {}).reduce((t: number, v: any) => t + (v?.filesize || 0), 0)) / 1e6
      if (var_ && !YENIDEN) { sonuc.saglam++; continue }
      if (YENIDEN && !m.sourceUrl) { sonuc.saglam++; continue }
      const once = boy(m)
      if (!m.sourceUrl) { sonuc.hata.push(`${m.id}: kaynak adresi yok`); continue }
      try {
        const res = await fetch(m.sourceUrl); if (!res.ok) throw new Error(`kaynak ${res.status}`)
        const buf = Buffer.from(await res.arrayBuffer())
        const ext = (res.headers.get('content-type') || 'image/jpeg').split('/')[1].replace('jpeg', 'jpg')
        await payload.update({ collection: 'media', id: m.id, data: {}, file: { data: buf, mimetype: res.headers.get('content-type') || 'image/jpeg', name: `${(m.filename || 'gorsel').replace(/\.\w+$/, '')}.${ext}`, size: buf.length }, overrideAccess: true })
        const kontrol = await payload.findByID({ collection: 'media', id: m.id, depth: 0 }) as any
        const ok = (await fetch(kontrol.url, { method: 'HEAD' }).catch(() => null))?.ok
        if (ok) { sonuc.onarilan++; sonuc.onceMB += once; sonuc.sonraMB += boy(kontrol) } else sonuc.hata.push(`${m.id}: yüklendi ama erişilemiyor ${kontrol.url}`)
      } catch (e: any) { sonuc.hata.push(`${m.id}: ${e.message}`) }
    }
    if (!r.hasNextPage) break
  }
  console.log(JSON.stringify({ ...sonuc, hata: sonuc.hata.length, ilkHatalar: sonuc.hata.slice(0, 5) }))
  writeFileSync('scripts/medya-onar.log.json', JSON.stringify(sonuc, null, 2))
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
