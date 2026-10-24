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
    // Kopyada adres boşalır, başlıktan yeniden (benzersiz) üretilir
    beforeDuplicate: [() => null],
    beforeValidate: [
      async ({ value, data, originalDoc, collection, req }) => {
        if (originalDoc?._status === 'published' && originalDoc?.slug) return originalDoc.slug
        if (value) return trSlug(value, 12)
        if (!data?.[from]) return value
        // Başlıktan üretilen adres başka kayıtta varsa sonuna -2, -3… eklenir (aynı başlıklı iki haber kaydedilebilsin)
        const kok = trSlug(String(data[from]))
        if (!collection) return kok
        for (let i = 1; i < 50; i++) {
          const aday = i === 1 ? kok : `${kok}-${i}`
          const r = await req.payload.find({ collection: collection.slug as never, where: { and: [{ slug: { equals: aday } }, ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])] } as never, limit: 1, depth: 0, overrideAccess: true, req, select: { slug: true } as never })
          if (!r.docs.length) return aday
        }
        return `${kok}-${Date.now().toString(36)}`
      },
    ],
  },
})
