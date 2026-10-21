import type { Field } from 'payload'
import { LIMIT } from '../lib/kit'

const counter = (max: number) => (v: unknown) =>
  !v || String(v).length <= max || `En fazla ${max} karakter (şu an ${String(v).length}).`

/** SEO + GEO alanları. Boş bırakılan her alan kayıtta otomatik doldurulur (hooks/autoSeo). */
export const seoFields: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO · GEO (otomatik)',
  admin: { description: 'Boş bırakın; başlık, spot ve kapaktan otomatik üretilir. Elle yazılan değer korunur.' },
  fields: [
    { name: 'title', type: 'text', label: 'SEO başlığı', validate: counter(LIMIT.seoTitle), admin: { description: `≤${LIMIT.seoTitle} karakter` } },
    { name: 'description', type: 'textarea', label: 'Açıklama', validate: counter(LIMIT.spot), admin: { description: `≤${LIMIT.spot} karakter` } },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Paylaşım görseli (1200×630)', admin: { description: 'Boşsa kapak kullanılır.' } },
    { name: 'canonical', type: 'text', label: 'Canonical (yalnız farklıysa)' },
    { name: 'noindex', type: 'checkbox', label: 'Arama motorlarından gizle', defaultValue: false },
    {
      name: 'geo',
      type: 'group',
      label: 'GEO · yapay zekâ yanıtları',
      fields: [
        { name: 'entities', type: 'text', hasMany: true, label: 'Varlıklar (marka, ürün, kişi)' },
        {
          name: 'faq',
          type: 'array',
          label: 'Soru-cevap (FAQPage)',
          maxRows: 5,
          fields: [
            { name: 'q', type: 'text', label: 'Soru', required: true },
            { name: 'a', type: 'textarea', label: 'Cevap', required: true },
          ],
        },
      ],
    },
  ],
}
