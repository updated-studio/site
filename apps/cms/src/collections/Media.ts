import type { CollectionConfig } from 'payload'
import { editorsUp } from '../access/roles'
import { LIMIT } from '../lib/kit'

/**
 * Görseller: asıl dosya saklanır (Supabase Storage), site yalnız WebP türevleri kullanır.
 * Boyutlar 16:9 (kit §5). Asıl dosya en fazla 2560 px, WebP %88 (arşiv kalitesi); sitede kullanılan türevler WebP %72–78,
 * gözle fark edilir kayıp olmadan küçük kalır. Her yüklemede kendiliğinden uygulanır.
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
    formatOptions: { format: 'webp', options: { quality: 88, effort: 6, smartSubsample: true } },
    imageSizes: [
      { name: 'thumb', width: 480, height: 270, position: 'centre', formatOptions: { format: 'webp', options: { quality: 72, effort: 6, smartSubsample: true } } },
      { name: 'card', width: 800, height: 450, position: 'centre', formatOptions: { format: 'webp', options: { quality: 76, effort: 6, smartSubsample: true } } },
      { name: 'hero', width: 1600, height: 900, position: 'centre', formatOptions: { format: 'webp', options: { quality: 78, effort: 6, smartSubsample: true } } },
      { name: 'og', width: 1200, height: 630, position: 'centre', formatOptions: { format: 'jpeg', options: { quality: 82, mozjpeg: true } } },
      { name: 'reel', width: 540, height: 960, position: 'centre', formatOptions: { format: 'webp', options: { quality: 76, effort: 6, smartSubsample: true } } },
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
