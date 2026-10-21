import type { CollectionConfig } from 'payload'
import { editorsUp } from '../access/roles'
import { slugField } from '../fields/slug'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Yazar', plural: 'Yazarlar' },
  admin: { useAsTitle: 'name', group: 'Ekip' },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  fields: [
    { name: 'name', type: 'text', label: 'Ad soyad', required: true },
    slugField('name'),
    { name: 'title', type: 'text', label: 'Unvan', admin: { description: 'Ör. Editör · dron ve kamera' } },
    { name: 'bio', type: 'textarea', label: 'Kısa biyografi' },
    { name: 'avatar', type: 'upload', relationTo: 'media', label: 'Fotoğraf' },
    { name: 'sameAs', type: 'text', hasMany: true, label: 'Profil bağlantıları (X, Instagram, YouTube)' },
    { name: 'wpId', type: 'number', label: 'WordPress kimliği (taşıma)', admin: { position: 'sidebar', readOnly: true } },
  ],
}
