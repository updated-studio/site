import type { CollectionConfig } from 'payload'
import { editorsUp } from '../access/roles'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { autoSeo } from '../hooks/autoSeo'
import { revalidate } from '../hooks/revalidate'

/**
 * KÜNYE — ürün veritabanı. Her değer kaynağı ve tarihiyle tutulur (üretici beyanı, Updated ölçümü, sızıntı…).
 * Haber/inceleme/kıyas bu kayda bağlanır; ürün sayfası join alanlarıyla hepsini listeler.
 * İçe aktarma (PDF/Excel/JSON) ve çakışma çözümü Stüdyo'da yapılır, sonuç buraya yazılır.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Ürün (künye)', plural: 'Ürünler (künye)' },
  admin: { useAsTitle: 'name', group: 'Künye', defaultColumns: ['name', 'brand', 'type', 'status', 'certainty'], listSearchableFields: ['name', 'brand'] },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  fields: [
    { type: 'row', fields: [{ name: 'name', type: 'text', label: 'Ürün adı', required: true }, { name: 'brand', type: 'text', label: 'Marka', required: true }] },
    slugField('name'),
    {
      type: 'row', fields: [
        { name: 'type', type: 'select', label: 'Tür (söküm çizimi)', required: true, options: [
          { label: 'Telefon', value: 'phone' }, { label: 'Dron', value: 'drone' }, { label: '360/aksiyon kamera', value: 'cam360' }, { label: 'Kamera', value: 'camera' },
          { label: 'Kumanda/konsol', value: 'pad' }, { label: 'Ses', value: 'audio' }, { label: 'Bilgisayar', value: 'laptop' }, { label: 'Diğer', value: 'other' } ] },
        { name: 'category', type: 'relationship', relationTo: 'categories', label: 'Kategori' },
      ],
    },
    {
      type: 'row', fields: [
        { name: 'status', type: 'select', label: 'Durum', defaultValue: 'satista', options: [
          { label: 'Söylenti', value: 'soylenti' }, { label: 'Sızıntı', value: 'sizinti' }, { label: 'Test kaydı', value: 'test' }, { label: 'Takvimde', value: 'takvim' },
          { label: 'Duyuruldu', value: 'duyuruldu' }, { label: 'Satışta', value: 'satista' }, { label: 'Satıştan kalktı', value: 'eol' } ] },
        { name: 'certainty', type: 'number', label: 'Kesinlik (1–4)', min: 1, max: 4, defaultValue: 4 },
        { name: 'releaseWhen', type: 'text', label: 'Çıkış (radar)', admin: { description: 'Ör. Ekim ortası · 2027' } },
        { name: 'onRadar', type: 'checkbox', label: 'Çıkış radarında', defaultValue: false },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Ürün görseli' },
    { name: 'blurb', type: 'textarea', label: 'Tek cümle tanım' },
    {
      name: 'specs', type: 'array', label: 'Teknik özellikler (kaynaklı)',
      admin: { description: 'Bilinmeyen değer boş bırakılır; uydurulmaz. Çakışan değerler Stüdyo’da QC onayına düşer.', initCollapsed: false },
      fields: [
        { type: 'row', fields: [
          { name: 'key', type: 'text', label: 'Özellik', required: true },
          { name: 'value', type: 'text', label: 'Değer' },
          { name: 'num', type: 'number', label: 'Sayısal (kıyas grafiği)' },
          { name: 'unit', type: 'text', label: 'Birim' },
        ] },
        { type: 'row', fields: [
          { name: 'source', type: 'select', label: 'Kaynak', defaultValue: 'uretici', options: [
            { label: 'Üretici beyanı', value: 'uretici' }, { label: 'Updated ölçümü', value: 'olcum' }, { label: 'Test kaydı (Geekbench vb.)', value: 'test' },
            { label: 'Sızıntı', value: 'sizinti' }, { label: 'Takvim', value: 'takvim' }, { label: 'Diğer yayın', value: 'diger' } ] },
          { name: 'sourceUrl', type: 'text', label: 'Kaynak bağlantısı' },
          { name: 'at', type: 'date', label: 'Tarih' },
          { name: 'group', type: 'text', label: 'Grup (Video, Gövde…)' },
          { name: 'higherIsBetter', type: 'checkbox', label: 'Büyük olan iyi', defaultValue: true },
          { name: 'searchWeight', type: 'number', label: 'Aranma önemi (1–5)', min: 1, max: 5, defaultValue: 3 },
        ] },
      ],
    },
    { name: 'parts', type: 'array', label: 'Söküm katmanları', maxRows: 6, fields: [{ name: 'name', type: 'text', label: 'Parça', required: true }, { name: 'value', type: 'text', label: 'Özellik' }] },
    { name: 'rivals', type: 'relationship', relationTo: 'products', hasMany: true, label: 'Rakipler' },
    { name: 'news', type: 'join', collection: 'news', on: 'products', label: 'Bu ürünle ilgili haberler' },
    { name: 'reviews', type: 'join', collection: 'reviews', on: 'product', label: 'İncelemeler' },
    { name: 'legacy', type: 'checkbox', label: 'WordPress taşımasından · QC bekliyor', defaultValue: false, admin: { position: 'sidebar' } },
    seoFields,
    { name: 'path', type: 'text', admin: { position: 'sidebar', readOnly: true } },
  ],
  hooks: {
    beforeChange: [autoSeo({ title: (d) => `${d.name} künyesi: özellikler ve haberler`, desc: (d) => d.blurb || `${d.name} için kaynaklı teknik veriler, ilgili haberler ve incelemeler.`, entities: (d) => [d.brand, d.name] }), ({ data }) => { if (data.slug) data.path = `/urun/${data.slug}`; return data }],
    afterChange: [revalidate((d) => [d.path].filter(Boolean))],
  },
}
