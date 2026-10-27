/**
 * Ürün türüne göre standart teknik özellik şablonları (25 Ekim 2026; offocus yol haritası 2).
 * Karşılaştırma motoru (site apps/web/src/lib/compare.ts) özellikleri ADIYLA eşleştirir; bu yüzden aynı türdeki her ürün
 * aynı adları kullanır. Yeni ürün açılınca (ya da türü seçilip özellik listesi boşken) şablon kendiliğinden dolar,
 * değerler boş ("Bilinmiyor") başlar; editör kaynağıyla doldurur. Yeni özellik eklemek: ilgili listeye bir satır.
 * [ad, grup, birim, büyükOlanİyi (true/false/null = kıyaslanmaz), aranmaÖnemi 1–5]
 */
type S = [string, string, string, boolean | null, number]

const ORTAK_SON: S[] = [['Boyutlar', 'Gövde', 'mm', null, 2], ['Ağırlık', 'Gövde', 'g', false, 3], ['Türkiye fiyatı', 'Fiyat', 'TL', false, 5], ['Çıkış tarihi', 'Genel', '', null, 2]]

export const URUN_SABLONLARI: Record<string, S[]> = {
  camera: [
    ['Sensör boyutu', 'Görüntü', '', null, 5], ['Çözünürlük', 'Görüntü', 'MP', true, 5], ['Lens yuvası', 'Gövde', '', null, 4], ['Gövde içi sabitleme', 'Görüntü', 'stop', true, 4],
    ['ISO aralığı', 'Görüntü', '', null, 3], ['Seri çekim', 'Görüntü', 'fps', true, 3], ['Otomatik odak', 'Görüntü', '', null, 3],
    ['Maks. video', 'Video', '', null, 5], ['4K kare hızı', 'Video', 'fps', true, 4], ['Renk derinliği', 'Video', 'bit', true, 3], ['Log profili', 'Video', '', null, 3], ['RAW video', 'Video', '', null, 2], ['Kayıt süresi sınırı', 'Video', '', null, 2],
    ['Ekran', 'Gövde', '', null, 2], ['Vizör', 'Gövde', '', null, 2], ['Pil (CIPA)', 'Güç', 'çekim', true, 3], ['Kart yuvası', 'Bağlantı', '', null, 2], ['Bağlantı', 'Bağlantı', '', null, 2], ['Hava koşullarına dayanıklılık', 'Gövde', '', null, 2],
    ...ORTAK_SON,
  ],
  lens: [
    ['Odak uzaklığı', 'Optik', 'mm', null, 5], ['Maks. diyafram', 'Optik', 'f/', false, 5], ['Min. diyafram', 'Optik', 'f/', null, 1], ['Lens yuvası', 'Uyumluluk', '', null, 5], ['Sensör kapsama', 'Uyumluluk', '', null, 4],
    ['Optik yapı', 'Optik', '', null, 2], ['Min. odak mesafesi', 'Optik', 'cm', false, 3], ['Maks. büyütme', 'Optik', 'x', true, 3], ['Diyafram bıçağı', 'Optik', 'adet', true, 1],
    ['Otomatik odak motoru', 'Odak', '', null, 3], ['Optik sabitleme', 'Odak', '', null, 3], ['Filtre çapı', 'Gövde', 'mm', null, 3], ['Hava koşullarına dayanıklılık', 'Gövde', '', null, 2],
    ...ORTAK_SON,
  ],
  drone: [
    ['Sensör', 'Kamera', '', null, 5], ['Maks. video', 'Kamera', '', null, 5], ['Kare hızı (4K)', 'Kamera', 'fps', true, 3], ['Renk derinliği', 'Kamera', 'bit', true, 2], ['Gimbal', 'Kamera', 'eksen', true, 2],
    ['Uçuş süresi', 'Uçuş', 'dk', true, 5], ['İletim menzili', 'Uçuş', 'km', true, 4], ['Engel algılama', 'Uçuş', '', null, 4], ['Rüzgar direnci', 'Uçuş', 'm/sn', true, 2], ['Maks. hız', 'Uçuş', 'km/sa', true, 2],
    ['Dahili hafıza', 'Güç', 'GB', true, 2], ['Kumanda', 'Güç', '', null, 2], ['Sınıf (Türkiye tescil)', 'Genel', '', null, 3],
    ...ORTAK_SON,
  ],
  phone: [
    ['Ekran', 'Ekran', '', null, 4], ['Yenileme hızı', 'Ekran', 'Hz', true, 3], ['Parlaklık (tepe)', 'Ekran', 'nit', true, 2], ['İşlemci', 'Performans', '', null, 5], ['RAM', 'Performans', 'GB', true, 3], ['Depolama', 'Performans', 'GB', true, 3],
    ['Ana kamera', 'Kamera', 'MP', true, 5], ['Ultra geniş', 'Kamera', 'MP', true, 3], ['Telefoto', 'Kamera', '', null, 4], ['Optik zoom', 'Kamera', 'x', true, 4], ['Ön kamera', 'Kamera', 'MP', true, 2], ['Video', 'Kamera', '', null, 3],
    ['Pil', 'Güç', 'mAh', true, 5], ['Kablolu şarj', 'Güç', 'W', true, 3], ['Kablosuz şarj', 'Güç', 'W', true, 2], ['Suya dayanıklılık', 'Gövde', '', null, 2], ['İşletim sistemi', 'Yazılım', '', null, 2], ['Güncelleme desteği', 'Yazılım', 'yıl', true, 3],
    ...ORTAK_SON,
  ],
  cam360: [
    ['Sensör', 'Kamera', '', null, 4], ['Maks. video', 'Kamera', '', null, 5], ['360° video', 'Kamera', '', null, 4], ['Fotoğraf çözünürlüğü', 'Kamera', 'MP', true, 2], ['Görüntü sabitleme', 'Kamera', '', null, 4],
    ['Su geçirmezlik (kasasız)', 'Gövde', 'm', true, 3], ['Değiştirilebilir lens', 'Gövde', '', null, 2], ['Pil', 'Güç', 'mAh', true, 3], ['Kayıt süresi', 'Güç', 'dk', true, 3], ['Dahili hafıza', 'Güç', 'GB', true, 2],
    ...ORTAK_SON,
  ],
  gimbal: [
    ['Taşıma kapasitesi', 'Performans', 'kg', true, 5], ['Eksen', 'Performans', 'adet', true, 2], ['Uyumluluk', 'Performans', '', null, 4], ['Takip', 'Özellikler', '', null, 3], ['Katlanabilir', 'Gövde', '', null, 2],
    ['Pil süresi', 'Güç', 'saat', true, 3], ['Şarj', 'Güç', '', null, 1], ['Bağlantı', 'Özellikler', '', null, 1],
    ...ORTAK_SON,
  ],
  light: [
    ['Tür', 'Genel', '', null, 4], ['Güç', 'Işık', 'W', true, 5], ['Renk sıcaklığı', 'Işık', 'K', null, 4], ['RGB', 'Işık', '', null, 3], ['CRI', 'Renk kalitesi', '', true, 4], ['TLCI', 'Renk kalitesi', '', true, 3],
    ['Aydınlatma (1 m)', 'Işık', 'lux', true, 4], ['Montaj', 'Gövde', '', null, 2], ['Güç kaynağı', 'Güç', '', null, 2], ['Pil ile çalışma', 'Güç', '', null, 2], ['Kontrol', 'Özellikler', '', null, 2], ['Soğutma', 'Gövde', '', null, 1],
    ...ORTAK_SON,
  ],
  mic: [
    ['Tür', 'Genel', '', null, 4], ['Kutup deseni', 'Ses', '', null, 3], ['Kablosuz menzil', 'Bağlantı', 'm', true, 4], ['Dahili kayıt', 'Ses', '', null, 3], ['32-bit float', 'Ses', '', null, 3], ['Gürültü azaltma', 'Ses', '', null, 2],
    ['Bağlantı', 'Bağlantı', '', null, 3], ['Pil süresi', 'Güç', 'saat', true, 3], ['Şarj kutusu', 'Güç', '', null, 2],
    ...ORTAK_SON,
  ],
  headphones: [
    ['Tür', 'Genel', '', null, 4], ['Aktif gürültü engelleme', 'Ses', '', null, 4], ['Sürücü', 'Ses', 'mm', null, 2], ['Kodek', 'Ses', '', null, 3], ['Uzamsal ses', 'Ses', '', null, 2],
    ['Pil süresi', 'Güç', 'saat', true, 4], ['Şarj kutusuyla', 'Güç', 'saat', true, 2], ['Bağlantı', 'Bağlantı', '', null, 2], ['Suya dayanıklılık', 'Gövde', '', null, 2],
    ...ORTAK_SON,
  ],
  laptop: [
    ['İşlemci', 'Performans', '', null, 5], ['Grafik', 'Performans', '', null, 4], ['RAM', 'Performans', 'GB', true, 4], ['Depolama', 'Performans', 'GB', true, 3],
    ['Ekran', 'Ekran', '', null, 4], ['Yenileme hızı', 'Ekran', 'Hz', true, 2], ['Pil', 'Güç', 'saat', true, 4], ['Bağlantı noktaları', 'Bağlantı', '', null, 2], ['İşletim sistemi', 'Yazılım', '', null, 2],
    ...ORTAK_SON,
  ],
  tablet: [
    ['Ekran', 'Ekran', '', null, 4], ['Yenileme hızı', 'Ekran', 'Hz', true, 2], ['İşlemci', 'Performans', '', null, 5], ['RAM', 'Performans', 'GB', true, 3], ['Depolama', 'Performans', 'GB', true, 3],
    ['Kalem desteği', 'Özellikler', '', null, 3], ['Klavye desteği', 'Özellikler', '', null, 2], ['Pil', 'Güç', 'saat', true, 3], ['Hücresel', 'Bağlantı', '', null, 2], ['İşletim sistemi', 'Yazılım', '', null, 2],
    ...ORTAK_SON,
  ],
  watch: [
    ['Ekran', 'Ekran', '', null, 3], ['Kasa boyutu', 'Gövde', 'mm', null, 3], ['Pil süresi', 'Güç', 'gün', true, 4], ['Sağlık sensörleri', 'Özellikler', '', null, 4], ['GPS', 'Özellikler', '', null, 2],
    ['Suya dayanıklılık', 'Gövde', '', null, 2], ['Hücresel', 'Bağlantı', '', null, 2], ['Uyumluluk', 'Yazılım', '', null, 3],
    ...ORTAK_SON,
  ],
  audio: [['Tür', 'Genel', '', null, 4], ['Bağlantı', 'Bağlantı', '', null, 3], ['Pil süresi', 'Güç', 'saat', true, 3], ...ORTAK_SON],
  pad: [['Tür', 'Genel', '', null, 4], ['Uyumluluk', 'Genel', '', null, 4], ['Bağlantı', 'Bağlantı', '', null, 3], ['Pil süresi', 'Güç', 'saat', true, 3], ...ORTAK_SON],
  accessory: [['Tür', 'Genel', '', null, 4], ['Uyumluluk', 'Genel', '', null, 4], ...ORTAK_SON],
  other: [['Tür', 'Genel', '', null, 4], ...ORTAK_SON],
}

/** Şablondan boş özellik satırları (Payload "specs" dizisi biçiminde) */
export const sablonSatirlari = (tur: string) => (URUN_SABLONLARI[tur] ?? URUN_SABLONLARI.other).map(([key, group, unit, iyi, w]) => ({
  key, group, unit: unit || undefined, value: null, num: null, source: 'uretici', higherIsBetter: iyi === null ? false : iyi, searchWeight: w,
}))
