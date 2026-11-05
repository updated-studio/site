import type { Access, FieldAccess } from 'payload'

/** Roller (kit §14). 5 Kasım 2026'dan beri editör de doğrudan yayınlar (onay adımı kalktı). */
export const ROLES = [
  { label: 'Yönetici', value: 'admin' },
  { label: 'Yayın yönetmeni', value: 'yayin-yonetmeni' },
  { label: 'Editör', value: 'editor' },
  { label: 'Video', value: 'video' },
  { label: 'Tasarımcı', value: 'tasarimci' },
  { label: 'Sosyal medya', value: 'sosyal' },
] as const

const has = (user: any, ...r: string[]) => !!user && r.includes(user.role)

export const isAdmin: Access = ({ req }) => has(req.user, 'admin')
export const isStaff: Access = ({ req }) => !!req.user
// 5 Kasım 2026 (kullanıcı: "yayın yönetmeni yok, herkes editör, bir de yöneticiler; direkt paylaşabiliyorlar, onaya gitmiyor"): editör de yayınlar
export const canPublish = (user: any) => has(user, 'admin', 'yayin-yonetmeni', 'editor')
export const editorsUp: Access = ({ req }) => has(req.user, 'admin', 'yayin-yonetmeni', 'editor', 'video')

/** Herkes yayımlanmışı okur; ekip taslakları da görür. */
export const publishedOrStaff: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

export const adminField: FieldAccess = ({ req }) => has(req.user, 'admin')
