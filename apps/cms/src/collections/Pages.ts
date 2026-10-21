import type { CollectionConfig } from 'payload'
import { editorsUp, publishedOrStaff } from '../access/roles'
import { slugField } from '../fields/slug'
import { seoFields } from '../fields/seo'
import { autoSeo } from '../hooks/autoSeo'
import { revalidate } from '../hooks/revalidate'

/** Kurumsal sayfalar: Hakkımızda, Test yöntemimiz, Düzeltme politikası, Reklam… Adres: /slug */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Sayfa', plural: 'Sayfalar' },
  admin: { useAsTitle: 'title', group: 'Ayarlar' },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: editorsUp, update: editorsUp, delete: editorsUp },
  fields: [
    { name: 'title', type: 'text', label: 'Başlık', required: true },
    { name: 'spot', type: 'textarea', label: 'Kısa açıklama' },
    { name: 'body', type: 'richText', label: 'Metin', required: true },
    seoFields,
    slugField(),
  ],
  hooks: { beforeChange: [autoSeo()], afterChange: [revalidate((d) => (d.slug ? [`/${d.slug}`] : []))] },
}
