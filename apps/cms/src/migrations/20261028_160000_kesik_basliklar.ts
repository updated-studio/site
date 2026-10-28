import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Kesik başlıklar (28 Ekim 2026, kullanıcı onayı): 91 yayındaki haberin başlığı 66 karakterde kelime ortasından kesilmişti, tam hâli spotta duruyordu.
 * Tam hâli 70 karaktere (kit LIMIT.title) sığan 5 haberde tam başlık geri yüklenir; sığmayan 86'sı anlamı korunarak 70 karaktere yeniden yazıldı.
 * Yalnız başlığı hâlâ spotun başı olan (yani hâlâ kesik olan) haber değişir; elle düzeltilmiş olana dokunulmaz. Eski başlık sürüm geçmişinde kalır.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(`
  with yeni(id, baslik) as (values
    (4, 'Gemini 4 Çok Yakında: Google Yeni Yapay Zekâ Modelini Hazırlıyor'),
    (5, 'Apple Music Hall’ın İlk Sekiz Konseri Açıklandı: Açılış Elton John’dan'),
    (6, 'Microsoft Yöneticisi: Yapay Zekâ Veri Kazıması “Büyük Emek Hırsızlığı”'),
    (12, 'Nvidia RTX Spark Çıktı: Yeni İşlemcili İlk Dizüstüler Siparişte'),
    (13, 'MagSafe Flex Pouch Tanıtıldı: Telefonun Arkasına Esnek Depolama Kesesi'),
    (15, 'CRKD Nitro Deck 2 Çıktı: Switch 2’ye Steam Deck Hissiyatı Getiriyor'),
    (16, 'AstrHori 8mm f/2.4: Orta Format İçin 220 Derece Balıkgözü Lens'),
    (17, 'Amazon’dan Yapay Zekâlı Not Alma Cihazları: Bee Frontier ve Eclipse'),
    (19, 'LG Display FLiPP OLED’i Duyurdu: Daha Ucuz ve Verimli Paneller Yolda'),
    (20, 'UGREEN 25W MagSafe Batarya Tanıtıldı: Sıvı Soğutmalı Tasarım'),
    (22, 'Samsung One UI 10 Hazırlığında: Arayüzde Büyük Değişim Kapıda'),
    (25, 'Anbernic RG DDS Tanıtıldı: Çift Ekranlı Konsolun Fiyatı Belli Oldu'),
    (26, 'Microsoft Maia 300 Duyuruldu: Nvidia’ya Bağımlılık Azalıyor'),
    (28, 'Mercedes-AMG GT SUV Tanıtıldı: 1153 Beygirlik Elektrikli Aile Aracı'),
    (29, 'Sennheiser’ın İlk Açık Kulaklığı Accentum Clip: Satışı Şaşırttı'),
    (30, 'Apple Pro and Tell Duyuruldu: İlk Dokunmatik MacBook’lar ve M6 Yolda'),
    (32, 'Toyota Corolla Elektrikli Oluyor: Yeni Nesil Model 2028’de Çin’de'),
    (33, 'Final Porta Tanıtıldı: 40 Gram Ağırlığında Sıra Dışı Kablosuz Kulaklık'),
    (34, 'Samsung’un 2027 Katlanabilirleri Sızdı: Galaxy Z Slide ve TriFold 2'),
    (35, 'Vivo X500 Ultra Sızdı: Ultra Telefonlar 2027’de de Sürecek mi?'),
    (36, 'Motorola Razr Flex Geekbench’te: Snapdragon 8 Gen 5 ile Geliyor'),
    (37, 'KillSwitch Tanıtıldı: Yapay Zekâyı Şaşırtan Yeni Programlama Dili'),
    (38, 'Elgato Wave Go Tanıtıldı: Hem Yaka Hem El Tipi Kablosuz Mikrofon'),
    (39, 'Japonya Kamera Pazarında APS-C: İlk 10’daki Tek Full Frame Sony A7 V'),
    (44, 'Sony Kando Vlog: Fotoğraf Severler İçin Yeni Lensler ve Kameralar'),
    (46, 'Movmax Blade Arm İncelemesi: Gimbal Fiyatına Hollywood Araç Çekimi'),
    (48, 'Hayallerdeki Bilgisayarı Topluyoruz: Erdi Özüağ ile Sistem Toplama'),
    (49, 'DJI Avata360 Detaylı İnceleme: A1 mi Yoksa Avata360 mı?'),
    (55, 'Sony FX5’in Çıkış Takvimi Değişti: Yeni Tarih Ekim Ortasını Gösteriyor'),
    (60, 'Dijital Kamerana Analog Ruhu Getir: Sony Yaratıcı Görünüm Rehberi'),
    (75, 'Apple Watch Ultra 4: Daha Uzun Pil, Daha Sık Ölçüm ve Yapay Zekâ'),
    (76, 'DJI SDR Transmission II ile Profesyonel Görüntü Aktarımı Güçleniyor'),
    (79, 'DJI Neo 3 Kutusu Sızdı: Yeni Kumanda ve Paket İçeriği Ortaya Çıktı'),
    (81, 'iCloud+ Türkiye’de Büyüyor: Apple TV ve Apple Arcade Pakete Dahil'),
    (85, 'Xiaomi 18 Fold Satışta: Büyük Batarya ve 200 MP Kamera Öne Çıkıyor'),
    (88, 'Siri Baştan Yenilendi: Apple’ın Yeni Yapay Zekâ Asistanı Kullanımda'),
    (93, 'Yeni Mac mini ve Mac Studio Yarın Satışta: Türkiye Tarihi de Belli'),
    (96, 'Mac mini M6 İncelemesi: Küçük Kasada Daha Fazla Güç, Daha Yüksek Fiyat'),
    (100, 'Apple Music Hall Açıldı: Uzamsal Ses ve Çoklu Kamerayla Konser'),
    (101, 'Huawei Mate 90 Serisi Ortaya Çıktı: Yeni Kirin Çip ve Güçlü Kamera'),
    (102, 'Meta Connect 2026 Başlıyor: Yeni Akıllı Gözlükler ve Muse Yapay Zekâ'),
    (104, 'MacBook Ultra Geliyor: Dokunmatik OLED Ekran ve Daha İnce Tasarım'),
    (105, 'DJI Osmo 360 II İncelemesi: 8K 60p ve Değiştirilebilir Lensler'),
    (107, 'Chrome Kaldığın Yeri Hatırlıyor: Cihazlar Arası Geçiş Kolaylaşıyor'),
    (108, 'Google Mesajlar’da Uzun Basma Menüsü: Metnin İstediğin Kısmını Kopyala'),
    (109, 'Google Mesajlar’a Resmî Sohbet Geldi: Yenilikler Uygulama İçinde'),
    (110, 'Meta 1.300 Dolarlık VR Gözlüğünü Tanıttı: Çıkış Tarihi de Netleşti'),
    (112, 'Meta, VR Glasses için 1 milyon dolarlık geliştirici yarışması başlattı'),
    (114, 'Xiaomi Pad 9 ve Pad 9 Pro Tanıtıldı: 144 Hz Ekran ve Snapdragon Gücü'),
    (115, 'Meta VR Glasses İçin Yeni Oyunlar: Beat Saber ve Tetris Öne Çıkıyor'),
    (116, 'Gemini’ye Özel Koyu Mod Geliyor: Sistem Ayarından Bağımsız Çalışacak'),
    (119, 'Insta360 Luna Ultra’ya Büyük Güncelleme: 15x Zoom ve 4K Dikey Video'),
    (122, 'Yeni iPad mini Sızıntısı: A20 Pro Çip, OLED Ekran ve Yatay Kamera'),
    (123, 'Apple’dan iPhone, iPad ve Mac İçin Yeni Çocuk Güvenliği Özellikleri'),
    (124, 'Samsung Galaxy SmartTag 3: iPhone Desteği ve 790 Güne Varan Pil Ömrü'),
    (127, 'Apple’dan Final Cut Camera 2.4 ve Final Cut Pro 12.4 Güncellemesi'),
    (132, 'Galaxy S27 Ultra’da Yeni Kamera İşleme: Sıcak Renk, Temiz Gece Çekimi'),
    (133, 'Samsung Galaxy S26 Fiyatlarını Artırdı: Ultra 1 TB Artık 1.999 Dolar'),
    (135, 'Philips Sonicare 9900 Prestige: Yapay Zekâyla Fırçalama Takibi'),
    (138, 'Samsung Galaxy Buds On: Açık Kulak Tasarımı ve Gemini Live Desteği'),
    (139, 'Gemini Spark Pixel Kullanımını Değiştirdi: Chrome ve Gmail Geri Planda'),
    (140, 'Exynos 2700 İçin Seri Üretim İddiası: Snapdragon’dan Hızlı Olabilir'),
    (141, 'Gemini 4 Argon Erken Testlerde Öne Çıktı: Hata Oranı Düşük'),
    (143, 'YouTube Web’de Oturum Hatası: Bazı Kullanıcılar Hesabına Giremiyor'),
    (145, 'Google’ın Project Suncatcher Uydusu Yörüngede: Veri Merkezi Uzaya mı?'),
    (146, 'Apple Arcade’e Beş Yeni Oyun: Terraria+ ve Pusheen’s Place Öne Çıkıyor'),
    (147, 'Insta360 Kameraları 3D Tarayıcıya Dönüşüyor: Spatial Capture Duyuruldu'),
    (148, 'Apple, iPhone Duo ile Çekilen Fotoğrafları Paylaştı'),
    (150, 'Honor Magic9 Lite+ Sızdı: Snapdragon 6 Gen 5 ve 8 GB RAM ile Geliyor'),
    (151, 'Google’dan Görme Engelliler İçin Yapay Zekâlı Kamera: Guided Vision'),
    (152, 'Googlebook’un Viewer Uygulaması: Fotoğraf, Video, Ses ve PDF Tek Yerde'),
    (153, 'Apple HomePad’in Kurulumu Sızdı: iCloud Fotoğraflar ve “Photo Face”'),
    (154, 'Apple Store’lara Gizli Kutular Ulaştı: 13 Ekim’de Üç Akıllı Ev Ürünü'),
    (155, 'Fitbit Air Hindistan’da Satışta: Ekransız Tasarım ve Sağlık Takibi'),
    (156, 'Apple Notes, iOS 27 ile Uzun Metin Yazımında Daha Güçlü Hale Geliyor'),
    (157, 'iOS 27’de Fotoğraflar Güçleniyor: Yeni Slaytlar ve Tam Çözünürlük'),
    (158, 'YouTube Shorts Algoritması Değişiyor: Özgün İçerikler Öne Çıkacak'),
    (159, 'Giriş Seviyesi iPad Sızdı: A19 Çip, 8 GB RAM ve Wi-Fi 7 Geliyor'),
    (160, 'Sony FE 8-14mm F3.5 Fisheye G, VR180 İçin Çift Lensli Rig ile Geldi'),
    (163, 'Apple iPhone 18 Pro Siparişlerini Düşürdü: Zamdan Sonra Talep Zayıf'),
    (171, 'Apple ve LG’den Akıllı Ev Hamlesi: Kapı Zili, Kilit ve Termostat Yolda'),
    (172, 'Google Nano Banana 2.1 Yayında: Görsel Kalite ve Metin Üretimi Gelişti'),
    (173, 'Google Japonya’dan Sıra Dışı Gboard: Tuşlar Konveyör Bant Üzerinde'),
    (175, 'Chrome Android’de Şifre Doldurmadan Önce Biyometrik Doğrulama Testi'),
    (176, 'ShiftCam ProRig: Apple Geri Bildirimiyle Modüler iPhone Kamera Sistemi'),
    (179, 'Beats Pill’e Özel Pokémon Sürümü: Pikachu ve Mimikyu Aynı Gövdede'),
    (180, 'Yıllardır Beklenen An Geldi: Yeni Nesil Tesla Roadster Sahneye Çıkıyor'),
    (181, 'ASUS ExpertBook A7: 3K OLED Ekran ve Hafif Alüminyum Gövdeyle Geliyor'),
    (182, 'Epic Games Launcher Yapay Zekâyla Yeniden Yazıldı: Steam’den Hızlı'),
    (186, 'Viltrox 26mm f/2.8 FE: Kompakt Pancake Lense Yeni Renk Seçenekleri'),
    (192, 'AnyPS5 Projesinde Kritik Eşik: PS5 Oyunları PC’de Çalışabilecek mi?')
  ), deg as (
    update payload.news n set title = y.baslik, updated_at = now() from yeni y
    where n.id = y.id and n.spot ilike n.title || '%' and length(n.spot) > length(n.title) + 3
    returning n.id, n.title
  )
  update payload._news_v v set version_title = d.title from deg d
  where v.parent_id = d.id and v.latest = true;`))
}

export async function down(_: MigrateDownArgs): Promise<void> {
  // Geri alma yok: eski (kesik) başlıklar sürüm geçmişinden tek tek geri yüklenebilir
}
