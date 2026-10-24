import type { CollectionConfig } from 'payload'
import { editorsUp, isAdmin } from '../access/roles'
import { yorumDurumDegisti, uyeDurumDegisti } from '../lib/uye'

/**
 * Topluluk (24 Ekim 2026): sitenin okurları "Uper" olur, yorum yapar, tepki verir, puan toplar.
 * Hesap (e-posta, şifre, Google) ayrı giriş servisinde (deploy/altyapi/uye); burada yalnız profil ve içerik durur.
 * Okur bu koleksiyonlara Payload üzerinden hiçbir zaman erişmez: okur istekleri yalnız /api/uye/* uçlarından geçer (endpoints/uye.ts).
 * Ekip (editör ve üstü) Stüdyo → Site → Topluluk'tan yorumları onaylar/gizler, Uper'leri susturur ya da engeller.
 */

const EKIPMAN_TURU = ['Kamera', 'Lens', 'Gimbal', 'Dron', 'Işık', 'Ses', 'Telefon', 'Bilgisayar', 'Diğer'].map((v) => ({ label: v, value: v }))

export const Uyeler: CollectionConfig = {
  slug: 'uyeler',
  labels: { singular: 'Uper', plural: "Uper'ler" },
  admin: {
    useAsTitle: 'kullaniciAdi', group: 'Topluluk',
    defaultColumns: ['kullaniciAdi', 'ad', 'puan', 'durum', 'createdAt'],
    listSearchableFields: ['kullaniciAdi', 'ad', 'email'],
    description: 'Sitenin üyeleri. Susturulan Uper yorum ve tepki veremez; engellenen giriş de yapamaz.',
  },
  access: { read: editorsUp, create: () => false, update: editorsUp, delete: isAdmin },
  fields: [
    {
      type: 'row', fields: [
        { name: 'kullaniciAdi', type: 'text', label: 'Kullanıcı adı', required: true, unique: true, index: true, maxLength: 20 },
        { name: 'ad', type: 'text', label: 'Görünen ad', required: true, maxLength: 40 },
      ],
    },
    { name: 'bio', type: 'textarea', label: 'Hakkında', maxLength: 160 },
    {
      type: 'row', fields: [
        { name: 'durum', type: 'select', label: 'Durum', defaultValue: 'aktif', required: true, options: [{ label: 'Aktif', value: 'aktif' }, { label: 'Susturuldu (yorum/tepki yok)', value: 'susturuldu' }, { label: 'Engellendi (giriş yok)', value: 'engelli' }] },
        { name: 'guvenilir', type: 'checkbox', label: 'Güvenilir (yorumları onaysız yayında)', defaultValue: false },
      ],
    },
    {
      name: 'ekipman', type: 'array', label: 'Ekipmanı', maxRows: 12,
      fields: [{
        type: 'row', fields: [
          { name: 'tur', type: 'select', label: 'Tür', options: EKIPMAN_TURU, defaultValue: 'Kamera' },
          { name: 'ad', type: 'text', label: 'Model', required: true, maxLength: 60 },
          { name: 'urun', type: 'relationship', relationTo: 'products', label: 'Künyedeki ürün' },
        ],
      }],
    },
    { name: 'renk', type: 'select', label: 'Profil rengi', defaultValue: 'turuncu', options: ['turuncu', 'mavi', 'siyah', 'gri'].map((v) => ({ label: v, value: v })) },
    { name: 'bildirimEposta', type: 'checkbox', label: 'Yorumuna yanıt gelince e-posta', defaultValue: true },
    { name: 'puan', type: 'number', label: 'Puan', defaultValue: 0, admin: { position: 'sidebar', readOnly: true } },
    { name: 'ekip', type: 'checkbox', label: 'Updated ekibi', defaultValue: false, admin: { position: 'sidebar', readOnly: true, description: "E-postası Stüdyo'daki bir ekip üyesininkiyle aynı." } },
    { name: 'email', type: 'email', label: 'E-posta', required: true, admin: { position: 'sidebar', readOnly: true } },
    { name: 'authId', type: 'text', label: 'Hesap kimliği', required: true, unique: true, index: true, admin: { position: 'sidebar', readOnly: true } },
    { name: 'giris', type: 'select', label: 'Giriş yolu', options: ['email', 'google'].map((v) => ({ label: v, value: v })), admin: { position: 'sidebar', readOnly: true } },
    { name: 'onaylar', type: 'group', label: 'Onaylar (KVKK)', admin: { position: 'sidebar', readOnly: true }, fields: [
      { name: 'sozlesme', type: 'date', label: 'Üyelik sözleşmesi' },
      { name: 'kvkk', type: 'date', label: 'Aydınlatma metni okundu' },
    ] },
    { name: 'sonGiris', type: 'date', label: 'Son görülme', admin: { position: 'sidebar', readOnly: true } },
  ],
  hooks: { afterChange: [uyeDurumDegisti] },
}

export const Yorumlar: CollectionConfig = {
  slug: 'yorumlar',
  labels: { singular: 'Yorum', plural: 'Yorumlar' },
  admin: {
    useAsTitle: 'metin', group: 'Topluluk',
    defaultColumns: ['metin', 'uye', 'durum', 'neden', 'sikayet', 'createdAt'],
    listSearchableFields: ['metin'],
    description: 'Onay bekleyenler: bağlantı ya da uygunsuz kelime içeren yorumlar, yeni Uper\'in ilk yorumu ve 3 şikâyet alan yorumlar.',
  },
  defaultSort: '-createdAt',
  access: { read: editorsUp, create: () => false, update: editorsUp, delete: editorsUp },
  fields: [
    { name: 'metin', type: 'textarea', label: 'Yorum', required: true, maxLength: 2000 },
    {
      type: 'row', fields: [
        { name: 'durum', type: 'select', label: 'Durum', required: true, defaultValue: 'yayinda', index: true, options: [{ label: 'Yayında', value: 'yayinda' }, { label: 'Onay bekliyor', value: 'onay-bekliyor' }, { label: 'Gizlendi', value: 'gizli' }, { label: 'Uper sildi', value: 'silindi' }] },
        { name: 'neden', type: 'text', label: 'Neden onayda', admin: { readOnly: true } },
      ],
    },
    { name: 'hedef', type: 'relationship', relationTo: ['news', 'reviews', 'comparisons'], label: 'Yazı', required: true, index: true },
    { name: 'uye', type: 'relationship', relationTo: 'uyeler', label: 'Uper', index: true },
    { name: 'ust', type: 'relationship', relationTo: 'yorumlar', label: 'Bağlı olduğu yorum (konu başı)', index: true },
    { name: 'yanitlanan', type: 'relationship', relationTo: 'yorumlar', label: 'Yanıt verdiği yorum' },
    {
      type: 'row', fields: [
        { name: 'begeni', type: 'number', label: 'Beğeni', defaultValue: 0, admin: { readOnly: true } },
        { name: 'sikayet', type: 'number', label: 'Şikâyet', defaultValue: 0, admin: { readOnly: true } },
      ],
    },
    { name: 'yol', type: 'text', label: 'Sayfa adresi', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'duzenlendi', type: 'date', label: 'Düzenlendi', admin: { readOnly: true, position: 'sidebar' } },
  ],
  hooks: { afterChange: [yorumDurumDegisti] },
}
