/** Araçlar (offocus yol haritası 1, 25 Ekim 2026; dolunay, alan derinliği, timelapse 31 Ekim 2026 toplantı notundan): herkese açık hesaplayıcılar; üyelik zorunlu değil. Liste sayfası ve yan menü buradan. */
export const ARACLAR = [
  { grup: 'Prodüksiyon', yol: '/araclar/storyboard', ad: 'Storyboard', kisa: 'Storyboard', aciklama: 'Kare kare çekim planı: çizim, plan ölçeği, hareket, süre; PNG olarak indir.' },
  { grup: 'Prodüksiyon', yol: '/araclar/maliyet', ad: 'Çekim maliyet hesaplayıcı', kisa: 'Maliyet', aciklama: 'Ekip, ekipman, mekân ve kurgu kalemleriyle TL bütçe, pay ve KDV.' },
  { grup: 'Prodüksiyon', yol: '/araclar/ekipman-listesi', ad: 'Ekipman kontrol listesi', kisa: 'Ekipman listesi', aciklama: 'Çekim türüne göre hazır liste; çıkmadan önce tek tek işaretle.' },
  { grup: 'Planlama', yol: '/araclar/dolunay', ad: 'Dolunay ve ay evresi', kisa: 'Dolunay', aciklama: 'Ay evresi, ilindeki ay doğuşu, sonraki dolunay ve süper ay takvimi.' },
  { grup: 'Lens ve kadraj', yol: '/araclar/alan-derinligi', ad: 'Alan derinliği hesaplayıcı', kisa: 'Alan derinliği', aciklama: 'Netliğin başladığı ve bittiği mesafe, hiperfokal mesafe, kadraj genişliği.' },
  { grup: 'Planlama', yol: '/araclar/timelapse', ad: 'Timelapse hesaplayıcı', kisa: 'Timelapse', aciklama: 'Aralık, kare sayısı, video süresi ve kart alanı; bulut, gün batımı, yıldız ayarları.' },
  { grup: 'Planlama', yol: '/araclar/astro', ad: 'Astrofotoğraf hesaplayıcı', kisa: 'Astrofotoğraf', aciklama: 'Yıldızlar iz bırakmadan en uzun enstantane: 500 ve NPF kuralı.' },
  { grup: 'Planlama', yol: '/araclar/altin-saat', ad: 'Altın saat hesaplayıcı', kisa: 'Altın saat', aciklama: '81 il için gün doğumu, gün batımı, altın saat ve mavi saat.' },
  { grup: 'Pozlama ve ışık', yol: '/araclar/nd-filtre', ad: 'ND filtre hesaplayıcı', kisa: 'ND filtre', aciklama: 'ND filtre takınca enstantaneyi kaç saniyeye çıkarman gerektiğini hesapla.' },
  { grup: 'Lens ve kadraj', yol: '/araclar/lens-gorunumu', ad: 'Lens görünümü', kisa: 'Lens görünümü', aciklama: 'Odak uzaklığına göre yüz perspektifi, arka plan ve konuya uzaklık.' },
  { grup: 'Pozlama ve ışık', yol: '/araclar/studyo-isik', ad: 'Stüdyo ışık simülasyonu', kisa: 'Stüdyo ışığı', aciklama: 'Işığı döndür: Rembrandt, loop, butterfly; yumuşaklık ve pozlama farkı.' },
  { grup: 'Pozlama ve ışık', yol: '/araclar/flas', ad: 'Flaş hesaplayıcı', kisa: 'Flaş', aciklama: 'Kılavuz sayısına göre diyafram ya da flaşın yeteceği en uzak mesafe.' },
  { grup: 'Lens ve kadraj', yol: '/araclar/makro', ad: 'Makro hesaplayıcı', kisa: 'Makro', aciklama: 'Büyütme oranı, uzatma tüpü, kadraj alanı ve etkin diyafram.' },
  { grup: 'Pozlama ve ışık', yol: '/araclar/agir-cekim', ad: 'Ağır çekim hesaplayıcı', kisa: 'Ağır çekim', aciklama: 'Kare hızına göre yavaşlama, ekranda süre, enstantane ve ışık kaybı.' },
  { grup: 'Ekipman ve çıktı', yol: '/araclar/dron-gsd', ad: 'Dron GSD hesaplayıcı', kisa: 'Dron GSD', aciklama: 'Uçuş yüksekliğine göre cm/piksel ve tek karenin yerde kapladığı alan.' },
  { grup: 'Ekipman ve çıktı', yol: '/araclar/batarya', ad: 'Batarya ömrü hesaplayıcı', kisa: 'Batarya', aciklama: 'Yedek pil, soğuk hava ve powerbank ile toplam çekim süresi.' },
  { grup: 'Lens ve kadraj', yol: '/araclar/krop-faktor', ad: 'Krop faktör hesaplayıcı', kisa: 'Krop faktör', aciklama: 'Odak uzaklığının ve diyaframın full frame karşılığını bul.' },
  { grup: 'Ekipman ve çıktı', yol: '/araclar/sd-kart', ad: 'SD kart kayıt süresi', kisa: 'SD kart', aciklama: 'Kartına kaç dakika video sığar, hangi hız sınıfı gerekir.' },
  { grup: 'Ekipman ve çıktı', yol: '/araclar/baski-boyutu', ad: 'Baskı boyutu hesaplayıcı', kisa: 'Baskı boyutu', aciklama: 'Fotoğrafını kaliteli olarak en fazla kaç santim basabilirsin.' },
] as const
export const GRUPLAR = ['Prodüksiyon', 'Planlama', 'Pozlama ve ışık', 'Lens ve kadraj', 'Ekipman ve çıktı'] as const
