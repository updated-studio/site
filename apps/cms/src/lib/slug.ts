const MAP: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }

/** "Samsung'un 2027 katlanabilir ailesi sızdı: …" → "samsungun-2027-katlanabilir-ailesi-sizdi" (en fazla 7 kelime). */
export const trSlug = (s: string, words = 7): string =>
  s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (c) => MAP[c] ?? c)
    .replace(/['’]/g, '')
    .split(':')[0]
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, words)
    .join('-')

/** Karakter sınırında, kelime ortasından kesmeden kısaltır. */
export const cut = (s: string, n: number): string => {
  const t = (s || '').trim()
  if (t.length <= n) return t
  const i = t.lastIndexOf(' ', n - 1)
  return t.slice(0, i > 20 ? i : n).replace(/[,:;.\s]+$/, '')
}

/** Lexical JSON içinden düz metin (okuma süresi, açıklama için). */
export const lexicalText = (node: any): string => {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  const kids = node.root?.children ?? node.children ?? []
  return kids.map(lexicalText).join(' ')
}
