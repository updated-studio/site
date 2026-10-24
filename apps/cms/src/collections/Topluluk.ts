import { APIError, type CollectionConfig, type GlobalConfig, type GlobalBeforeChangeHook } from 'payload'
import { writeFile } from 'node:fs/promises'
import { adminField, editorsUp, isAdmin } from '../access/roles'
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
    description: 'Sitenin üyeleri. Susturma, engelleme ve e-posta yalnız yöneticilerde. Susturulan Uper yorum ve tepki veremez; engellenen giriş de yapamaz.',
  },
  // Fatih (24 Ekim): editörler Uper'leri görür ama değiştiremez (susturma/engelleme yöneticinin); e-posta yalnız yöneticiye görünür
  access: { read: editorsUp, create: () => false, update: isAdmin, delete: isAdmin },
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
    { name: 'unvan', type: 'select', label: 'Ünvan (adın yanında taçla görünür)', options: [{ label: 'Kurucu', value: 'kurucu' }, { label: 'Kurucu ortak', value: 'kurucu-ortak' }], admin: { description: 'Yalnız yöneticiler verir.' } },
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
    { name: 'email', type: 'email', label: 'E-posta', required: true, access: { read: adminField, update: adminField }, admin: { position: 'sidebar', readOnly: true } },
    { name: 'authId', type: 'text', label: 'Hesap kimliği', required: true, unique: true, index: true, access: { read: adminField, update: adminField }, admin: { position: 'sidebar', readOnly: true } },
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
    description: 'Onay bekleyenler: bağlantı, uygunsuz kelime ya da anlamsız tekrar içeren yorumlar ve 3 şikâyet alan yorumlar.',
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

/**
 * Okur girişinin dış anahtarları (Google ile giriş, Cloudflare doğrulaması): yalnız yönetici, Stüdyo → Site → Topluluk.
 * Gizli anahtarlar veritabanına YAZILMAZ: kayıtta sunucunun istek klasörüne (/var/spool/updated-uye) bırakılır ve alan boşaltılır;
 * sunucu (updated-uye-ayar.path) giriş servisine işler, paneli yeniden başlatır (~1 dk). deploy/altyapi/uye.
 */
const GOOGLE_ID = /^[0-9]{6,}-[a-z0-9]{10,}\.apps\.googleusercontent\.com$/
const ANAHTAR = /^[A-Za-z0-9_-]{10,200}$/
const TURNSTILE = /^0x[A-Za-z0-9_-]{10,200}$/
const anahtarIlet: GlobalBeforeChangeHook = async ({ data }) => {
  const t = (k: string) => String(data[k] ?? '').trim()
  const istek: Record<string, string> = {}
  if (t('googleSecret')) {
    if (!GOOGLE_ID.test(t('googleId'))) throw new APIError('Google istemci kimliği "….apps.googleusercontent.com" ile bitmeli.', 400, null, true)
    if (!ANAHTAR.test(t('googleSecret'))) throw new APIError('Google gizli anahtarı geçersiz görünüyor (genelde GOCSPX- ile başlar).', 400, null, true)
    istek.GOOGLE_ID = t('googleId'); istek.GOOGLE_SECRET = t('googleSecret')
  }
  if (t('turnstileSecret')) {
    if (!TURNSTILE.test(t('turnstileSite')) || !TURNSTILE.test(t('turnstileSecret'))) throw new APIError('Cloudflare anahtarları 0x ile başlamalı (Site Key ve Secret Key).', 400, null, true)
    istek.TURNSTILE_SITE = t('turnstileSite'); istek.TURNSTILE_SECRET = t('turnstileSecret')
  }
  if (Object.keys(istek).length) {
    await writeFile(`/var/spool/updated-uye/${Date.now()}.json`, JSON.stringify(istek), { mode: 0o600 })
      .catch(() => { throw new APIError('Anahtarlar sunucuya iletilemedi. Biraz sonra yeniden dene.', 500, null, true) })
    data.sonIstek = `${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}: ${[istek.GOOGLE_SECRET && 'Google', istek.TURNSTILE_SECRET && 'Cloudflare'].filter(Boolean).join(' ve ')} anahtarı sunucuya iletildi; 1-2 dakikada açılır.`
  }
  data.googleSecret = ''; data.turnstileSecret = ''
  return data
}

export const UyeGiris: GlobalConfig = {
  slug: 'uye-giris',
  label: 'Üyelik girişi ayarları',
  admin: { group: 'Topluluk', description: 'Google ile giriş ve Cloudflare "robot değilim" kutusu. Gizli anahtarlar kaydedilmez; sunucuya iletilip alan boşaltılır.' },
  access: { read: isAdmin, update: isAdmin },
  fields: [
    {
      name: 'durum', type: 'text', label: 'Şu an', virtual: true, admin: { readOnly: true },
      hooks: { afterRead: [() => `Google ile giriş: ${process.env.UYE_GOOGLE === '1' ? 'açık' : 'kapalı'} · Cloudflare doğrulaması: ${process.env.UYE_TURNSTILE_SITE ? 'açık' : 'kapalı'}`] },
    },
    { name: 'sonIstek', type: 'text', label: 'Son işlem', admin: { readOnly: true } },
    {
      type: 'collapsible', label: 'Google ile giriş', fields: [
        { name: 'googleId', type: 'text', label: 'Client ID (istemci kimliği)', admin: { description: 'Google Cloud → Google Auth Platform → Clients → oluşturduğun istemci. "….apps.googleusercontent.com" ile biter.' } },
        { name: 'googleSecret', type: 'text', label: 'Client secret (gizli anahtar)', admin: { description: 'Kaydedince sunucuya iletilir, burada saklanmaz.' } },
      ],
    },
    {
      type: 'collapsible', label: 'Cloudflare robot doğrulaması', fields: [
        { name: 'turnstileSite', type: 'text', label: 'Site Key', admin: { description: 'Cloudflare → Turnstile → widget. 0x ile başlar.' } },
        { name: 'turnstileSecret', type: 'text', label: 'Secret Key (gizli anahtar)', admin: { description: 'Kaydedince sunucuya iletilir, burada saklanmaz.' } },
      ],
    },
  ],
  hooks: { beforeChange: [anahtarIlet] },
}
