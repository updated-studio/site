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
    // Ad ve rol Stüdyo'dan gelir (Ekip → Yönetim); burada değiştirilirse kişinin bir sonraki Stüdyo isteğinde Stüdyo'daki hâline döner
    { name: 'name', type: 'text', label: 'Ad soyad', required: true, admin: { readOnly: true, description: "Stüdyo'dan yönetilir (Ekip → Yönetim)." } },
    { name: 'role', type: 'select', label: 'Rol', options: [...ROLES], defaultValue: 'editor', required: true, access: { update: adminField }, admin: { readOnly: true, description: "Stüdyo'dan yönetilir (Ekip → Yönetim)." } },
    { name: 'author', type: 'relationship', relationTo: 'authors', label: 'Yazar profili', admin: { description: 'Boşsa kendiliğinden açılır (adıyla). Sitede imza ve fotoğraf buradan.' } },
  ],
  hooks: {
    // Her ekip üyesinin bir yazar profili olur (28 Ekim 2026, kullanıcı: "eski haberler üyelerle ilişkilendirilmemiş"):
    // yeni kullanıcıda ya da profili boş kullanıcıda adıyla yazar açılır ve bağlanır. Fotoğraf Stüdyo profilinden gelir (api/yazar-fotolari).
    afterChange: [
      async ({ doc, req, context }) => {
        if (doc.author || !doc.name || context?.yazarAc) return doc
        const ad = String(doc.name).trim()
        const var_ = await req.payload.find({ collection: 'authors', where: { name: { equals: ad } }, limit: 1, depth: 0, req })
        const yazar = var_.docs[0] ?? (await req.payload.create({ collection: 'authors', data: { name: ad }, overrideAccess: true, req }))
        await req.payload.update({ collection: 'users', id: doc.id, data: { author: yazar.id }, overrideAccess: true, req, context: { yazarAc: true } })
        return { ...doc, author: yazar.id }
      },
    ],
  },
}
