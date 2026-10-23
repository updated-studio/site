import type { Field } from 'payload'
import { CHECKLIST, LIMIT, STATES } from '../lib/kit'

const max = (n: number) => (v: unknown) => !v || String(v).length <= n || `En fazla ${n} karakter (şu an ${String(v).length}).`

export const titleField: Field = { name: 'title', type: 'text', label: 'Başlık', required: true, validate: max(LIMIT.title), admin: { description: `Kim/ne + ne oldu + neden önemli · ≤${LIMIT.title} karakter` } }
export const spotField: Field = { name: 'spot', type: 'textarea', label: 'Spot', required: true, validate: max(LIMIT.spot), admin: { description: `Tek cümle · ≤${LIMIT.spot} karakter` } }
export const coverField: Field = { name: 'cover', type: 'upload', relationTo: 'media', label: 'Kapak (16:9)', required: true }
export const shortAnswer: Field = { name: 'shortAnswer', type: 'textarea', label: 'Kısa cevap (AEO)', admin: { description: '2–3 cümle; arama ve yapay zekâ yanıtları için sayfanın en üstünde.' } }
export const productsField: Field = { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true, label: 'Künye: bu içerikteki ürünler', admin: { description: 'Seçilen ürünler metinde ve yan sütunda künye etiketi olur; ürün sayfasında bu içerik listelenir.' } }
export const authorField: Field = { name: 'author', type: 'relationship', relationTo: 'authors', label: 'Yazar', required: true, admin: { position: 'sidebar' } }
export const publishedAt: Field = { name: 'publishedAt', type: 'date', label: 'Yayın zamanı', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } }
export const pathField: Field = { name: 'path', type: 'text', label: 'Tam adres', index: true, admin: { position: 'sidebar', readOnly: true } }
export const readingTime: Field = { name: 'readingTime', type: 'number', label: 'Okuma süresi (dk)', admin: { position: 'sidebar', readOnly: true } }

export const sources: Field = {
  name: 'sources', type: 'array', label: 'Kaynaklar', admin: { description: 'Birincil kaynak gösterilir (kit §7).' },
  fields: [
    { name: 'name', type: 'text', label: 'Yayın / kurum', required: true },
    { name: 'url', type: 'text', label: 'Bağlantı' },
    { name: 'primary', type: 'checkbox', label: 'Birincil', defaultValue: false },
  ],
}
export const corrections: Field = {
  name: 'corrections', type: 'array', label: 'Düzeltme notları', admin: { description: 'Hata silinmez; tarih-saatli not eklenir.' },
  fields: [
    { name: 'at', type: 'date', label: 'Zaman', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'note', type: 'text', label: 'Not', required: true },
  ],
}

/** Taslak → inceleme → onay → yayın (kit §14). Triyajdan gelenler "incelemede" başlar. */
export const workflow: Field = {
  name: 'workflow', type: 'group', label: 'Yayın akışı',
  admin: { position: 'sidebar' },
  fields: [
    { name: 'state', type: 'select', label: 'Durum', options: [...STATES], defaultValue: 'taslak', admin: { components: { Cell: '/components/DurumHucre#DurumHucre' } } },
    { name: 'ownerUser', type: 'relationship', relationTo: 'users', label: 'Hazırlayan' },
    { name: 'secondEditor', type: 'relationship', relationTo: 'users', label: 'İkinci editör' },
    { name: 'approvedBy', type: 'relationship', relationTo: 'users', label: 'Onaylayan', admin: { readOnly: true } },
    { name: 'checklist', type: 'group', label: 'Yayın öncesi kontrol', fields: CHECKLIST.map(([k, l]) => ({ name: k, type: 'checkbox' as const, label: l, defaultValue: false })) },
  ],
}

/** Triyaj (Stüdyo · Haber Masası) kaynağı. */
export const triyaj: Field = {
  name: 'triyaj', type: 'group', label: 'Triyaj', admin: { position: 'sidebar', condition: (d) => !!d?.triyaj?.importedAt },
  fields: [
    { name: 'priority', type: 'number', label: 'Öncelik (10 üzerinden)', admin: { readOnly: true } },
    { name: 'cluster', type: 'text', label: 'Olay kümesi', admin: { readOnly: true } },
    { name: 'studioId', type: 'text', label: 'Stüdyo kaydı', index: true, admin: { readOnly: true } },
    { name: 'importedAt', type: 'date', label: 'Aktarım', admin: { readOnly: true } },
  ],
}
