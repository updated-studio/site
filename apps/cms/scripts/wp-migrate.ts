/**
 * WordPress → Payload taşıma. Çalıştırma (apps/cms içinde):
 *   WP_URL=https://updated.com.tr WP_USER=… WP_APP_PASSWORD=… npx payload run scripts/wp-migrate.ts
 * İsteğe bağlı: DRY_RUN=1 (yazmaz, sayar) · LIMIT=50 (ilk N yazı) · WP_REVIEW_CATEGORY=inceleme (bu kategorideki yazılar İnceleme olur)
 *               WP_SCORE_META=_review_score (puanın tutulduğu meta; 5'lik ise ×4, 10'luk ise ×2 → /20)
 *
 * Parola sohbete/koda yazılmaz: WordPress › Kullanıcılar › Profil › Uygulama Parolaları'ndan üretilir, yalnız ortam değişkeninde durur.
 * Tekrar çalıştırılabilir: her kayıt wpId ile eşlenir, var olan güncellenir.
 * Çıktı: ../web/src/redirects.json (eski adres → yeni adres, 301) ve scripts/wp-migrate.log.json (özet).
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { trSlug, cut } from '../src/lib/slug'
import { randomBytes } from 'node:crypto'

const WP = (process.env.WP_URL || '').replace(/\/$/, '')
const AUTH = process.env.WP_USER && process.env.WP_APP_PASSWORD ? 'Basic ' + Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64') : ''
const DRY = !!process.env.DRY_RUN
const LIMIT = Number(process.env.LIMIT || 0)
const REVIEW_CAT = process.env.WP_REVIEW_CATEGORY || ''
const SCORE_META = process.env.WP_SCORE_META || ''
if (!WP) throw new Error('WP_URL gerekli')

const ctx = { migration: true }
const log: any = { categories: 0, authors: 0, media: 0, news: 0, reviews: 0, duzMetin: 0, skipped: [] as string[], errors: [] as string[] }
const decode = (s: string) => new JSDOM(`<p>${s}</p>`).window.document.querySelector('p')!.textContent || ''

async function wp<T = any>(path: string, params: Record<string, string | number> = {}): Promise<{ data: T; total: number; pages: number }> {
  const u = new URL(`${WP}/wp-json/wp/v2/${path}`)
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)))
  const r = await fetch(u, { headers: AUTH ? { Authorization: AUTH } : {} })
  if (!r.ok) throw new Error(`WP ${r.status} ${u.pathname}`)
  return { data: (await r.json()) as T, total: Number(r.headers.get('x-wp-total') || 0), pages: Number(r.headers.get('x-wp-totalpages') || 1) }
}
async function* all<T = any>(path: string, params: Record<string, string | number> = {}) {
  for (let page = 1; ; page++) {
    const { data, pages } = await wp<T[]>(path, { per_page: 100, page, ...params })
    for (const x of data) yield x
    if (page >= pages) break
  }
}

async function main() {
  const payload = await getPayload({ config })
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  const byWp = async (collection: any, wpId: number) => (await payload.find({ collection, where: { wpId: { equals: wpId } }, limit: 1, depth: 0, draft: true })).docs[0] as any
  const upsert = async (collection: any, wpId: number, data: any) => {
    if (DRY) return { id: `dry-${wpId}` }
    const prev = await byWp(collection, wpId)
    return prev ? payload.update({ collection, id: prev.id, data, context: ctx }) : payload.create({ collection, data: { ...data, wpId }, context: ctx })
  }

  /* 1) Kategoriler */
  const catMap = new Map<number, { id: any; slug: string }>()
  for await (const c of all('categories', { hide_empty: 1 })) {
    if (c.slug === 'uncategorized' || c.slug === 'genel') continue
    const doc = await upsert('categories', c.id, { name: decode(c.name), slug: c.slug, description: c.description || undefined })
    catMap.set(c.id, { id: doc.id, slug: c.slug }); log.categories++
  }

  /* 2) Yazarlar */
  const authorMap = new Map<number, any>()
  for await (const u of all('users')) {
    const doc = await upsert('authors', u.id, { name: u.name, slug: u.slug, bio: u.description || undefined })
    authorMap.set(u.id, doc.id); log.authors++
  }

  /* 3) Görseller: yalnız kullanılanlar, yazı işlenirken indirilir; WebP türevleri Payload'da üretilir (≤200 KB) */
  const mediaCache = new Map<string, any>()
  async function media(url: string, alt: string, credit?: string) {
    if (!url) return undefined
    if (mediaCache.has(url)) return mediaCache.get(url)
    if (DRY) { mediaCache.set(url, 'dry'); return 'dry' }
    try {
      const found = await payload.find({ collection: 'media', where: { sourceUrl: { equals: url } }, limit: 1, depth: 0 })
      if (found.docs[0]) { mediaCache.set(url, found.docs[0].id); return found.docs[0].id }
      const r = await fetch(url); if (!r.ok) throw new Error(String(r.status))
      const buf = Buffer.from(await r.arrayBuffer())
      const name = decodeURIComponent(url.split('/').pop() || 'gorsel').replace(/\.(jpe?g|png|gif|webp|avif)$/i, '') + '.' + (r.headers.get('content-type')?.split('/')[1] || 'jpg')
      const m = await payload.create({ collection: 'media', data: { alt: cut(alt || 'Görsel', 125), credit: credit || 'Görsel: UPDATED arşivi', sourceUrl: url }, file: { data: buf, mimetype: r.headers.get('content-type') || 'image/jpeg', name, size: buf.length }, context: ctx })
      mediaCache.set(url, m.id); log.media++
      return m.id
    } catch (e) { log.errors.push(`görsel ${url}: ${e}`); return undefined }
  }

  /** HTML → Lexical. Metindeki görseller Payload'a yüklenip "upload" düğümü olur (WordPress adresine bağlı kalmaz). */
  async function body(html: string, title: string, gorselsiz = false) {
    const clean = html.replace(/<!--[\s\S]*?-->/g, '').replace(/\[\/?[a-z_]+[^\]]*\]/g, '') // blok yorumları, kısa kodlar
    const dom = new JSDOM(`<body>${clean}</body>`)
    const doc = dom.window.document
    // Editörün tanımadığı öğeler: betik/stil kaldırılır; video gömmeleri bağlantıya, tablolar satır satır paragrafa çevrilir.
    doc.querySelectorAll('script, style, noscript, form, button, svg').forEach((e: any) => e.remove())
    doc.querySelectorAll('iframe, video, embed, object').forEach((e: any) => { const src = e.getAttribute('src') || e.getAttribute('data-src') || ''; const p = doc.createElement('p'); if (src) { const a = doc.createElement('a'); a.href = src.startsWith('//') ? 'https:' + src : src; a.textContent = /youtu/.test(src) ? 'Videoyu YouTube’da izleyin' : 'Gömülü içerik'; p.appendChild(a) } e.replaceWith(p) })
    doc.querySelectorAll('table').forEach((t: any) => { const frag = doc.createDocumentFragment(); t.querySelectorAll('tr').forEach((tr: any) => { const txt = [...tr.querySelectorAll('th,td')].map((c: any) => c.textContent.trim()).filter(Boolean).join(' · '); if (txt) { const p = doc.createElement('p'); p.textContent = txt; frag.appendChild(p) } }); t.replaceWith(frag) })
    doc.querySelectorAll('div, section, span:not([class])').forEach((e: any) => { if (!e.querySelector('img')) e.replaceWith(...e.childNodes) })
    const children: any[] = []
    let buf = ''
    const flush = () => { if (buf.trim()) children.push(...convertHTMLToLexical({ editorConfig, html: buf, JSDOM }).root.children); buf = '' }
    for (const el of [...dom.window.document.body.childNodes] as any[]) {
      const img = el.nodeName === 'IMG' ? el : el.querySelector?.('img')
      if (img && gorselsiz) { const cap = el.querySelector?.('figcaption')?.textContent?.trim(); if (cap) buf += `<p><em>${cap}</em></p>` }
      else if (img && (el.nodeName === 'FIGURE' || el.nodeName === 'IMG' || (el.nodeName === 'P' && el.textContent.trim() === ''))) {
        flush()
        const src = img.getAttribute('data-src') || img.getAttribute('src') || ''
        const cap = el.querySelector?.('figcaption')?.textContent?.trim()
        const id = await media(src.split('?')[0].replace(/-\d+x\d+(\.\w+)$/, '$1'), img.getAttribute('alt') || title, cap)
        if (id && id !== 'dry') children.push({ type: 'upload', relationTo: 'media', value: id, version: 3, fields: {}, format: '', id: randomBytes(12).toString('hex') })
      } else buf += el.outerHTML ?? el.textContent ?? ''
    }
    flush()
    return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } }
  }

  /* 4) Yazılar */
  const redirects: Record<string, string> = existsSync('../web/src/redirects.json') ? JSON.parse(readFileSync('../web/src/redirects.json', 'utf8')) : {}
  let n = 0
  for await (const p of all('posts', { status: 'publish', _embed: 1, orderby: 'date', order: 'asc' })) {
    if (LIMIT && n++ >= LIMIT) break
    try {
      const title = decode(p.title.rendered).trim()
      const cat = (p.categories || []).map((id: number) => catMap.get(id)).find(Boolean)
      if (!cat) { log.skipped.push(`${p.id} kategori yok: ${title}`); continue }
      const fm = p._embedded?.['wp:featuredmedia']?.[0]
      const cover = fm?.source_url ? await media(fm.source_url, fm.alt_text || title, fm.caption?.rendered ? decode(fm.caption.rendered).trim() : undefined) : undefined
      const spot = cut(decode(p.excerpt?.rendered || '').replace(/\s+/g, ' ').trim() || title, 160)
      const common = {
        title: cut(title, 70), spot, cover, author: authorMap.get(p.author), slug: decodeURIComponent(p.slug),
        body: await body(p.content.rendered, title), publishedAt: p.date_gmt + 'Z', _status: 'published',
        seo: { title: p.yoast_head_json?.title ? cut(p.yoast_head_json.title.replace(/\s*[-|–]\s*UPDATED.*$/i, ''), 60) : undefined, description: p.yoast_head_json?.description ? cut(p.yoast_head_json.description, 160) : undefined },
        workflow: { state: 'yayinda' },
      }
      let path: string
      const isReview = REVIEW_CAT && (p.categories || []).some((id: number) => catMap.get(id)?.slug === REVIEW_CAT)
      if (isReview) {
        const raw = SCORE_META ? Number(p.meta?.[SCORE_META] ?? p[SCORE_META]) : NaN
        const score = Number.isFinite(raw) ? Math.round(raw <= 5 ? raw * 4 : raw <= 10 ? raw * 2 : raw) : 0
        const pname = title.split(/[:–-]/)[0].replace(/\s*incelemesi?\s*$/i, '').trim()
        const pslug = trSlug(pname, 8)
        let prod: any = DRY ? { id: 'dry' } : (await payload.find({ collection: 'products', where: { slug: { equals: pslug } }, limit: 1, depth: 0 })).docs[0]
        if (!prod) prod = await payload.create({ collection: 'products', data: { name: pname, brand: pname.split(' ')[0], type: 'other', status: 'satista', certainty: 4, legacy: true, slug: pslug }, context: ctx })
        const doc = await upsert('reviews', p.id, { ...common, product: prod.id, scoreBox: { score, pros: [], cons: [] } })
        path = `/inceleme/${(doc as any).slug || common.slug}`; log.reviews++
      } else {
        let doc: any
        try { doc = await upsert('news', p.id, { ...common, category: cat.id, label: 'yok' }) }
        catch (e: any) {
          // Metin editöre sığmadıysa düz paragraflarla yeniden dene (biçim kaybolur, içerik korunur); sebebi kayda yazılır.
          log.errors.push(`yazı ${p.id} ilk deneme: ${e.message} ${JSON.stringify(e.data?.errors || '').slice(0, 300)}`)
          // 2. deneme: biçim (başlık, bağlantı, kalın) korunur, metin içi görseller çıkarılır
          try { doc = await upsert('news', p.id, { ...common, body: await body(p.content.rendered, title, true), category: cat.id, label: 'yok' }); log.gorselsiz = (log.gorselsiz || 0) + 1 } catch (e2: any) { log.errors.push(`yazı ${p.id} ikinci deneme: ${e2.message}`) }
          if (!doc) {
          const text = new JSDOM(`<body>${p.content.rendered}</body>`).window.document.body.textContent || ''
          const paras = text.split(/\n\s*\n|\n/).map((x: string) => x.trim()).filter(Boolean)
          const plain = { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: (paras.length ? paras : [title]).map((t: string) => ({ type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0, children: [{ type: 'text', text: t, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }] })) } }
          doc = await upsert('news', p.id, { ...common, body: plain, category: cat.id, label: 'yok' })
          log.duzMetin = (log.duzMetin || 0) + 1
          }
        }
        path = `/${cat.slug}/${(doc as any).slug || common.slug}`; log.news++
      }
      const old = new URL(p.link).pathname.replace(/\/$/, '') || '/'
      if (old !== path) redirects[old] = path
    } catch (e) { log.errors.push(`yazı ${p.id}: ${(e as Error).message}`) }
  }

  if (!DRY) writeFileSync('../web/src/redirects.json', JSON.stringify(redirects, null, 0))
  writeFileSync('scripts/wp-migrate.log.json', JSON.stringify({ ...log, redirects: Object.keys(redirects).length, at: new Date().toISOString(), dry: DRY }, null, 2))
  console.log(`Kategori ${log.categories} · yazar ${log.authors} · görsel ${log.media} · haber ${log.news} · inceleme ${log.reviews} · atlanan ${log.skipped.length} · hata ${log.errors.length} · yönlendirme ${Object.keys(redirects).length}`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
