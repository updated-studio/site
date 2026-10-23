import type { CollectionAfterChangeHook } from 'payload'
import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Site statik (Natro). Yayındaki içerik değişince aynı sunucudaki yayın sırasına bir istek dosyası bırakılır
 * (deploy/altyapi/site): site yeniden derlenir, değişen dosyalar FTP ile Natro'ya yüklenir. GitHub'a gidilmez.
 * Peş peşe yayınlar tek derlemede toplanır (derleme sürerken gelen istekler bir sonraki derlemeye kalır).
 */
const ISTEK = process.env.SITE_YAYIN_ISTEK || '/var/spool/updated-site'

export async function purge(paths: string[], reason = 'icerik') {
  const ad = `${Date.now()}-${randomBytes(4).toString('hex')}.json`
  await writeFile(join(ISTEK, ad), JSON.stringify({ reason, paths: paths.slice(0, 50) })).catch((e) =>
    console.error(`site yayın isteği yazılamadı (${ISTEK}): ${e.message}`),
  )
}

/** Yayındaki içerik değişince (yayına alma, düzeltme, yayından kaldırma) siteyi yeniden derletir. */
export const revalidate =
  (paths: (doc: any) => string[]): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, context }) => {
    if (context?.migration) return doc // toplu taşımada tek tek derleme yok; taşıma bitince bir kez elle derlenir
    const wasPublic = previousDoc?._status === 'published', isPublic = doc._status === 'published' || doc._status === undefined
    if (!wasPublic && !isPublic) return doc
    await purge(paths(doc))
    return doc
  }
