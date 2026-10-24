import type { SanitizedConfig } from 'payload'

/**
 * Panelin alan yapısını Stüdyo'ya bildirilebilir (JSON) hâle getirir: Stüdyo Site modülü formlarını buradan kurar,
 * panele eklenen alan Stüdyo'da kendiliğinden görünür. İşlevler (koşul, doğrulama) gönderilmez; koşullu alan "kosullu" diye işaretlenir.
 */
type Alan = Record<string, unknown>

const metin = (x: unknown): string | undefined =>
  typeof x === 'string' ? x : x && typeof x === 'object' ? ((x as Record<string, string>).tr ?? (x as Record<string, string>).en) : undefined

function alanYap(f: any): Alan | null {
  if (!f || f.type === 'ui' || f.type === 'join' || f.admin?.hidden || f.hidden) return null
  const a: Alan = { type: f.type }
  if (f.name) a.name = f.name
  const etiket = metin(f.label)
  if (etiket) a.label = etiket
  if (f.required) a.required = true
  if (f.hasMany) a.hasMany = true
  if (f.unique) a.unique = true
  if (f.relationTo) a.relationTo = f.relationTo
  if (f.options) a.options = f.options.map((o: any) => (typeof o === 'string' ? { label: o, value: o } : { label: metin(o.label) ?? o.value, value: o.value }))
  for (const k of ['min', 'max', 'minRows', 'maxRows', 'maxLength'] as const) if (typeof f[k] === 'number') a[k] = f[k]
  if (['string', 'number', 'boolean'].includes(typeof f.defaultValue)) a.defaultValue = f.defaultValue
  const ad = f.admin ?? {}
  const yon: Alan = {}
  if (metin(ad.description)) yon.description = metin(ad.description)
  if (ad.readOnly) yon.readOnly = true
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

export function semaYap(config: SanitizedConfig) {
  const koleksiyonlar = config.collections
    .filter((c) => !c.slug.startsWith('payload-') && !c.admin?.hidden)
    .map((c) => ({
      slug: c.slug,
      tekil: metin(c.labels?.singular) ?? c.slug,
      cogul: metin(c.labels?.plural) ?? c.slug,
      grup: metin(c.admin?.group as unknown) ?? 'Diğer',
      baslikAlani: c.admin?.useAsTitle ?? 'id',
      sutunlar: c.admin?.defaultColumns ?? [],
      gorsel: !!c.upload,
      taslak: !!(c.versions && typeof c.versions === 'object' && c.versions.drafts),
      giris: !!c.auth,
      fields: c.fields.map(alanYap).filter(Boolean),
    }))
  const genel = config.globals.map((g) => ({
    slug: g.slug,
    ad: metin(g.label) ?? g.slug,
    grup: metin(g.admin?.group as unknown) ?? 'Ayarlar',
    taslak: !!(g.versions && typeof g.versions === 'object' && g.versions.drafts),
    fields: g.fields.map(alanYap).filter(Boolean),
  }))
  return { koleksiyonlar, genel }
}
