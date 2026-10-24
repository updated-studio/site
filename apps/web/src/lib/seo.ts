/**
 * SEO + GEO: meta etiketleri ve JSON-LD. Değerler CMS'te otomatik dolduruluyor (autoSeo); burada yalnız biçimlenir.
 * Haber → NewsArticle (+ about Product), İnceleme → Review (/20), Kıyas → Article + ItemList, Künye → Product.
 */
import type { Comparison, News, Product, Review } from './types'
import { env } from './env'

export const SITE = env('SITE_URL', 'https://updated.com.tr').replace(/\/$/, '')
export const NAME = 'UPDATED'
export type Meta = { title: string; description: string; path: string; image?: string; type?: 'website' | 'article'; noindex?: boolean; canonical?: string; published?: string; modified?: string; jsonld?: object[] }

const abs = (u?: string) => (!u ? `${SITE}/marka/og-varsayilan.jpg` : /^https?:/.test(u) ? u : SITE + u)
const org = { '@type': 'NewsMediaOrganization', '@id': `${SITE}/#org`, name: NAME, url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/marka/updated-up-black.svg` }, sameAs: ['https://www.youtube.com/@nerdesinfatih', 'https://www.instagram.com/updated.tr/'] }
/** Yayındaki kurumsal sayfalar verilirse kuruluş şemasına yayın ilkeleri ve düzeltme politikası eklenir (sayfa yoksa bağlantı verilmez; Google News güven sinyali) */
export const siteLd = (sayfalar: string[] = []) => [{ ...org, ...(sayfalar.includes('duzeltme-politikasi') ? { correctionsPolicy: `${SITE}/duzeltme-politikasi` } : {}), ...(sayfalar.includes('yayin-ilkeleri') ? { ethicsPolicy: `${SITE}/yayin-ilkeleri` } : {}) }, { '@type': 'WebSite', '@id': `${SITE}/#site`, url: SITE, name: NAME, inLanguage: 'tr-TR', publisher: { '@id': `${SITE}/#org` }, potentialAction: { '@type': 'SearchAction', target: `${SITE}/ara?q={q}`, 'query-input': 'required name=q' } }]
const person = (a: { name: string; slug: string }) => ({ '@type': 'Person', name: a.name, url: `${SITE}/yazar/${a.slug}` })
const crumbs = (items: [string, string][]) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })) })
const faq = (f?: { q: string; a: string }[]) => (f?.length ? [{ '@type': 'FAQPage', mainEntity: f.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }] : [])
const productLd = (p: { name: string; brand: string; slug: string; image?: { url: string } }) => ({ '@type': 'Product', name: p.name, brand: { '@type': 'Brand', name: p.brand }, url: `${SITE}/urun/${p.slug}`, ...(p.image ? { image: abs(p.image.url) } : {}) })

export function newsMeta(n: News): Meta {
  return {
    title: n.seo.title, description: n.seo.description, path: n.path, image: abs(n.seo.image?.url || n.cover?.url), type: 'article', noindex: n.seo.noindex, canonical: n.seo.canonical, published: n.publishedAt, modified: n.updatedAt,
    jsonld: [
      { '@type': 'NewsArticle', headline: n.title, description: n.spot, image: [abs(n.cover?.url)], datePublished: n.publishedAt, dateModified: n.updatedAt || n.publishedAt, author: [person(n.author)], publisher: { '@id': `${SITE}/#org` }, mainEntityOfPage: SITE + n.path, articleSection: n.category.name, inLanguage: 'tr-TR',
        ...(n.products.length ? { about: n.products.map(productLd) } : {}), ...(n.seo.entities?.length ? { mentions: n.seo.entities.map((e) => ({ '@type': 'Thing', name: e })) } : {}), ...(n.shortAnswer ? { abstract: n.shortAnswer } : {}) },
      crumbs([['Ana sayfa', '/'], [n.category.name, `/${n.category.slug}`], [n.title, n.path]]), ...faq(n.seo.faq),
    ],
  }
}
export function reviewMeta(r: Review): Meta {
  return {
    title: r.seo.title, description: r.seo.description, path: r.path, image: abs(r.seo.image?.url || r.cover?.url), type: 'article', noindex: r.seo.noindex, published: r.publishedAt, modified: r.updatedAt,
    jsonld: [
      { '@type': 'Review', name: r.title, reviewBody: r.shortAnswer || r.spot, datePublished: r.publishedAt, author: person(r.author), publisher: { '@id': `${SITE}/#org` }, itemReviewed: productLd(r.product), reviewRating: { '@type': 'Rating', ratingValue: r.score, bestRating: 20, worstRating: 0 },
        ...(r.pros.length ? { positiveNotes: { '@type': 'ItemList', itemListElement: r.pros.map((name, i) => ({ '@type': 'ListItem', position: i + 1, name })) } } : {}),
        ...(r.cons.length ? { negativeNotes: { '@type': 'ItemList', itemListElement: r.cons.map((name, i) => ({ '@type': 'ListItem', position: i + 1, name })) } } : {}) },
      crumbs([['Ana sayfa', '/'], ['İncelemeler', '/inceleme'], [r.title, r.path]]), ...faq(r.seo.faq),
    ],
  }
}
export function comparisonMeta(c: Comparison): Meta {
  return {
    title: c.seo.title, description: c.seo.description, path: c.path, image: abs(c.seo.image?.url || c.cover?.url), type: 'article', published: c.publishedAt,
    jsonld: [
      { '@type': 'Article', headline: c.title, description: c.spot, datePublished: c.publishedAt, author: person(c.author), publisher: { '@id': `${SITE}/#org` }, about: [productLd(c.a), productLd(c.b)], ...(c.shortAnswer ? { abstract: c.shortAnswer } : {}) },
      { '@type': 'ItemList', name: c.title, itemListElement: [c.a, c.b].map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: productLd(p) })) },
      crumbs([['Ana sayfa', '/'], ['Karşılaştırma', '/karsilastirma'], [c.title, c.path]]), ...faq(c.seo.faq),
    ],
  }
}
export function productMeta(p: Product): Meta {
  const known = (p.specs || []).filter((s) => s.value)
  const best = p.reviews[0]
  return {
    title: p.seo.title, description: p.seo.description, path: p.path, image: abs(p.image?.url),
    jsonld: [
      { ...productLd(p), description: p.blurb, ...(known.length ? { additionalProperty: known.map((s) => ({ '@type': 'PropertyValue', name: s.key, value: s.value })) } : {}),
        ...(best ? { review: { '@type': 'Review', author: person(best.author), reviewRating: { '@type': 'Rating', ratingValue: best.score, bestRating: 20 }, url: SITE + best.path } } : {}),
        subjectOf: p.news.slice(0, 10).map((n) => ({ '@type': 'NewsArticle', headline: n.title, url: SITE + n.path })) },
      crumbs([['Ana sayfa', '/'], ['Künye', '/urun'], [p.name, p.path]]),
    ],
  }
}
export const listMeta = (title: string, description: string, path: string, items: { path: string; title: string }[] = []): Meta => ({
  title, description, path,
  jsonld: items.length ? [{ '@type': 'ItemList', itemListElement: items.slice(0, 20).map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + x.path, name: x.title })) }] : [],
})
export const abs_ = abs
