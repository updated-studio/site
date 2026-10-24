import type { AuthStrategyFunction } from 'payload'

/**
 * Stüdyo girişi (tek giriş temeli): Stüdyo isteğe "Authorization: Studyo <Supabase oturum anahtarı>" ekler.
 * Anahtar aynı sunucudaki Supabase Auth'a sorulur; dönen e-posta paneldeki kullanıcıyla eşleşirse istek o kullanıcı olarak çalışır,
 * yani panelin bütün yetki kuralları (rol, yayın onayı, kontrol listesi) aynen geçerlidir. Panel hesabı olmayan Stüdyo üyesi girmez.
 * Ortam: STUDYO_AUTH_URL (ör. http://127.0.0.1:8000/auth/v1/user), STUDYO_ANON_KEY (Supabase açık anahtarı).
 */
const ONBELLEK = new Map<string, { eposta: string | null; bitis: number }>()

/** Başlığa yalnız anahtarın kendi karakterleri girer (satır sonu vb. ile başlık enjeksiyonu olmasın). */
const temiz = (s: string) => s.replace(/[^A-Za-z0-9._-]/g, '')

async function studyoEposta(anahtar: string): Promise<string | null> {
  const simdi = Date.now()
  const k = ONBELLEK.get(anahtar)
  if (k && k.bitis > simdi) return k.eposta
  const url = process.env.STUDYO_AUTH_URL, anon = process.env.STUDYO_ANON_KEY
  if (!url || !anon) return null
  const r = await fetch(url, { headers: { apikey: anon, Authorization: `Bearer ${temiz(anahtar)}` } }).catch(() => null)
  const eposta = r?.ok ? ((await r.json()) as { email?: string }).email?.toLowerCase() ?? null : null
  if (ONBELLEK.size > 500) ONBELLEK.clear()
  ONBELLEK.set(anahtar, { eposta, bitis: simdi + 60_000 })
  return eposta
}

const authenticate: AuthStrategyFunction = async ({ headers, payload }) => {
  const m = /^Studyo\s+(\S+)$/.exec(headers.get('authorization') || '')
  if (!m) return { user: null }
  const eposta = await studyoEposta(m[1])
  if (!eposta) return { user: null }
  const r = await payload.find({ collection: 'users', where: { email: { equals: eposta } }, limit: 1, depth: 0, overrideAccess: true })
  const u = r.docs[0]
  return { user: u ? { ...u, collection: 'users', _strategy: 'studyo' } : null }
}

export const studyoStrategy = { name: 'studyo', authenticate }
