import type { CollectionConfig } from 'payload'
import { editorsUp } from '../access/roles'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { autoSeo } from '../hooks/autoSeo'
import { revalidate } from '../hooks/revalidate'
import { sablonSatirlari } from '../lib/urunSablon'

/** Marka + ad (ad markayla başlıyorsa tekrarlanmaz): "Sony A7 IV" */
const tamAd = (d: any) => (d.brand && !String(d.name || '').toLocaleLowerCase('tr-TR').startsWith(String(d.brand).toLocaleLowerCase('tr-TR')) ? `${d.brand} ${d.name}` : d.name)

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
        { name: 'type', type: 'select', label: 'Tür', required: true, admin: { description: 'Teknik özellik şablonunu belirler (lib/urunSablon.ts); özellik listesi boşken tür seçilince şablon dolar.' }, options: [
          { label: 'Kamera', value: 'camera' }, { label: 'Lens', value: 'lens' }, { label: 'Dron', value: 'drone' }, { label: '360/aksiyon kamera', value: 'cam360' }, { label: 'Telefon', value: 'phone' },
          { label: 'Gimbal', value: 'gimbal' }, { label: 'Işık', value: 'light' }, { label: 'Mikrofon', value: 'mic' }, { label: 'Kulaklık', value: 'headphones' },
          { label: 'Bilgisayar', value: 'laptop' }, { label: 'Tablet', value: 'tablet' }, { label: 'Akıllı saat', value: 'watch' }, { label: 'Kumanda/konsol', value: 'pad' },
          { label: 'Ses (diğer)', value: 'audio' }, { label: 'Aksesuar', value: 'accessory' }, { label: 'Diğer', value: 'other' } ] },
        { name: 'category', type: 'relationship', relationTo: 'categories', label: 'Kategori' },
      ],
    },
    {
      type: 'row', fields: [
        { name: 'status', type: 'select', label: 'Durum', defaultValue: 'satista', options: [
          { label: 'Söylenti', value: 'soylenti' }, { label: 'Sızıntı', value: 'sizinti' }, { label: 'Test kaydı', value: 'test' }, { label: 'Takvimde', value: 'takvim' },
          { label: 'Duyuruldu', value: 'duyuruldu' }, { label: 'Satışta', value: 'satista' }, { label: 'Satıştan kalktı', value: 'eol' } ] },
        { name: 'certainty', type: 'number', label: 'Kesinlik (1–4)', min: 1, max: 4, defaultValue: 4 },
      ],
    },
    // Çıkış radarı (30 Ekim 2026): ana sayfa sağ sütun kutusu. Çıkışı en yakın olan üstte; ürün "Satışta" olunca radardan kendiliğinden düşer.
    {
      type: 'collapsible', label: 'Çıkış radarı', admin: { description: 'Henüz çıkmamış ürün için: kutuyu işaretle, tahmini tarihi gir, Durum alanında söylenti / sızıntı / test / duyuruldu seç.' }, fields: [
        { name: 'onRadar', type: 'checkbox', label: 'Çıkış radarında', defaultValue: false },
        {
          type: 'row', fields: [
            { name: 'releaseDate', type: 'date', label: 'Tahmini çıkış tarihi', admin: { date: { pickerAppearance: 'monthOnly', displayFormat: 'MMMM yyyy' }, description: 'Radar bu tarihe göre sıralanır; ay ve yıl yeterli. Boşsa en alta gider.' } },
            { name: 'releaseWhen', type: 'text', label: 'Çıkış notu', admin: { description: 'İsteğe bağlı, ör. "Ekim ortası", "CES 2027"' } },
          ],
        },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Ürün görseli' },
    { name: 'blurb', type: 'textarea', label: 'Tek cümle tanım' },
    // Kıyaslamalar (27 Ekim 2026): iki ayrı puan. Teknik puan sitede künye değerlerinden kendiliğinden hesaplanır; UPscore editörün notu.
    {
      type: 'row', fields: [
        { name: 'upscore', type: 'number', label: 'UPscore (0–10)', min: 0, max: 10, admin: { step: 0.1, description: 'Cihazı kullanan editörün notu, tek ondalık. Teknik puan ayrıca kendiliğinden hesaplanır.' } },
        { name: 'upscoreReview', type: 'relationship', relationTo: 'reviews', label: 'UPscore incelemesi', admin: { description: 'Notun gerekçesi olan inceleme' } },
        { name: 'amazon', type: 'text', label: 'Amazon ürün kodu (ASIN) ya da bağlantısı', admin: { description: 'Ör. B09JZT6YK5. Boşsa "Amazon\'da gör" ürün adıyla arama açar.' } },
      ],
    },
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
    beforeChange: [autoSeo({ title: (d) => `${tamAd(d)} künyesi: özellikler ve haberler`, desc: (d) => d.blurb || `${tamAd(d)} teknik özellikleri: kaynaklı veriler, ilgili haberler, incelemeler ve karşılaştırmalar.`, entities: (d) => [d.brand, d.name] }), ({ data }) => { if (data.slug) data.path = `/urun/${data.slug}`; return data },
      // Özellik listesi boşsa (yeni ürün ya da tür ilk kez seçildi) türün şablonu dolar; dolu listeye dokunulmaz
      ({ data, originalDoc }) => { const mevcut = data.specs ?? originalDoc?.specs; if (data.type && (!mevcut || !mevcut.length)) data.specs = sablonSatirlari(data.type); return data },
      // Şablona sonradan eklenen özellik (ör. "Boyutlar", 27 Ekim 2026) mevcut ürüne de eklenir; var olan satırlara dokunulmaz
      ({ data, originalDoc }) => {
        const tur = data.type ?? originalDoc?.type, mevcut = data.specs ?? originalDoc?.specs
        if (!tur || !mevcut?.length) return data
        const var_ = new Set(mevcut.map((s: { key: string }) => s.key)), eksik = sablonSatirlari(tur).filter((s) => !var_.has(s.key))
        if (eksik.length) data.specs = [...mevcut, ...eksik]
        return data
      }],
    afterChange: [revalidate((d) => [d.path].filter(Boolean))],
  },
}
