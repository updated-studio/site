import type { CollectionBeforeChangeHook } from 'payload'
import { cut, lexicalText } from '../lib/slug'
import { LIMIT } from '../lib/kit'

/** Boş SEO alanlarını doldurur ve okuma süresini hesaplar. Elle yazılanlara dokunmaz. */
export const autoSeo =
  (opts: { title?: (d: any) => string; desc?: (d: any) => string; entities?: (d: any) => string[] } = {}): CollectionBeforeChangeHook =>
  ({ data }) => {
    const seo = (data.seo ||= {})
    const title = opts.title ? opts.title(data) : data.title
    const desc = opts.desc ? opts.desc(data) : data.spot || lexicalText(data.body).slice(0, 300)
    if (!seo.title && title) seo.title = cut(title, LIMIT.seoTitle)
    if (!seo.description && desc) seo.description = cut(desc, LIMIT.spot)
    if (!seo.image && data.cover) seo.image = data.cover
    seo.geo ||= {}
    if ((!seo.geo.entities || !seo.geo.entities.length) && opts.entities) seo.geo.entities = opts.entities(data).filter(Boolean)
    if (data.body) {
      const words = lexicalText(data.body).split(/\s+/).filter(Boolean).length
      data.readingTime = Math.max(1, Math.round(words / 200))
    }
    return data
  }
