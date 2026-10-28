import type { CollectionConfig } from 'payload'
import { editorsUp, publishedOrStaff } from '../access/roles'
import { seoFields } from '../fields/seo'
import { authorField, coverField, pathField, publishedAt, shortAnswer, workflow } from '../fields/editorial'
import { autoSeo } from '../hooks/autoSeo'
import { workflowGuard } from '../hooks/workflow'
import { imzaYayinlayana } from '../hooks/imza'
import { revalidate } from '../hooks/revalidate'
import { trSlug } from '../lib/slug'

/** Karşılaştırma: tablo künyelerden üretilir. Adres alfabetik: /karsilastirma/a-vs-b (ters sıra 301). */
export const Comparisons: CollectionConfig = {
  slug: 'comparisons',
  labels: { singular: 'Karşılaştırma', plural: 'Karşılaştırmalar' },
  admin: { useAsTitle: 'title', group: 'İçerik', preview: (doc) => `${process.env.WEB_URL}/onizleme?tur=karsilastirma&id=${doc.id}&k=${process.env.PREVIEW_SECRET || ''}` },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrStaff, create: editorsUp, update: editorsUp, delete: editorsUp },
  fields: [
    { name: 'title', type: 'text', label: 'Başlık', required: true },
    { type: 'row', fields: [{ name: 'a', type: 'relationship', relationTo: 'products', label: 'Ürün A', required: true }, { name: 'b', type: 'relationship', relationTo: 'products', label: 'Ürün B', required: true }] },
    { name: 'spot', type: 'textarea', label: 'Spot', required: true },
    shortAnswer,
    {
      name: 'keyDiffs', type: 'array', label: 'Can alıcı farklar (en çok 3)', maxRows: 3,
      admin: { description: 'Boş bırakılırsa aranma önemi × fark büyüklüğüne göre otomatik seçilir.' },
      fields: [{ type: 'row', fields: [{ name: 'big', type: 'text', label: 'Büyük değer (%67, 1″, +5 m)', required: true }, { name: 'label', type: 'text', label: 'Açıklama', required: true }, { name: 'winner', type: 'select', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }], label: 'Önde' }] }],
    },
    { name: 'whoFor', type: 'group', label: 'Kime hangisi', fields: [{ name: 'a', type: 'textarea', label: 'A al, eğer…' }, { name: 'b', type: 'textarea', label: 'B al, eğer…' }] },
    { name: 'method', type: 'textarea', label: 'Yöntem (aynı koşul)' },
    coverField,
    seoFields,
    { name: 'slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar', readOnly: true } },
    pathField,
    authorField,
    publishedAt,
    workflow,
  ],
  hooks: {
    beforeChange: [
      imzaYayinlayana,
      async ({ data, req }) => {
        const get = async (v: any) => (typeof v === 'object' ? v : await req.payload.findByID({ collection: 'products', id: v, depth: 0, req }))
        if (data.a && data.b) {
          const [A, B] = await Promise.all([get(data.a), get(data.b)])
          const [x, y] = [trSlug(A.name, 6), trSlug(B.name, 6)].sort()
          data.slug = `${x}-vs-${y}`
          data.path = `/karsilastirma/${data.slug}`
        }
        return data
      },
      autoSeo(),
      workflowGuard,
    ],
    afterChange: [revalidate((d) => [d.path].filter(Boolean))],
  },
}
