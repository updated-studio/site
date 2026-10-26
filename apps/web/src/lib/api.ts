/**
 * Payload REST istemcisi → görünüm modelleri (types.ts).
 * CMS_URL boşsa her fonksiyon örnek verilere düşer; böylece site CMS olmadan da açılır.
 * Statik derlemede çalışır (GitHub Actions); yalnız yayımlanmış içerik okunur. Taslak önizleme panelin /api/onizleme ucundan, tarayıcıda.
 */
import type { Ad, Author, Cat, Comparison, Home, Img, News, Product, ProductRef, Reel, Review, Spec, Video } from './types'
import { lexicalToHtml } from './rich'
import { STATUS_TEXT } from './format'
import * as S from './sample'
import { env } from './env'

const CMS = env('CMS_URL').replace(/\/$/, '')
export const live = !!CMS
export const PAGE = 20

/* ---------- düşük seviye ---------- */
function qs(o: Record<string, any>, pre = ''): string {
  return Object.entries(o).flatMap(([k, v]) => {
    const key = pre ? `${pre}[${k}]` : k
    if (v === undefined || v === null) return []
    if (typeof v === 'object' && !Array.isArray(v)) return [qs(v, key)]
    // Dizideki nesneler (where[and][0][...]) de açılır; önceden "[object Object]" gidiyor, panel süzgeci yok sayıyordu (26 Ekim 2026)
    if (Array.isArray(v)) return v.map((x, i) => (x && typeof x === 'object' ? qs(x, `${key}[${i}]`) : `${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(x)}`))
    return [`${encodeURIComponent(key)}=${encodeURIComponent(v)}`]
  }).filter(Boolean).join('&')
}
/** Derleme tek süreçte çalışır: aynı istek bir kez gider (bellek önbelleği), geçici hatada 3 kez denenir. */
const memo = new Map<string, Promise<any>>()
function get<T = any>(path: string, params: Record<string, any> = {}): Promise<T> {
  const url = `${CMS}/api/${path}${Object.keys(params).length ? '?' + qs(params) : ''}`
  if (!memo.has(url)) memo.set(url, (async () => {
    for (let i = 0; ; i++) {
      try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } })
        if (r.ok) return r.json()
        if (r.status < 500 || i >= 2) throw new Error(`CMS ${r.status} ${path}`)
      } catch (e) { if (i >= 2) throw e }
      await new Promise((ok) => setTimeout(ok, 800 * (i + 1)))
    }
  })())
  return memo.get(url)!
}
const published = { _status: { equals: 'published' } }
const list = (collection: string, where: any = {}, o: { page?: number; limit?: number; sort?: string; depth?: number } = {}) =>
  get<{ docs: any[]; totalDocs: number; hasNextPage: boolean }>(collection, { where: { and: [published, where] }, sort: o.sort || '-publishedAt', limit: o.limit || PAGE, page: o.page || 1, depth: o.depth ?? 2 })

/* ---------- eşleyiciler ---------- */
const rel = (v: any) => (v && typeof v === 'object' ? v : null)
/**
 * Görseller okura Natro'dan gider: Supabase adresi derlemede /medya/… yoluna çevrilir,
 * dosyaların kendisi scripts/postbuild.mjs ile indirilip siteyle birlikte yüklenir (Supabase trafik kotası harcanmaz).
 */
const MEDIA = env('MEDIA_PUBLIC_URL').replace(/\/$/, '')
export const localMedia = (u?: string) => {
  if (!u) return u
  if (u.startsWith('/api/media/file/')) u = CMS + u
  return MEDIA && u.startsWith(MEDIA + '/') ? '/medya/' + u.slice(MEDIA.length + 1) : u
}
export function mImg(m: any, size: 'card' | 'hero' | 'thumb' | 'reel' | 'og' = 'card'): Img | undefined {
  m = rel(m); if (!m?.url) return undefined
  const s = m.sizes || {}
  const pick = localMedia(s[size]?.url || m.url)!
  const srcset = ['thumb', 'card', 'hero'].map((k) => s[k]?.url && `${localMedia(s[k].url)} ${s[k].width}w`).filter(Boolean).join(', ')
  return { url: pick, alt: m.alt || '', credit: m.credit, w: s[size]?.width || m.width, h: s[size]?.height || m.height, srcset: size === 'reel' ? undefined : srcset || undefined }
}
const mCat = (c: any): Cat => (rel(c) ? { name: c.name, slug: c.slug } : { name: 'Haber', slug: 'haber' })
const mAuthor = (a: any): Author => (rel(a) ? { name: a.name, slug: a.slug, title: a.title, bio: a.bio } : { name: 'UPDATED', slug: 'updated' })
const mSpec = (s: any): Spec => ({ key: s.key, value: s.value || null, num: s.num ?? undefined, unit: s.unit, source: s.source, sourceUrl: s.sourceUrl, at: s.at, group: s.group, higherIsBetter: s.higherIsBetter, searchWeight: s.searchWeight })
export function mRef(p: any): ProductRef | null {
  p = rel(p); if (!p) return null
  return { slug: p.slug, name: p.name, brand: p.brand, type: p.type, status: p.status, certainty: p.certainty || 4, image: mImg(p.image, 'card'), blurb: p.blurb, specs: (p.specs || []).map(mSpec), score: p.score }
}
const media = (v: any) => { const m = mImg(v, 'hero'); return m ? { url: m.url, alt: m.alt, credit: m.credit, w: m.w, h: m.h } : null }
const seo = (d: any) => ({ title: d.seo?.title || d.title, description: d.seo?.description || d.spot || '', image: mImg(d.seo?.image || d.cover, 'og'), canonical: d.seo?.canonical, noindex: !!d.seo?.noindex, entities: d.seo?.geo?.entities || [], faq: d.seo?.geo?.faq || [] })
export function mNews(d: any): News {
  return {
    id: String(d.id), kind: 'news', title: d.title, spot: d.spot, path: d.path, category: mCat(d.category), label: d.label || 'yok', cover: mImg(d.cover, 'hero'), author: mAuthor(d.author),
    publishedAt: d.publishedAt || d.createdAt, updatedAt: d.updatedAt, readingTime: d.readingTime, products: (d.products || []).map(mRef).filter(Boolean) as ProductRef[],
    shortAnswer: d.shortAnswer, html: d.body ? lexicalToHtml(d.body, media) : undefined, knowns: d.knowns || [], unknowns: d.unknowns || [], sources: d.sources || [], corrections: d.corrections || [], seo: seo(d),
  }
}
export function mReview(d: any): Review {
  const n = mNews({ ...d, products: d.product ? [d.product] : [] })
  const { category, label, kind, ...rest } = n
  const v = rel(d.video)
  return {
    ...rest, kind: 'review', product: mRef(d.product)!, score: d.scoreBox?.score ?? 0, pros: d.scoreBox?.pros || [], cons: d.scoreBox?.cons || [], usageDays: d.scoreBox?.usageDays, deviceSource: d.scoreBox?.deviceSource,
    who: { for: d.scoreBox?.who?.for || [], notFor: d.scoreBox?.who?.notFor || [] }, methodHtml: d.method ? lexicalToHtml(d.method, media) : undefined, video: v ? mVideo(v) : undefined,
  }
}
export function mComparison(d: any): Comparison {
  return { id: String(d.id), kind: 'comparison', title: d.title, spot: d.spot, path: d.path, a: mRef(d.a)!, b: mRef(d.b)!, shortAnswer: d.shortAnswer, keyDiffs: d.keyDiffs || [], whoFor: d.whoFor, method: d.method, cover: mImg(d.cover, 'hero'), author: mAuthor(d.author), publishedAt: d.publishedAt, seo: seo(d) }
}
const mVideo = (v: any): Video => ({ title: v.title, youtubeId: v.youtubeId, kind: v.kind, thumb: mImg(v.thumb, 'card') || (v.youtubeId ? { url: `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`, alt: '' } : undefined) })
const mReel = (r: any): Reel => ({ caption: r.caption, url: r.url, cover: mImg(r.cover, 'reel') })
const mAd = (a: any): Ad => ({ slot: a.slot, name: a.name, advertiser: a.advertiser, url: a.url, image: mImg(a.image, 'hero'), mobileImage: mImg(a.mobileImage, 'card'), videoUrl: a.videoUrl, title: a.title })

/* ---------- CMS yoksa örnek veri. CMS varken hata derlemeyi durdurur: yayına asla örnek veri çıkmaz. ---------- */
async function safe<T>(liveFn: () => Promise<T>, sample: () => T): Promise<T> {
  return live ? liveFn() : sample()
}
const page = <T,>(arr: T[], p: number, n = PAGE) => arr.slice((p - 1) * n, p * n)
const cyc = <T,>(arr: T[], p: number, n = PAGE) => Array.from({ length: n }, (_, i) => arr[((p - 1) * n + i) % arr.length]) // örnek veride akış bitmesin

/* ---------- site ---------- */
export type SiteCfg = { tagline: string; nav: { label: string; href: string }[]; youtube: string; instagram: string; kulupUrl: string; newsletterNote: string }
/** Üst menü (Fatih, 26 Ekim 2026): altı ana bölüm, her biri ayrı sayfa; Kulüp başlıkta ayrıca vurgulanır. Panelin menü listesi artık kullanılmaz. */
export const ANA_MENU = [['Ana Sayfa', '/'], ['Haberler', '/haberler'], ['İncelemeler & Kıyaslamalar', '/inceleme'], ['Rehber', '/rehber'], ['Araçlar', '/araclar']].map(([label, href]) => ({ label, href }))
const DEF_NAV = ANA_MENU
const DEF_SITE: SiteCfg = { tagline: 'Teknoloji haberleri, incelemeler ve karşılaştırmalar. Önce bilgi, sonra yorum.', nav: DEF_NAV, youtube: 'https://www.youtube.com/@nerdesinfatih', instagram: 'https://www.instagram.com/updated.tr/', kulupUrl: '/kulup', newsletterNote: 'Haftalık bülten pazartesi 08.30.' }
let siteCache: { at: number; v: SiteCfg } | null = null
export async function getSite(): Promise<SiteCfg> {
  if (siteCache && Date.now() - siteCache.at < 60e3) return siteCache.v
  const v = await safe(async () => { const g = await get('globals/site', { depth: 0 }); return { ...DEF_SITE, ...Object.fromEntries(Object.entries(g).filter(([, x]) => x != null && x !== '')), nav: ANA_MENU } as SiteCfg }, () => DEF_SITE)
  siteCache = { at: Date.now(), v }
  return v
}

/* ---------- haberler ---------- */
export const getLatest = (p = 1, n = PAGE) => safe(async () => (await list('news', {}, { page: p, limit: n })).docs.map(mNews), () => (p === 1 ? page(S.NEWS, 1, n) : cyc(S.NEWS, p, n)))
/** Rehber: "Rehber" etiketli haberler (satın alma rehberi, nasıl yapılır); konu rafları Rehber sayfası tamamlanınca */
export const getRehber = (n = 60) => safe(async () => (await list('news', { label: { equals: 'rehber' } }, { limit: n })).docs.map(mNews), () => S.NEWS.filter((x) => x.label === 'rehber'))
export const getBreaking = () => safe(async () => (await list('news', { label: { equals: 'son-dakika' }, publishedAt: { greater_than: new Date(Date.now() - 2 * 3600e3).toISOString() } }, { limit: 5, depth: 1 })).docs.map(mNews), () => S.NEWS.filter((n) => n.label === 'son-dakika'))
export const getCategory = (slug: string) => safe<(Cat & { description?: string }) | null>(async () => { const r = await get('categories', { where: { slug: { equals: slug } }, limit: 1, depth: 0 }); const c = r.docs[0]; return c ? { name: c.name, slug: c.slug, description: c.description as string | undefined } : null }, () => S.CATS.find((c) => c.slug === slug) || null)
export const getCategoryNews = (slug: string, p = 1) => safe(async () => (await list('news', { 'category.slug': { equals: slug } }, { page: p })).docs.map(mNews), () => { const a = S.NEWS.filter((n) => n.category.slug === slug); return a.length ? cyc(a, p) : [] })
export const getNews = (catSlug: string, slug: string) => safe(async () => { const r = await list('news', { slug: { equals: slug }, 'category.slug': { equals: catSlug } }, { limit: 1, depth: 2 }); return r.docs[0] ? mNews(r.docs[0]) : null }, () => S.NEWS.find((n) => n.path === `/${catSlug}/${slug}`) || null)
export const getRelated = (n: News, k = 4) => safe(async () => (await list('news', { id: { not_equals: n.id }, or: [{ 'category.slug': { equals: n.category.slug } }, ...(n.products.length ? [{ 'products.slug': { in: n.products.map((p) => p.slug) } }] : [])] } as any, { limit: k, depth: 1 })).docs.map(mNews), () => S.NEWS.filter((x) => x.id !== n.id && (x.category.slug === n.category.slug || x.products.some((p) => n.products.some((q) => q.slug === p.slug)))).slice(0, k))
/** En çok okunanlar: panelde elle seçildiyse (yalnız 48 saat sekmesi) o; yoksa kendi okunma sayacımızdan. */
export type Donem = '48s' | '7g' | '30g' | 'tum'
export const DONEMLER: [Donem, string][] = [['48s', '48 saat'], ['7g', '7 gün'], ['30g', '30 gün'], ['tum', 'Tüm zamanlar']]
export const getMostRead = (n = 5, donem: Donem = '48s') => safe(async () => {
  const h = await get('globals/home', { depth: 2 })
  if (donem === '48s' && h.mostRead?.length) return (h.mostRead as any[]).map(mNews)
  const top = (await get<{ yol: string }[]>('en-cok-okunan', { donem, n: n * 3 }).catch(() => [])) as { yol: string }[]
  if (!top.length) return [] as News[]
  const r = await list('news', { path: { in: top.map((t) => t.yol) } }, { limit: n * 3, depth: 1 })
  const byPath = new Map(r.docs.map((d: any) => [d.path, mNews(d)]))
  return top.map((t) => byPath.get(t.yol)).filter(Boolean).slice(0, n) as News[]
}, () => { const o = { '48s': 3, '7g': 0, '30g': 6, tum: 9 }[donem]; return [...S.NEWS.slice(o), ...S.NEWS.slice(0, o)].slice(0, n) })

/* ---------- inceleme, kıyas, künye ---------- */
export const getReviews = (p = 1, n = PAGE) => safe(async () => (await list('reviews', {}, { page: p, limit: n })).docs.map(mReview), () => page(S.REVIEWS, p, n))
export const getReview = (slug: string) => safe(async () => { const r = await list('reviews', { slug: { equals: slug } }, { limit: 1, depth: 2 }); return r.docs[0] ? mReview(r.docs[0]) : null }, () => S.REVIEWS.find((r) => r.path === `/inceleme/${slug}`) || null)
export const getComparison = (slug: string) => safe(async () => { const r = await get('comparisons', { where: { and: [published, { slug: { equals: slug } }] }, limit: 1, depth: 2 }); return r.docs[0] ? mComparison(r.docs[0]) : null }, () => S.COMPARISONS.find((c) => c.path === `/karsilastirma/${slug}`) || null)
export const getComparisons = () => safe(async () => (await list('comparisons', {}, { limit: 50, depth: 1 })).docs.map(mComparison), () => S.COMPARISONS)
export async function getProduct(slug: string): Promise<Product | null> {
  return safe(async () => {
    const r = await get('products', { where: { slug: { equals: slug } }, limit: 1, depth: 2, joins: { news: { limit: 50, sort: '-publishedAt' }, reviews: { limit: 20 } } })
    const d = r.docs[0]; if (!d) return null
    const ref = mRef(d)!
    const reviews = (d.reviews?.docs || []).filter((x: any) => rel(x) && x._status === 'published').map(mReview)
    const cmp = (await get('comparisons', { where: { and: [published, { or: [{ a: { equals: d.id } }, { b: { equals: d.id } }] }] }, limit: 20, depth: 1 })).docs.map(mComparison)
    return { ...ref, id: d.id, score: reviews[0]?.score, comparisons: cmp, path: `/urun/${d.slug}`, releaseWhen: d.releaseWhen, parts: d.parts || [], rivals: (d.rivals || []).map(mRef).filter(Boolean), news: (d.news?.docs || []).filter((x: any) => rel(x) && x._status === 'published').map(mNews), reviews, seo: seo({ ...d, title: d.name, spot: d.blurb }) } as Product
  }, () => (S.PRODUCTS[slug] ? { ...S.PRODUCTS[slug], comparisons: S.COMPARISONS.filter((c) => c.a.slug === slug || c.b.slug === slug) } : null))
}
export const getProducts = (limit = 12) => safe(async () => (await get('products', { sort: '-updatedAt', limit, depth: 1 })).docs.map(mRef).filter(Boolean) as ProductRef[], () => Object.values(S.PRODUCTS).slice(0, limit))
export const getRadar = () => safe(async () => (await get('products', { where: { onRadar: { equals: true } }, sort: 'certainty', limit: 6, depth: 1 })).docs.map((d: any) => ({ ...mRef(d)!, releaseWhen: d.releaseWhen })), () => S.RADAR.map((p) => ({ ...p })))

/* ---------- kanallar, reklam ---------- */
export const getVideos = (n = 8) => safe(async () => (await get('videos', { sort: '-publishedAt', limit: n, depth: 1 })).docs.map(mVideo), () => S.VIDEOS.slice(0, n))
export const getReels = (n = 10) => safe(async () => (await get('reels', { sort: '-publishedAt', limit: n, depth: 1 })).docs.map(mReel), () => S.REELS.slice(0, n))
let adCache: { at: number; v: Ad[] } | null = null
export async function getAds(): Promise<Ad[]> {
  if (adCache && Date.now() - adCache.at < 5 * 60e3) return adCache.v
  const now = new Date().toISOString()
  const v = await safe(async () => (await get('ads', { where: { and: [{ active: { equals: true } }, { or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }] }, { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than: now } }] }] }, limit: 50, depth: 1 })).docs.map(mAd), () => [])
  adCache = { at: Date.now(), v }
  return v
}
export const pickAd = (ads: Ad[], slot: Ad['slot'], seed = 0) => { const a = ads.filter((x) => x.slot === slot); return a.length ? a[seed % a.length] : null }

/* ---------- ana sayfa ---------- */
export async function getHome(): Promise<Home> {
  return safe(async () => {
    const h = await get('globals/home', { depth: 2 })
    const hero = (h.hero || []).map((r: any) => (r.relationTo === 'reviews' ? mReview(r.value) : r.relationTo === 'comparisons' ? mComparison(r.value) : mNews(r.value)))
    return { heroLayout: h.heroLayout || 'akordeon', hero, modules: h.modules || {}, mostRead: (h.mostRead || []).map(mNews) }
  }, () => ({ heroLayout: 'akordeon', hero: [S.NEWS[3], S.NEWS[9], S.REVIEWS[0], S.NEWS[12], S.NEWS[6]], modules: {}, mostRead: [S.NEWS[3], S.NEWS[9], S.NEWS[1], S.NEWS[12], S.NEWS[2]] }))
}

/* ---------- yazar, arama ---------- */
export const getAuthor = (slug: string) => safe(async () => { const r = await get('authors', { where: { slug: { equals: slug } }, limit: 1, depth: 0 }); return r.docs[0] ? mAuthor(r.docs[0]) : null }, () => S.AUTHORS.find((a) => a.slug === slug) || null)
export const getAuthorNews = (slug: string, p = 1) => safe(async () => (await list('news', { 'author.slug': { equals: slug } }, { page: p })).docs.map(mNews), () => S.NEWS.filter((n) => n.author.slug === slug))
export async function search(q: string) {
  q = q.trim(); if (q.length < 2) return { news: [] as News[], products: [] as ProductRef[] }
  return safe(async () => {
    const [n, p] = await Promise.all([list('news', { or: [{ title: { like: q } }, { spot: { like: q } }] }, { limit: 20, depth: 1 }), get('products', { where: { or: [{ name: { like: q } }, { brand: { like: q } }] }, limit: 8, depth: 1 })])
    return { news: n.docs.map(mNews), products: p.docs.map(mRef).filter(Boolean) as ProductRef[] }
  }, () => { const t = fold(q); return { news: S.NEWS.filter((n) => fold(n.title + ' ' + n.spot).includes(t)), products: Object.values(S.PRODUCTS).filter((p) => fold(p.brand + ' ' + p.name).includes(t)) } })
}
/** Aramada Türkçe katlama: "DJI" ~ "dji", "İnceleme" ~ "inceleme", "ç" ~ "c". */
const fold = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/* ---------- site haritaları ---------- */
export async function allPaths(collection: 'news' | 'reviews' | 'comparisons' | 'products', since?: Date) {
  return safe(async () => {
    const out: { path: string; updatedAt: string; title?: string; publishedAt?: string; image?: string }[] = []
    for (let p = 1; p < 200; p++) {
      const where: any = collection === 'products' ? {} : { and: [published, ...(since ? [{ publishedAt: { greater_than: since.toISOString() } }] : [])] }
      const r = await get(collection, { where, limit: 500, page: p, depth: 1, select: { path: true, updatedAt: true, title: true, name: true, publishedAt: true, cover: true }, sort: '-updatedAt' })
      out.push(...r.docs.map((d: any) => ({ path: d.path, updatedAt: d.updatedAt, title: d.title || d.name, publishedAt: d.publishedAt, image: rel(d.cover)?.url })))
      if (!r.hasNextPage) break
    }
    return out.filter((x) => x.path)
  }, () => {
    const src: any[] = collection === 'news' ? S.NEWS : collection === 'reviews' ? S.REVIEWS : collection === 'comparisons' ? S.COMPARISONS : Object.values(S.PRODUCTS)
    return src.map((d) => ({ path: d.path, updatedAt: d.publishedAt || new Date().toISOString(), title: d.title || d.name, publishedAt: d.publishedAt, image: d.cover?.url }))
  })
}
export const getCategories = () => safe(async () => (await get('categories', { sort: 'order', limit: 100, depth: 0 })).docs.map((c: any) => ({ name: c.name, slug: c.slug })) as Cat[], () => S.CATS)

export const statusText = (s: string) => STATUS_TEXT[s] || s

/* ---------- kurumsal sayfalar ---------- */
const STATIC_PAGES: Record<string, { title: string; spot: string; html: string }> = {
  hakkimizda: { title: 'Hakkımızda', spot: 'UPDATED, teknolojiyi önce bilgiyle anlatan bir yayın.', html: '<p>[Metin panelden girilecek: Sayfalar › Hakkımızda]</p>' },
  'test-yontemimiz': { title: 'Test yöntemimiz', spot: 'Cihazları nasıl, ne kadar süre ve hangi koşulda test ediyoruz.', html: '<p>[Metin panelden girilecek]</p>' },
  'duzeltme-politikasi': { title: 'Düzeltme politikası', spot: 'Hata silinmez; tarih-saatli düzeltme notu eklenir.', html: '<p>[Metin panelden girilecek]</p>' },
  reklam: { title: 'Reklam ve sponsorluk', spot: 'Reklam alanları, sponsorlu içerik ilkeleri ve iletişim.', html: '<p>[Metin panelden girilecek]</p>' },
}
type PageT = { title: string; spot: string; html: string; seo: { title: string; description: string } }
export const getPage = (slug: string) => safe<PageT | null>(async () => { const r = await list('pages', { slug: { equals: slug } }, { limit: 1, depth: 1, sort: '-updatedAt' }); const d = r.docs[0]; return d ? { title: d.title as string, spot: (d.spot || '') as string, html: lexicalToHtml(d.body, media), seo: seo(d) } : null }, () => (STATIC_PAGES[slug] ? { ...STATIC_PAGES[slug], seo: { title: STATIC_PAGES[slug].title, description: STATIC_PAGES[slug].spot } } : null))

/* ---------- toplu okuma (statik derleme: her içerik türü 100'erli sayfalarla bir kez çekilir) ---------- */
async function bulk(collection: string, map: (d: any) => any, where: any = {}, depth = 2) {
  const out: any[] = []
  for (let p = 1; p < 1000; p++) {
    const r = await get(collection, { where: collection === 'products' ? where : { and: [published, where] }, limit: 100, page: p, depth, sort: collection === 'products' ? 'slug' : '-publishedAt' })
    out.push(...r.docs.map(map)); if (!r.hasNextPage) break
  }
  return out
}
export const allNews = () => safe<News[]>(() => bulk('news', mNews), () => S.NEWS)
export const allReviews = () => safe<Review[]>(() => bulk('reviews', mReview), () => S.REVIEWS)
export const allComparisons = () => safe<Comparison[]>(() => bulk('comparisons', mComparison), () => S.COMPARISONS)
export const allProductSlugs = () => safe<string[]>(async () => (await bulk('products', (d) => d.slug, {}, 0)).filter(Boolean), () => Object.keys(S.PRODUCTS))
export const allAuthors = () => safe<Author[]>(async () => (await get('authors', { limit: 500, depth: 0 })).docs.map(mAuthor), () => S.AUTHORS)
let SAYFALAR: Promise<string[]> | null = null
/** Yayındaki kurumsal sayfaların adresleri (derleme boyunca bir kez çekilir; her sayfanın alt bilgisi kullanır) */
export const allPages = () => (SAYFALAR ??= safe<string[]>(async () => (await get('pages', { where: published, limit: 200, depth: 0 })).docs.map((d: any) => d.slug), () => Object.keys(STATIC_PAGES)))
/** Sayfa sayısı (sonsuz akış ve /sayfa/N için). Çok eski sayfalar arşivde kalır: en fazla 50 sayfa üretilir. */
export const MAX_PAGES = 50
export async function pageCount(kind: 'son' | 'kategori' | 'yazar', slug?: string) {
  return safe(async () => {
    const where = kind === 'kategori' ? { 'category.slug': { equals: slug } } : kind === 'yazar' ? { 'author.slug': { equals: slug } } : {}
    const r = await get('news', { where: { and: [published, where] }, limit: 1, depth: 0 })
    return Math.min(MAX_PAGES, Math.max(1, Math.ceil(r.totalDocs / PAGE)))
  }, () => 3)
}

/* ---------- yarışmalar takvimi (herkese açık alanlar; başvuru bağlantısı ve ayrıntılar Uper'e /api/uye/yarismalar) ---------- */
export type Yarisma = { id: number; ad: string; duzenleyen?: string; tur: 'fotograf' | 'kisa-film' | 'video' | 'karma'; kapsam?: 'turkiye' | 'uluslararasi'; sonTarih: string; sonucTarihi?: string; ucretsiz?: boolean; konu?: string }
export const getYarismalar = () => safe(async () => ((await get('yarismalar', { sort: 'sonTarih', limit: 500, depth: 0 }).catch(() => ({ docs: [] }))).docs as any[]).map((d: any) => ({
  id: d.id, ad: d.ad, duzenleyen: d.duzenleyen || undefined, tur: d.tur, kapsam: d.kapsam || undefined, sonTarih: d.sonTarih, sonucTarihi: d.sonucTarihi || undefined, ucretsiz: !!d.ucretsiz, konu: d.konu || undefined,
})) as Yarisma[], () => S.YARISMALAR as Yarisma[])

/* ---------- haftalık fotoğraf görevi (tema herkese açık; fotoğraflar ve oylama /api/uye/gorev'den, tarayıcıda) ---------- */
export type Gorev = { id: number; baslik: string; aciklama?: string; baslangic: string; bitis: string; oylamaBitis: string }
export const getGorevler = () => safe(async () => ((await get('gorevler', { sort: '-baslangic', limit: 8, depth: 0 }).catch(() => ({ docs: [] }))).docs as any[]).map((d: any) => ({
  id: d.id, baslik: d.baslik, aciklama: d.aciklama || undefined, baslangic: d.baslangic, bitis: d.bitis, oylamaBitis: d.oylamaBitis,
})) as Gorev[], () => [] as Gorev[])
