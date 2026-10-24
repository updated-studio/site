import { randomBytes } from 'node:crypto'
import type { AuthStrategyFunction, Payload } from 'payload'

/**
 * Stüdyo girişi (tek giriş temeli): Stüdyo isteğe "Authorization: Studyo <Supabase oturum anahtarı>" ekler.
 * Anahtar aynı sunucudaki Supabase Auth'a sorulur; dönen e-posta paneldeki kullanıcıyla eşleşirse istek o kullanıcı olarak çalışır,
 * yani panelin bütün yetki kuralları (rol, yayın onayı, kontrol listesi) aynen geçerlidir.
 * Tek giriş (24 Ekim 2026): kişinin adı ve site rolü Stüdyo'dan gelir (Ekip → Yönetim; veritabanında public.site_uyesi).
 * Panel hesabı yoksa o rolle açılır, rol/ad değiştiyse güncellenir; site rolü "yok" olan ya da Stüdyo'dan çıkarılan kişi girmez.
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

const ESITLENDI = new Map<string, number>()

/** Stüdyo'daki kişiyi panel hesabıyla eşitler; sitede yetkisi yoksa null. Aynı kişi için dakikada en fazla bir kez yazar. */
export async function studyoUyesi(payload: Payload, eposta: string) {
  const sorgu = await (payload.db as unknown as { pool: { query: (q: string, v: unknown[]) => Promise<{ rows: { ad: string; site_rol: string }[] }> } })
    .pool.query('select ad, site_rol from public.site_uyesi($1)', [eposta]).catch(() => null)
  const uye = sorgu?.rows[0]
  if (!uye || uye.site_rol === 'yok') return null
  const bul = () => payload.find({ collection: 'users', where: { email: { equals: eposta } }, limit: 1, depth: 0, overrideAccess: true }).then((r) => r.docs[0])
  let u = await bul()
  const simdi = Date.now()
  if (!u) {
    // Şifre rastgele: kişi panele şifreyle değil Stüdyo girişiyle girer
    u = await payload.create({ collection: 'users', data: { email: eposta, name: uye.ad, role: uye.site_rol as never, password: randomBytes(24).toString('hex') }, overrideAccess: true })
      .catch(async () => bul()) // aynı anda iki istek: diğeri açmıştır
    if (!u) return null
  } else if ((u.role !== uye.site_rol || u.name !== uye.ad) && (ESITLENDI.get(eposta) ?? 0) < simdi - 60_000) {
    u = await payload.update({ collection: 'users', id: u.id, data: { role: uye.site_rol as never, name: uye.ad }, overrideAccess: true })
  }
  ESITLENDI.set(eposta, simdi)
  return u
}

const authenticate: AuthStrategyFunction = async ({ headers, payload }) => {
  const m = /^Studyo\s+(\S+)$/.exec(headers.get('authorization') || '')
  if (!m) return { user: null }
  const eposta = await studyoEposta(m[1])
  if (!eposta) return { user: null }
  const u = await studyoUyesi(payload, eposta)
  return { user: u ? { ...u, collection: 'users', _strategy: 'studyo' } : null }
}

export { studyoEposta }
export const studyoStrategy = { name: 'studyo', authenticate }
