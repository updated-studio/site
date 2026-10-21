import type { CollectionConfig } from 'payload'
import { ROLES, isAdmin, adminField } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  auth: { useAPIKey: true, tokenExpiration: 60 * 60 * 24 * 7 },
  admin: { useAsTitle: 'name', group: 'Ekip', defaultColumns: ['name', 'email', 'role'] },
  access: { create: isAdmin, delete: isAdmin, read: ({ req }) => !!req.user, update: ({ req, id }) => req.user?.role === 'admin' || req.user?.id === id },
  fields: [
    { name: 'name', type: 'text', label: 'Ad soyad', required: true },
    { name: 'role', type: 'select', label: 'Rol', options: [...ROLES], defaultValue: 'editor', required: true, access: { update: adminField } },
    { name: 'author', type: 'relationship', relationTo: 'authors', label: 'Yazar profili' },
  ],
}
