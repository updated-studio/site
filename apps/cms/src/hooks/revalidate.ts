import type { CollectionAfterChangeHook } from 'payload'

/**
 * Site statik (Natro). Yayındaki içerik değişince GitHub Actions'taki "yayin" iş akışı tetiklenir:
 * site yeniden derlenir, değişen dosyalar FTP ile Natro'ya yüklenir, sonra IndexNow'a bildirilir.
 * Peş peşe yayınlar tek derlemede toplanır (iş akışında concurrency: bekleyen tek derleme kalır).
 */
export async function purge(paths: string[], reason = 'icerik') {
  const repo = process.env.GITHUB_REPO, token = process.env.GITHUB_DISPATCH_TOKEN
  if (!repo || !token) return
  await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    body: JSON.stringify({ event_type: 'yayin', client_payload: { reason, paths: paths.slice(0, 50) } }),
  }).catch(() => {})
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
