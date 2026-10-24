import type { PayloadRequest, SanitizedConfig } from 'payload'

/**
 * Panelin alan yapısını Stüdyo'ya bildirilebilir (JSON) hâle getirir: Stüdyo Site modülü formlarını buradan kurar,
 * panele eklenen alan Stüdyo'da kendiliğinden görünür. İşlevler (koşul, doğrulama) gönderilmez; koşullu alan "kosullu" diye işaretlenir.
 */
type Alan = Record<string, unknown>

const metin = (x: unknown): string | undefined =>
  typeof x === 'string' ? x : x && typeof x === 'object' ? ((x as Record<string, string>).tr ?? (x as Record<string, string>).en) : undefined

/** Kişinin okuma yetkisi olmayan alan Stüdyo'ya hiç gitmez (ör. Uper e-postası yalnız yöneticiye) */
let istek: PayloadRequest | null = null
const okuyabilir = (erisim: any) => {
  if (!istek || typeof erisim?.read !== 'function') return true
  try { return erisim.read({ req: istek }) !== false } catch { return false }
}

function alanYap(f: any): Alan | null {
  // _status gibi iç alanlar gönderilmez: yayın durumu Stüdyo'da yalnız Yayınla / Yayından kaldır ile değişir
  if (!f || f.type === 'ui' || f.admin?.hidden || f.hidden || String(f.name ?? '').startsWith('_')) return null
  if (!okuyabilir(f.access)) return null
  const a: Alan = { type: f.type }
  if (f.name) a.name = f.name
  const etiket = metin(f.label)
  if (etiket) a.label = etiket
  if (f.required) a.required = true
  if (f.hasMany) a.hasMany = true
  if (f.unique) a.unique = true
  if (f.relationTo) a.relationTo = f.relationTo
  // Ters ilişki (join): kaydedilmez, Stüdyo'da salt okunur liste ("Bu ürünle ilgili haberler")
  if (f.type === 'join') { a.collection = f.collection; a.on = f.on }
  if (f.options) a.options = f.options.map((o: any) => (typeof o === 'string' ? { label: o, value: o } : { label: metin(o.label) ?? o.value, value: o.value }))
  for (const k of ['min', 'max', 'minRows', 'maxRows', 'maxLength'] as const) if (typeof f[k] === 'number') a[k] = f[k]
  if (['string', 'number', 'boolean'].includes(typeof f.defaultValue)) a.defaultValue = f.defaultValue
  const ad = f.admin ?? {}
  const yon: Alan = {}
  if (metin(ad.description)) yon.description = metin(ad.description)
  if (ad.readOnly || f.type === 'join') yon.readOnly = true
  if (ad.position === 'sidebar') yon.position = 'sidebar'
  if (typeof ad.condition === 'function') yon.kosullu = true
  if (ad.date?.pickerAppearance) yon.tarih = ad.date.pickerAppearance
  if (ad.initCollapsed) yon.kapali = true
  if (Object.keys(yon).length) a.admin = yon
  if (f.fields) a.fields = f.fields.map(alanYap).filter(Boolean)
  if (f.tabs) a.tabs = f.tabs.map((t: any) => ({ name: t.name, label: metin(t.label) ?? t.name, fields: t.fields.map(alanYap).filter(Boolean) }))
  if (f.blocks) a.blocks = f.blocks.map((b: any) => ({ slug: b.slug, label: metin(b.labels?.singular) ?? b.slug, fields: b.fields.map(alanYap).filter(Boolean) }))
  return a
}

/** Giriş koleksiyonunun iç alanları Stüdyo formuna girmez: API anahtarı Stüdyo'da ayrı bölümde (üret / kapat), oturumlar panelde */
const GIRIS_IC = new Set(['enableAPIKey', 'apiKey', 'apiKeyIndex', 'hasAPIKey', 'sessions', 'salt', 'hash', 'resetPasswordToken', 'resetPasswordExpiration', 'loginAttempts', 'lockUntil'])
function girisAlanlari(c: any): Alan[] {
  return c.fields.filter((f: any) => !GIRIS_IC.has(f.name)).map((f: any) => {
    const a = alanYap(f)
    // E-posta Stüdyo hesabıyla eşleşmenin anahtarıdır (auth/studyo.ts); değişirse kişi panele bağlanamaz
    if (a && f.name === 'email') a.admin = { ...(a.admin as Alan), readOnly: true, description: "Stüdyo hesabının e-postası; Stüdyo'dan gelir." }
    return a
  }).filter(Boolean)
}

/** Sürüm özellikleri: taslak, sürüm geçmişi, otomatik kayıt (ms), zamanlanmış yayın */
function surumBilgisi(v: any) {
  const d = v && typeof v === 'object' ? v.drafts : null
  return {
    taslak: !!d,
    surumler: !!v,
    otoKayit: d && typeof d === 'object' && d.autosave ? (typeof d.autosave === 'object' && d.autosave.interval) || 2000 : 0,
    zamanlama: !!(d && typeof d === 'object' && d.schedulePublish),
  }
}

/** req verilirse kişinin göremeyeceği bölümler ve alanlar listeden çıkar (Stüdyo'da herkes yalnız yetkisi olanı görür) */
export function semaYap(config: SanitizedConfig, req?: PayloadRequest) {
  istek = req ?? null
  const koleksiyonlar = config.collections
    .filter((c) => !c.slug.startsWith('payload-') && !c.admin?.hidden && okuyabilir(c.access))
    .map((c) => ({
      slug: c.slug,
      tekil: metin(c.labels?.singular) ?? c.slug,
      cogul: metin(c.labels?.plural) ?? c.slug,
      grup: metin(c.admin?.group as unknown) ?? 'Diğer',
      baslikAlani: c.admin?.useAsTitle ?? 'id',
      sutunlar: c.admin?.defaultColumns ?? [],
      gorsel: !!c.upload,
      ...surumBilgisi(c.versions),
      giris: !!c.auth,
      apiAnahtari: !!(c.auth as any)?.useAPIKey,
      kilit: c.lockDocuments !== false,
      fields: c.auth ? girisAlanlari(c) : c.fields.map(alanYap).filter(Boolean),
    }))
  const genel = config.globals.filter((g) => okuyabilir(g.access)).map((g) => ({
    slug: g.slug,
    ad: metin(g.label) ?? g.slug,
    grup: metin(g.admin?.group as unknown) ?? 'Ayarlar',
    ...surumBilgisi(g.versions),
    kilit: g.lockDocuments !== false,
    fields: g.fields.map(alanYap).filter(Boolean),
  }))
  istek = null
  return { koleksiyonlar, genel }
}
