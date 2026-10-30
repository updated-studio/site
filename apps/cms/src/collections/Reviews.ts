import type { CollectionConfig } from 'payload'
import { editorsUp, publishedOrStaff } from '../access/roles'
import { LIMIT } from '../lib/kit'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { authorField, corrections, coverField, pathField, publishedAt, readingTime, shortAnswer, sources, spotField, titleField, workflow } from '../fields/editorial'
import { autoSeo } from '../hooks/autoSeo'
import { workflowGuard } from '../hooks/workflow'
import { imzaYayinlayana } from '../hooks/imza'
import { revalidate } from '../hooks/revalidate'

/** WordPress'ten taşınan eski incelemelerde bu bilgiler yoksa boş kalabilir; yenilerde zorunlu. */
const legacyOk = (v: unknown, { data }: any) => v != null && v !== '' ? true : data?.wpId ? true : 'Zorunlu alan.'
const short = (v: unknown) => !v || String(v).trim().split(/\s+/).length <= LIMIT.proWords || `En fazla ${LIMIT.proWords} kelime.`

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'İnceleme', plural: 'İncelemeler' },
  admin: { useAsTitle: 'title', group: 'İçerik', defaultColumns: ['title', 'product', 'score', 'workflow.state'], preview: (doc) => `${process.env.WEB_URL}/onizleme?tur=inceleme&id=${doc.id}&k=${process.env.PREVIEW_SECRET || ''}` },
  versions: { drafts: { autosave: { interval: 2000 }, schedulePublish: true }, maxPerDoc: 30 },
  access: { read: publishedOrStaff, create: editorsUp, update: editorsUp, delete: ({ req }) => req.user?.role === 'admin' },
  fields: [
    titleField,
    spotField,
    { name: 'product', type: 'relationship', relationTo: 'products', label: 'İncelenen ürün (künye)', required: true },
    coverField,
    shortAnswer,
    { name: 'body', type: 'richText', label: 'Metin', required: true },
    {
      type: 'group', name: 'scoreBox', label: 'Puan kutusu (kit: /20, tam sayı)',
      fields: [
        { name: 'score', type: 'number', label: 'Puan /20', min: 0, max: 20, required: true, admin: { step: 1 } },
        { name: 'pros', type: 'text', hasMany: true, label: 'Artılar (≤3, ≤6 kelime)', maxRows: LIMIT.pros, validate: (v: unknown) => !Array.isArray(v) || v.every((x) => short(x) === true) || 'Her madde en fazla 6 kelime.' },
        { name: 'cons', type: 'text', hasMany: true, label: 'Eksiler (≤3, ≤6 kelime)', maxRows: LIMIT.pros, validate: (v: unknown) => !Array.isArray(v) || v.every((x) => short(x) === true) || 'Her madde en fazla 6 kelime.' },
        { name: 'usageDays', type: 'number', label: 'Kullanım süresi (gün)', min: 1, validate: legacyOk },
        { name: 'deviceSource', type: 'text', label: 'Cihazın kaynağı', validate: legacyOk, admin: { description: 'Ör. Cihaz Google Türkiye’den · Kendi satın alımımız' } },
        { name: 'who', type: 'group', label: 'Kime göre', fields: [{ name: 'for', type: 'text', hasMany: true, label: 'Uygun' }, { name: 'notFor', type: 'text', hasMany: true, label: 'Uygun değil' }] },
        // Alt puanlar (30 Ekim 2026, kullanıcı onayı, inceleme şablonu): puan kartında çubuk olarak; toplam puan yine elle girilir
        {
          name: 'altPuanlar', type: 'array', label: 'Alt puanlar (/20, en fazla 6)', maxRows: 6, labels: { singular: 'Alt puan', plural: 'Alt puanlar' },
          admin: { description: 'Puan kartında çubuk olarak görünür. Ör. Görüntü 17, Pil 12.' },
          fields: [{ type: 'row', fields: [
            { name: 'baslik', type: 'select', label: 'Başlık', required: true, options: ['Görüntü', 'Video', 'Ses', 'Pil', 'Ekran', 'Performans', 'Kullanım', 'Taşınabilirlik', 'Yapı kalitesi', 'Yazılım', 'Fiyat / performans'].map((v) => ({ label: v, value: v })) },
            { name: 'puan', type: 'number', label: 'Puan /20', required: true, min: 0, max: 20, admin: { step: 1 } },
          ] }],
        },
      ],
    },
    { name: 'method', type: 'richText', label: 'Yöntem (puan kutusundan sonra)' },
    { name: 'video', type: 'relationship', relationTo: 'videos', label: 'Videolu inceleme' },
    // Video bölümleri (30 Ekim 2026): oynatıcının altında atlama düğmeleri ("03:10 Görüntü")
    {
      name: 'videoBolumleri', type: 'array', label: 'Video bölümleri', maxRows: 12, labels: { singular: 'Bölüm', plural: 'Bölümler' },
      admin: { description: 'Videoda atlanacak yerler. Zaman dakika:saniye (ör. 03:10).', condition: (d) => !!d?.video },
      fields: [{ type: 'row', fields: [
        { name: 'zaman', type: 'text', label: 'Zaman', required: true, validate: (v: unknown) => /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(String(v ?? '')) || 'dakika:saniye (ör. 03:10)' },
        { name: 'ad', type: 'text', label: 'Bölüm', required: true, maxLength: 40 },
      ] }],
    },
    sources,
    corrections,
    seoFields,
    slugField(),
    pathField,
    authorField,
    publishedAt,
    readingTime,
    workflow,
    { name: 'wpId', type: 'number', admin: { position: 'sidebar', readOnly: true, condition: (d) => !!d?.wpId } },
  ],
  hooks: {
    beforeChange: [autoSeo(), workflowGuard, imzaYayinlayana, ({ data }) => { if (data.slug) data.path = `/inceleme/${data.slug}`; return data }],
    afterChange: [revalidate((d) => [d.path, '/inceleme'].filter(Boolean))],
  },
}
