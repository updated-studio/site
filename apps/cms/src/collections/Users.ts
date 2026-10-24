import type { CollectionConfig } from 'payload'
import { ROLES, isAdmin, adminField } from '../access/roles'
import { studyoStrategy } from '../auth/studyo'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  // Stüdyo girişi de tanınır (auth/studyo.ts): Stüdyo'daki kişi paneldeki kendi hesabı ve yetkileriyle işlem yapar
  auth: { useAPIKey: true, tokenExpiration: 60 * 60 * 24 * 7, strategies: [studyoStrategy] },
  admin: { useAsTitle: 'name', group: 'Ekip', defaultColumns: ['name', 'email', 'role'] },
  // Payload'un kendi paneli (yedek kapı) yalnız yöneticilere açık; ekip Stüdyo'yu kullanır. Stüdyo'nun API erişimi bundan etkilenmez.
  access: { admin: ({ req }) => req.user?.role === 'admin', create: isAdmin, delete: isAdmin, read: ({ req }) => !!req.user, update: ({ req, id }) => req.user?.role === 'admin' || req.user?.id === id },
  fields: [
    { name: 'name', type: 'text', label: 'Ad soyad', required: true },
    { name: 'role', type: 'select', label: 'Rol', options: [...ROLES], defaultValue: 'editor', required: true, access: { update: adminField } },
    { name: 'author', type: 'relationship', relationTo: 'authors', label: 'Yazar profili' },
  ],
}
