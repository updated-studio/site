import type { CollectionConfig } from 'payload'
import { editorsUp } from '../access/roles'

/** YouTube videoları: kanal akışından otomatik (Stüdyo), elle de eklenebilir. Sitede şerit ve sonsuz akışta. */
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videolar' },
  admin: { useAsTitle: 'title', group: 'Kanallar', defaultColumns: ['title', 'kind', 'publishedAt'] },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', type: 'text', label: 'Başlık (≤60)', required: true, maxLength: 60 },
    { name: 'youtubeId', type: 'text', label: 'YouTube video kimliği', required: true, unique: true },
    { name: 'kind', type: 'select', label: 'Tür', options: ['Haber', 'İnceleme', 'Karşılaştırma', 'Rehber'].map((v) => ({ label: v, value: v })), defaultValue: 'İnceleme' },
    { name: 'thumb', type: 'upload', relationTo: 'media', label: 'Kapak (boşsa YouTube kapağı)' },
    { name: 'publishedAt', type: 'date', label: 'Yayın' },
    { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true, label: 'Künye' },
  ],
}

/** Instagram reels: sitede 9:16 şerit. */
export const Reels: CollectionConfig = {
  slug: 'reels',
  labels: { singular: 'Reels', plural: 'Reels' },
  admin: { useAsTitle: 'caption', group: 'Kanallar' },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'caption', type: 'text', label: 'Kapak yazısı (≤5 kelime)', required: true },
    { name: 'url', type: 'text', label: 'Instagram bağlantısı', required: true },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Kapak (9:16)' },
    { name: 'publishedAt', type: 'date', label: 'Yayın' },
  ],
}

/**
 * Reklamlar (kit 10b): "Reklam" yazar, içerik gibi görünmez; haber metninde ≤2, ilk paragraftan önce yok.
 * Açılır ve sesli reklam yok. Video reklam sessiz başlar, 5 sn sonra geçilebilir.
 */
export const Ads: CollectionConfig = {
  slug: 'ads',
  labels: { singular: 'Reklam', plural: 'Reklamlar' },
  admin: { useAsTitle: 'name', group: 'Gelir', defaultColumns: ['name', 'slot', 'active', 'startsAt', 'endsAt'] },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  fields: [
    { name: 'name', type: 'text', label: 'Kampanya', required: true },
    { name: 'advertiser', type: 'text', label: 'Reklam veren', required: true },
    { name: 'slot', type: 'select', label: 'Alan', required: true, options: [
      { label: 'Bant 970×250 (mobil 320×100)', value: 'lb' }, { label: 'Kutu 300×250', value: 'mr' }, { label: 'Dikey afiş 300×600 (ana sayfa ilk bölüm; telefonda mobil görsel 300×250)', value: 'hp' }, { label: 'Akış içi (20 haberde 1)', value: 'in' },
      { label: 'Yan dikey 160×600 (yalnız 1600 px ve üstü ekranda, sayfanın iki yanında; iki kampanya varsa biri solda biri sağda)', value: 'sky' },
      { label: 'Video (sessiz, 5 sn sonra geç)', value: 'video' }, { label: 'Sponsorlu kart', value: 'sponsored' } ] },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Görsel' },
    { name: 'mobileImage', type: 'upload', relationTo: 'media', label: 'Mobil görsel (bant 320×100, dikey afiş 300×250)' },
    { name: 'videoUrl', type: 'text', label: 'Video dosyası (MP4, ≤15 sn)' },
    { name: 'title', type: 'text', label: 'Sponsorlu kart başlığı' },
    { name: 'url', type: 'text', label: 'Hedef bağlantı', required: true },
    { type: 'row', fields: [{ name: 'startsAt', type: 'date', label: 'Başlangıç' }, { name: 'endsAt', type: 'date', label: 'Bitiş' }, { name: 'weight', type: 'number', label: 'Ağırlık', defaultValue: 1 }] },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, label: 'Yalnız bu kategorilerde' },
    { name: 'active', type: 'checkbox', label: 'Yayında', defaultValue: true },
  ],
}
