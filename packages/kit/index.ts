/** Marka Kiti 1.2 kuralları — tek yer. Değişiklikte public/marka/makine/marka-kiti.md ile birlikte güncellenir. */
export const LIMIT = {
  title: 70, // web başlık
  seoTitle: 60,
  spot: 160,
  alt: 125,
  pros: 3,
  proWords: 6,
  inArticleAds: 2,
  navItems: 7,
} as const

/** İçerik etiketleri (kit §7). */
export const LABELS = [
  { label: 'Yok', value: 'yok' },
  { label: 'Son dakika (turuncu, 24 saatte kalkar)', value: 'son-dakika' },
  { label: 'Sızıntı (başlıkta "sızıntı/iddia" olmalı)', value: 'sizinti' },
  { label: 'Rehber', value: 'rehber' },
  { label: 'Sponsorlu', value: 'sponsorlu' },
] as const

/** Panel durumları (kit §12, sabit beş). */
export const STATES = [
  { label: '○ Taslak', value: 'taslak' },
  { label: '◐ İncelemede', value: 'incelemede' },
  { label: '◷ Planlandı', value: 'planlandi' },
  { label: '● Yayında', value: 'yayinda' },
  { label: '■ Arşiv', value: 'arsiv' },
] as const

/** Yayın öncesi kontrol (kit §16 · Ortak + Web). */
export const CHECKLIST = [
  ['kaynak', 'Bilgi doğrulandı: en az bir birincil kaynak var; sızıntıysa başlıkta "sızıntı/iddia"'],
  ['baslik', 'Başlık bilgiyi veriyor: kim + ne oldu + neden önemli; "şok", "flaş", ünlem yok'],
  ['imla', 'İmla Yazım Dili’ne uygun (iPhone, yapay zekâ, 49.999 TL, %15, 14.30)'],
  ['kunye', 'Görselin künyesi var; temsili görselse "Temsili görsel" yazıyor'],
  ['sponsor', 'Ücretli içerikse "Sponsorlu" etiketi görünüyor'],
  ['uzunluk', 'Başlık ≤70, SEO başlığı ≤60, spot ≤160 karakter'],
  ['kapak', 'Kapak 16:9 ve en az 1920 px; künye altında'],
  ['etiket', 'Kategori ve içerik etiketi seçildi'],
  ['alt', 'Görsellerde alt metin var'],
  ['mobil', 'Mobil önizlemede başlık taşmıyor, görsel kırpılmıyor'],
] as const

export const BANNED_WORDS = ['şok', 'flaş', 'inanılmaz']
