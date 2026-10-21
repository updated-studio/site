import { APIError, type CollectionBeforeChangeHook } from 'payload'
import { CHECKLIST, BANNED_WORDS } from '../lib/kit'
import { canPublish } from '../access/roles'

/**
 * Yayın kuralları (kit §14 + §16):
 * - Yalnız yayın yönetmeni/yönetici yayınlar.
 * - Editör kendi haberini onaylamaz (onaylayan ≠ yazar kullanıcısı).
 * - Kontrol listesi tamamlanmadan yayın yok. Son dakikada tek onay yeter, 30 dk içinde ikinci kontrol hatırlatılır.
 */
export const workflowGuard: CollectionBeforeChangeHook = ({ data, req, originalDoc, operation, context }) => {
  if (context?.migration) return data // WordPress taşıması: içerik zaten yayındaydı
  const publishing = data._status === 'published' && originalDoc?._status !== 'published'
  data.workflow ||= {}
  if (operation === 'create' && !data.workflow.state) data.workflow.state = 'taslak'
  if (!publishing) return data
  if (!canPublish(req.user)) throw new APIError('Yayınlama yetkisi yalnız yayın yönetmenindedir. "İncelemeye gönder" kullanın.', 403)
  const t = String(data.title || '').toLocaleLowerCase('tr-TR')
  const bad = BANNED_WORDS.find((w) => t.includes(w))
  if (bad || /!/.test(t)) throw new APIError(`Başlıkta "${bad || '!'}" kullanılmaz (kit §7).`, 400)
  if (data.label === 'sizinti' && !/(sızıntı|sızdı|iddia)/.test(t)) throw new APIError('Sızıntı haberinin başlığında "sızıntı/sızdı/iddia" geçmeli.', 400)
  const done = data.workflow.checklist || {}
  const missing = CHECKLIST.filter(([k]) => !done[k]).map(([, l]) => l)
  if (missing.length && data.label !== 'son-dakika') throw new APIError(`Kontrol listesi eksik: ${missing[0]}${missing.length > 1 ? ` (+${missing.length - 1})` : ''}`, 400)
  const authorUser = data.workflow.ownerUser || originalDoc?.workflow?.ownerUser
  if (authorUser && String(authorUser) === String(req.user?.id) && req.user?.role !== 'admin')
    throw new APIError('Kendi haberinizi onaylayamazsınız; ikinci bir yetkili yayınlamalı.', 403)
  data.workflow.state = 'yayinda'
  data.workflow.approvedBy = req.user?.id
  data.publishedAt ||= new Date().toISOString()
  return data
}
