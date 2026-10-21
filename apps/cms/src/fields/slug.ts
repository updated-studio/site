import type { Field } from 'payload'
import { trSlug } from '../lib/slug'

/** Adres parçası: başlıktan üretilir, yayınlandıktan sonra değişmez (kit 10b: başlık değişse de URL sabit). */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  label: 'Adres',
  admin: { position: 'sidebar', description: 'Başlıktan otomatik. Yayından sonra değişmez.' },
  hooks: {
    beforeValidate: [
      ({ value, data, originalDoc }) => {
        if (originalDoc?._status === 'published' && originalDoc?.slug) return originalDoc.slug
        if (value) return trSlug(value, 12)
        return data?.[from] ? trSlug(String(data[from])) : value
      },
    ],
  },
})
