import type { CollectionConfig, FieldAccess } from 'payload'
import { editorsUp } from '../access/roles'
import { purge } from '../hooks/revalidate'

/** Ayrıntılar (başvuru bağlantısı, ödül, ücret, açıklama) yalnız ekibe ve Uper'lere (sitede /uye/yarismalar üzerinden) */
const ekip: FieldAccess = ({ req }) => !!req.user

/**
 * Yarışmalar takvimi (offocus yol haritası 3): fotoğraf, kısa film ve video yarışmaları. Liste herkese açık (ad, tür, son tarih);
 * başvuru bağlantısı ve ayrıntılar Uper'e (Fatih, 26 Ekim 2026: "kayıtların tutulması için"). Otomatik bulunanlar "öneri" gelir,
 * ekip Stüdyo'da "yayında" yapınca sitede görünür. Takip ve hatırlatma: payload.uye_yarisma (göç yarismalar).
 */
export const Yarismalar: CollectionConfig = {
  slug: 'yarismalar',
  labels: { singular: 'Yarışma', plural: 'Yarışmalar' },
  admin: { useAsTitle: 'ad', group: 'Yarışmalar', defaultColumns: ['ad', 'sonTarih', 'tur', 'durum'] },
  defaultSort: 'sonTarih',
  // Yayındaki bir yarışma eklenince, değişince ya da kalkınca takvim sayfası yeniden derlenir
  hooks: {
    afterChange: [async ({ doc, previousDoc, context }) => { if (!context?.migration && (doc.durum === 'yayinda' || previousDoc?.durum === 'yayinda')) await purge(['/yarismalar']); return doc }],
    afterDelete: [async ({ doc }) => { if (doc?.durum === 'yayinda') await purge(['/yarismalar']) }],
  },
  access: {
    read: ({ req }) => (req.user ? true : { durum: { equals: 'yayinda' } }),
    create: editorsUp, update: editorsUp, delete: editorsUp,
  },
  fields: [
    { name: 'ad', type: 'text', label: 'Yarışma', required: true },
    { type: 'row', fields: [
      { name: 'duzenleyen', type: 'text', label: 'Düzenleyen' },
      { name: 'durum', type: 'select', label: 'Durum', defaultValue: 'yayinda', required: true,
        options: [{ label: 'Öneri (onay bekliyor)', value: 'oneri' }, { label: 'Yayında', value: 'yayinda' }, { label: 'Gizli', value: 'gizli' }],
        admin: { description: 'Otomatik bulunanlar "Öneri" gelir; bilgileri resmi sayfadan kontrol edip "Yayında" yap.' } },
    ] },
    { type: 'row', fields: [
      { name: 'tur', type: 'select', label: 'Tür', required: true, defaultValue: 'fotograf',
        options: [{ label: 'Fotoğraf', value: 'fotograf' }, { label: 'Kısa film', value: 'kisa-film' }, { label: 'Video', value: 'video' }, { label: 'Fotoğraf ve video', value: 'karma' }] },
      { name: 'kapsam', type: 'select', label: 'Kapsam', defaultValue: 'turkiye',
        options: [{ label: 'Türkiye', value: 'turkiye' }, { label: 'Uluslararası', value: 'uluslararasi' }] },
    ] },
    { type: 'row', fields: [
      { name: 'sonTarih', type: 'date', label: 'Son başvuru', required: true, admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' } } },
      { name: 'sonucTarihi', type: 'date', label: 'Sonuç açıklanma', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' } } },
      { name: 'ucretsiz', type: 'checkbox', label: 'Katılım ücretsiz' },
    ] },
    { name: 'konu', type: 'text', label: 'Konu / tema', admin: { description: 'Kısa: "Serbest", "Doğa ve insan", "Kentsel dönüşüm"…' } },
    { name: 'baglanti', type: 'text', label: 'Resmi sayfa (başvuru)', required: true, access: { read: ekip },
      validate: (v: unknown) => (typeof v === 'string' && /^https?:\/\//.test(v)) || 'http(s) ile başlayan adres' },
    { name: 'odul', type: 'text', label: 'Ödül', access: { read: ekip }, admin: { description: 'Ör. "Birinciye 50.000 TL, 10 mansiyon"' } },
    { name: 'ucret', type: 'text', label: 'Katılım ücreti', access: { read: ekip }, admin: { condition: (_, s) => !s?.ucretsiz } },
    { name: 'aciklama', type: 'textarea', label: 'Kısa açıklama', access: { read: ekip }, admin: { description: 'Kendi cümlelerimizle 1-3 cümle (şartnameden kopyalama yok): kimler katılabilir, kaç eser, önemli koşul.' } },
    { name: 'kaynak', type: 'text', label: 'Bulunduğu kaynak', access: { read: ekip }, admin: { readOnly: true, condition: (d) => !!d?.kaynak } },
  ],
}
