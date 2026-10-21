import type { GlobalConfig } from 'payload'
import { editorsUp } from '../access/roles'
import { purge } from '../hooks/revalidate'

const reval = [async ({ doc }: any) => { await purge(['/']); return doc }]

/** Site geneli: menü (≤7), kanallar, bülten, kuruluş şeması. */
export const Site: GlobalConfig = {
  slug: 'site',
  label: 'Site ayarları',
  admin: { group: 'Ayarlar' },
  access: { read: () => true, update: editorsUp },
  fields: [
    { name: 'tagline', type: 'text', label: 'Kısa tanım', defaultValue: 'Teknoloji haberleri, incelemeler ve karşılaştırmalar.' },
    {
      name: 'nav', type: 'array', label: 'Üst menü (en fazla 7)', maxRows: 7,
      fields: [{ name: 'label', type: 'text', required: true }, { name: 'href', type: 'text', required: true }],
    },
    { name: 'youtube', type: 'text', defaultValue: 'https://www.youtube.com/@nerdesinfatih' },
    { name: 'instagram', type: 'text', defaultValue: 'https://www.instagram.com/updated.tr/' },
    { name: 'kulupUrl', type: 'text', label: 'Kulüp adresi', defaultValue: '/kulup' },
    { name: 'newsletterNote', type: 'text', defaultValue: 'Haftalık bülten pazartesi 08.30.' },
  ],
  hooks: { afterChange: reval },
}

/** Ana sayfa: manşet düzeni (akordeon/vitrin/akış), manşetler ve modül anahtarları. */
export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Ana sayfa',
  admin: { group: 'Ayarlar' },
  access: { read: () => true, update: editorsUp },
  fields: [
    { name: 'heroLayout', type: 'select', label: 'Manşet düzeni', defaultValue: 'akordeon', options: [{ label: 'Akordeon (elle açılır)', value: 'akordeon' }, { label: 'Vitrin (tek manşet + 2 kart)', value: 'vitrin' }, { label: 'Akış (zaman çizgisi)', value: 'akis' }] },
    { name: 'hero', type: 'relationship', relationTo: ['news', 'reviews', 'comparisons'], hasMany: true, maxRows: 5, label: 'Manşetler (boşsa en yeni ve en yüksek öncelikli)' },
    {
      name: 'modules', type: 'group', label: 'Modüller',
      fields: ['radar', 'kiyasRobotu', 'altmisSaniye', 'kunyeRafi', 'videolar', 'reels', 'cokOkunan'].map((n) => ({ name: n, type: 'checkbox' as const, defaultValue: true })),
    },
    { name: 'mostRead', type: 'relationship', relationTo: 'news', hasMany: true, maxRows: 5, label: 'En çok okunanlar (boşsa analitikten)' },
  ],
  hooks: { afterChange: reval },
}
