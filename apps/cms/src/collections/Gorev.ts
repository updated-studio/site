import type { CollectionConfig } from 'payload'
import { editorsUp } from '../access/roles'
import { bildirimEkle, puanEkle, puanGeriAl } from '../lib/uye'
import { OYLAMA_GUN, gunEkle } from '../lib/gorev'
import { purge } from '../hooks/revalidate'

/** Haftalık fotoğraf görevi: tema (lib/gorev.ts). Bitiş ve oylama bitişi başlangıçtan kendiliğinden hesaplanır. */
export const Gorevler: CollectionConfig = {
  slug: 'gorevler',
  labels: { singular: 'Haftalık görev', plural: 'Haftalık görevler' },
  admin: { useAsTitle: 'baslik', group: 'Haftalık görev', defaultColumns: ['baslik', 'baslangic', 'durum'] },
  defaultSort: '-baslangic',
  access: { read: ({ req }) => (req.user ? true : { durum: { equals: 'yayinda' } }), create: editorsUp, update: editorsUp, delete: editorsUp },
  hooks: {
    beforeChange: [({ data }) => {
      if (data.baslangic) { data.bitis = gunEkle(data.baslangic, 7).toISOString(); data.oylamaBitis = gunEkle(data.baslangic, 7 + OYLAMA_GUN).toISOString() }
      return data
    }],
    afterChange: [async ({ doc, context }) => { if (!context?.migration) await purge(['/gorev'], 'gorev'); return doc }],
  },
  fields: [
    { name: 'baslik', type: 'text', label: 'Tema', required: true, admin: { description: 'Kısa: "Gölge", "Kırmızı", "Pencereden"…' } },
    { name: 'aciklama', type: 'textarea', label: 'Açıklama', admin: { description: 'Tek cümle: ne çekilecek, varsa kural.' } },
    { type: 'row', fields: [
      { name: 'baslangic', type: 'date', label: 'Başlangıç (pazartesi 00.00)', required: true, index: true },
      { name: 'durum', type: 'select', label: 'Durum', defaultValue: 'yayinda', options: [{ label: 'Yayında', value: 'yayinda' }, { label: 'Taslak', value: 'taslak' }] },
    ] },
    { type: 'row', fields: [
      { name: 'bitis', type: 'date', label: 'Katılım bitişi', admin: { readOnly: true, description: 'Başlangıç + 7 gün' } },
      { name: 'oylamaBitis', type: 'date', label: 'Oylama bitişi', admin: { readOnly: true, description: 'Katılım bitişi + 3 gün' } },
    ] },
    { name: 'sonucAciklandi', type: 'checkbox', label: 'Sonuç açıklandı', admin: { readOnly: true } },
  ],
}

/** Uper fotoğrafları: kendi görsel deposu (kırpılmaz; konum bilgisi silinir) */
export const GorevGorselleri: CollectionConfig = {
  slug: 'gorev-gorselleri',
  labels: { singular: 'Görev görseli', plural: 'Görev görselleri' },
  admin: { group: 'Haftalık görev', useAsTitle: 'filename', hidden: true },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    resizeOptions: { width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 86, effort: 5 } },
    imageSizes: [
      { name: 'kucuk', width: 720, height: 720, fit: 'inside', withoutEnlargement: true, formatOptions: { format: 'webp', options: { quality: 76 } } },
      { name: 'buyuk', width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
  },
  fields: [],
}

export const GorevFotolari: CollectionConfig = {
  slug: 'gorev-fotolari',
  labels: { singular: 'Görev fotoğrafı', plural: 'Görev fotoğrafları' },
  admin: { group: 'Haftalık görev', useAsTitle: 'aciklama', defaultColumns: ['gorev', 'uye', 'durum', 'oy', 'sira'], description: 'Onaylanan fotoğraf oylamaya girer. Başkasının fotoğrafı, uygunsuz ya da temaya hiç uymayan fotoğrafı reddet.' },
  defaultSort: '-createdAt',
  // Kör oylama: fotoğrafın sahibi oylama bitene kadar dışarıya verilmez; site verisi yalnız /api/uye/gorev ucundan
  access: { read: ({ req }) => !!req.user, create: () => false, update: editorsUp, delete: editorsUp },
  hooks: {
    afterChange: [async ({ doc, previousDoc, req }) => {
      if (doc.durum === previousDoc?.durum) return doc
      const uyeId = typeof doc.uye === 'object' ? doc.uye?.id : doc.uye
      if (!uyeId) return doc
      if (doc.durum === 'onaylandi') { await puanEkle(req.payload, uyeId, 'gorev_katilim', `gorev-foto:${doc.id}`); await bildirimEkle(req.payload, uyeId, 'gorev', 'Fotoğrafın onaylandı, haftalık göreve katıldın.', '/gorev') }
      if (doc.durum === 'reddedildi') { await puanGeriAl(req.payload, uyeId, 'gorev_katilim', `gorev-foto:${doc.id}`); await bildirimEkle(req.payload, uyeId, 'gorev', 'Fotoğrafın haftalık göreve alınmadı (kurallara ya da temaya uymuyor). Başka bir fotoğrafla yeniden katılabilirsin.', '/gorev') }
      return doc
    }],
  },
  fields: [
    { type: 'row', fields: [
      { name: 'gorev', type: 'relationship', relationTo: 'gorevler', label: 'Görev', required: true, index: true },
      { name: 'uye', type: 'relationship', relationTo: 'uyeler', label: 'Uper', required: true, index: true },
    ] },
    { name: 'gorsel', type: 'upload', relationTo: 'gorev-gorselleri', label: 'Fotoğraf', required: true },
    { name: 'aciklama', type: 'text', label: 'Açıklama', admin: { description: 'Uper\'in yazdığı kısa not' } },
    { type: 'row', fields: [
      { name: 'durum', type: 'select', label: 'Durum', defaultValue: 'bekliyor', required: true, index: true,
        options: [{ label: 'Onay bekliyor', value: 'bekliyor' }, { label: 'Onaylandı', value: 'onaylandi' }, { label: 'Reddedildi', value: 'reddedildi' }] },
      { name: 'oy', type: 'number', label: 'Oy', admin: { readOnly: true } },
      { name: 'sira', type: 'number', label: 'Derece', admin: { readOnly: true } },
    ] },
  ],
}
