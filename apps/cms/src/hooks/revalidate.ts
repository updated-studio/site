import type { CollectionAfterChangeHook } from 'payload'

const ALWAYS = ['/', '/haberler', '/news-sitemap.xml', '/sitemap.xml', '/rss.xml']

/** Site önbelleğini yeniler (Vercel ISR: x-prerender-revalidate). */
export async function purge(paths: string[]) {
  const web = process.env.WEB_URL, token = process.env.ISR_BYPASS_TOKEN
  if (!web || !token) return
  const list = Array.from(new Set([...paths, ...ALWAYS]))
  await Promise.allSettled(list.map((p) => fetch(web + p, { method: 'HEAD', headers: { 'x-prerender-revalidate': token } })))
}

/** IndexNow (Bing, Yandex). Google bunu kullanmaz; Google için site haritası + Search Console. */
export async function indexNow(paths: string[]) {
  const web = process.env.WEB_URL, key = process.env.INDEXNOW_KEY
  if (!web || !key || !paths.length) return
  await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(web).host, key, keyLocation: `${web}/${key}.txt`, urlList: paths.map((p) => web + p) }),
  }).catch(() => {})
}

/** Yayındaki içerik değişince ilgili adresleri yeniler; yeni yayında IndexNow'a bildirir. */
export const revalidate =
  (paths: (doc: any) => string[]): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, context }) => {
    if (context?.migration) return doc // toplu taşımada tek tek yenileme/ping yok
    const wasPublic = previousDoc?._status === 'published', isPublic = doc._status === 'published' || doc._status === undefined
    if (!wasPublic && !isPublic) return doc
    const p = paths(doc)
    await purge(p)
    if (isPublic && !wasPublic) await indexNow(p)
    return doc
  }
