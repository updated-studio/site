import type { CollectionConfig } from 'payload'
import { editorsUp, publishedOrStaff } from '../access/roles'
import { LABELS } from '../lib/kit'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { authorField, corrections, coverField, pathField, productsField, publishedAt, readingTime, shortAnswer, sources, spotField, titleField, triyaj, workflow } from '../fields/editorial'
import { autoSeo } from '../hooks/autoSeo'
import { workflowGuard } from '../hooks/workflow'
import { imzaYayinlayana } from '../hooks/imza'
import { revalidate } from '../hooks/revalidate'

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Haber', plural: 'Haberler' },
  admin: {
    useAsTitle: 'title', group: 'İçerik',
    defaultColumns: ['title', 'category', 'label', 'workflow.state', 'publishedAt'],
    listSearchableFields: ['title', 'spot'],
    preview: (doc) => `${process.env.WEB_URL}/onizleme?tur=haber&id=${doc.id}&k=${process.env.PREVIEW_SECRET || ''}`,
    livePreview: { url: ({ data }) => `${process.env.WEB_URL}/onizleme?tur=haber&id=${data.id}&k=${process.env.PREVIEW_SECRET || ''}` },
  },
  versions: { drafts: { autosave: { interval: 2000 }, schedulePublish: true }, maxPerDoc: 30 },
  access: { read: publishedOrStaff, create: editorsUp, update: editorsUp, delete: ({ req }) => req.user?.role === 'admin' },
  fields: [
    titleField,
    spotField,
    {
      type: 'row',
      fields: [
        { name: 'category', type: 'relationship', relationTo: 'categories', label: 'Kategori', required: true },
        { name: 'label', type: 'select', label: 'İçerik etiketi', options: [...LABELS], defaultValue: 'yok' },
      ],
    },
    coverField,
    shortAnswer,
    { name: 'body', type: 'richText', label: 'Metin', required: true },
    {
      type: 'collapsible', label: 'Sızıntı: bilinenler / bilinmeyenler', admin: { condition: (d) => d?.label === 'sizinti', initCollapsed: false },
      fields: [
        { name: 'knowns', type: 'text', hasMany: true, label: 'Bilinenler' },
        { name: 'unknowns', type: 'text', hasMany: true, label: 'Bilinmeyenler' },
        { name: 'certainty', type: 'select', label: 'Kesinlik', options: [{ label: '▮ Söylenti', value: '1' }, { label: '▮▮ Sızıntı', value: '2' }, { label: '▮▮▮ Test/takvim', value: '3' }, { label: '▮▮▮▮ Resmî', value: '4' }] },
      ],
    },
    // "En iyi …" listesi (31 Ekim 2026, rakip analizi öneri 1): rehber yazısında sıralı ürünler; sitede künye kartı, puan ve "hepsini kıyasla"
    {
      name: 'liste', type: 'array', label: 'Rehber listesi (en iyi …)', maxRows: 10, labels: { singular: 'Sıra', plural: 'Sıralar' },
      admin: { condition: (d) => d?.label === 'rehber', description: 'Sırayla ürünleri ekle; ilk sıra "Editörün seçimi" olur. Künye kartı, puan ve kıyas bağlantısı kendiliğinden gelir.' },
      fields: [
        { name: 'urun', type: 'relationship', relationTo: 'products', label: 'Ürün', required: true },
        { type: 'row', fields: [
          { name: 'baslik', type: 'text', label: 'Kime / neden', maxLength: 40, admin: { description: 'ör. En iyi bütçe seçeneği' } },
          { name: 'gerekce', type: 'textarea', label: 'Kısa gerekçe', maxLength: 300 },
        ] },
      ],
    },
    productsField,
    sources,
    corrections,
    seoFields,
    slugField(),
    pathField,
    authorField,
    publishedAt,
    readingTime,
    workflow,
    triyaj,
    { name: 'wpId', type: 'number', admin: { position: 'sidebar', readOnly: true, condition: (d) => !!d?.wpId } },
  ],
  hooks: {
    beforeChange: [
      autoSeo(),
      workflowGuard,
      imzaYayinlayana,
      async ({ data, req }) => {
        if (data.category && data.slug) {
          const id = typeof data.category === 'object' ? data.category.id : data.category
          const cat = await req.payload.findByID({ collection: 'categories', id, depth: 0, req })
          data.path = `/${cat.slug}/${data.slug}`
        }
        return data
      },
    ],
    afterChange: [revalidate((d) => [d.path].filter(Boolean))],
  },
}
