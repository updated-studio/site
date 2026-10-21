import type { CollectionConfig } from 'payload'
import { editorsUp } from '../access/roles'
import { slugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Kategori', plural: 'Kategoriler' },
  admin: { useAsTitle: 'name', group: 'İçerik', defaultColumns: ['name', 'slug', 'inNav', 'order'] },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  fields: [
    { name: 'name', type: 'text', label: 'Ad', required: true },
    slugField('name'),
    { name: 'description', type: 'textarea', label: 'Açıklama (kategori sayfası ve SEO)' },
    { name: 'inNav', type: 'checkbox', label: 'Üst menüde', defaultValue: false, admin: { description: 'Menüde en fazla 7 öğe (kit 10b).' } },
    { name: 'order', type: 'number', label: 'Sıra', defaultValue: 10 },
    { name: 'wpId', type: 'number', admin: { position: 'sidebar', readOnly: true } },
  ],
}
