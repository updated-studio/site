import type { CollectionConfig } from 'payload'
import { editorsUp } from '../access/roles'
import { LIMIT } from '../lib/kit'

/**
 * Görseller: asıl dosya saklanır (Supabase Storage), site yalnız WebP türevleri kullanır.
 * Boyutlar 16:9 (kit §5). Her türev ≤200 KB hedefli kalitede üretilir; 1600 px kapak tipik olarak 90–160 KB.
 * Künye zorunlu (kit §8): "Görsel: Apple" / "Fotoğraf: Ad Soyad / UPDATED" / "Temsili görsel".
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Görsel', plural: 'Görseller' },
  admin: { group: 'İçerik', useAsTitle: 'alt' },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    crop: true,
    adminThumbnail: 'thumb',
    resizeOptions: { width: 2560, withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumb', width: 480, height: 270, position: 'centre', formatOptions: { format: 'webp', options: { quality: 70 } } },
      { name: 'card', width: 800, height: 450, position: 'centre', formatOptions: { format: 'webp', options: { quality: 70 } } },
      { name: 'hero', width: 1600, height: 900, position: 'centre', formatOptions: { format: 'webp', options: { quality: 68 } } },
      { name: 'og', width: 1200, height: 630, position: 'centre', formatOptions: { format: 'jpeg', options: { quality: 78 } } },
      { name: 'reel', width: 540, height: 960, position: 'centre', formatOptions: { format: 'webp', options: { quality: 70 } } },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', label: 'Alt metin', required: true, validate: (v: unknown) => !v || String(v).length <= LIMIT.alt || `En fazla ${LIMIT.alt} karakter.`, admin: { description: 'Ne + önemli detay, tek cümle.' } },
    { name: 'credit', type: 'text', label: 'Künye', required: true, admin: { description: 'Görsel: Apple · Fotoğraf: Ad Soyad / UPDATED' } },
    { name: 'representative', type: 'checkbox', label: 'Temsili görsel', defaultValue: false },
    { name: 'aiGenerated', type: 'checkbox', label: 'Yapay zekâ ile üretildi', defaultValue: false, admin: { description: 'İşaretliyse künye "Temsili görsel · Yapay zekâ ile üretildi" olur.' } },
    { name: 'sourceUrl', type: 'text', label: 'Kaynak bağlantısı' },
  ],
  hooks: {
    beforeChange: [({ data }) => { if (data.aiGenerated) { data.representative = true; data.credit = 'Temsili görsel · Yapay zekâ ile üretildi' } return data }],
  },
}
