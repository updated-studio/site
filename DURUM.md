# Durum (ortak hafıza: her oturum okur, her iş sonunda günceller)

## Şu an (23 Ekim 2026, 16:45)
- **Site:** https://updated.com.tr (23 Ekim'den beri canlı; Astro, statik; https açık, http → https). Kod: bu depo `apps/web`. GitHub Actions derler, Natro paylaşımlı hostinge FTP ile yükler (`.github/workflows/yayin.yml`). v2.updated.com.tr artık kullanılmıyor.
- **Panel (Payload):** https://panel.updated.com.tr/admin — Natro VPS (Ubuntu 24.04, 2 çekirdek, 3,8 GB + 4 GB takas), Caddy + systemd `updated-panel`. Kod `apps/cms`; `apps/cms/**` değişince `.github/workflows/panel.yml` sunucuyu günceller.
- **Veritabanı + giriş + görseller + Stüdyo fonksiyonları:** Natro VPS'te Supabase'in açık kaynak sürümü (`/opt/updated/supabase`, Docker; dışarıya `panel.updated.com.tr/{rest,auth,storage,realtime,functions}/v1`). Panel verisi `payload` şeması, görseller `media` kovası. Bulut projeleri (site `werbsodzhfxliffveexk`, Stüdyo `fulmooonidwrqyybbkvu`) yedek olarak duruyor, kullanılmıyor.
- **Stüdyo ekranı:** Natro'da hazır ve çalışıyor (`deploy/altyapi/studyo`), **DNS değişikliği bekliyor**; şu an ziyaretçiler hâlâ GitHub Pages'teki kopyayı görüyor (aşağıda "Sıradaki işler" 1).
- **Yayın akışı:** panelde Yayınla → GitHub `repository_dispatch` → site derlenir, ~3-5 dk. Son dakika şeridi `/api/canli` ile anlık.
- **Haber Masası → panel:** Stüdyo'nun otomatik ve elle hazırlanan taslakları doğrudan panele gidiyor (studio PR #24, #25). WordPress'e hiçbir şey gitmiyor.
- **WordPress kapalı (23 Ekim 15:50):** `deploy/canli.json` wordpress=false; wp-json, xmlrpc, wp-cron, index.php → 410; wp-admin/wp-login → panel. Dosyaları hosting'de, veritabanı Natro'da duruyor (silme 30 Ekim, Fatih onayıyla; tam yedek var). Taşınanlar: 189 haber, 18 kategori, 10 yazar, 537 görsel, 3 kurumsal sayfa; eski adresler 301.
- **Yedek:** her gece 03:15, şifreli, Natro hosting'de son 7 gün (`deploy/altyapi/yedek`); veritabanı + dosyalar + kodun tam geçmişi + sunucu ayarları. Kurtarma: `KURTARMA.md`.
- **E-posta:** Natro giden posta portları açık (465/587/25); şifre sıfırlama ve Stüdyo bildirimleri gidiyor.
- **Natro bot koruması** ("One moment, please…") GitHub'dan yapılan dış kontrollerin siteyi görmesini engelleyebiliyor; ziyaretçiler etkilenmiyor.

## Çalışma biçimi ve erişim
- **Fatih teknik değil:** adım adım, sade Türkçe anlat. Ayar değiştirmesi gerekirse ilgili sayfanın doğrudan bağlantısını ver. Her açıklamada "neden" ve "bedeli" kısaca yer alsın. Kim neye karar verir: `CLAUDE.md` kural 8.
- **Claude hesapları:** Fatih'in ve Enes'in claude.ai hesapları var; biri limitine ulaşınca diğerine geçilir. Ortak hafıza bu dosya, sohbet geçmişine güvenilmez.
- **Claude sunucuda:** `updated` kullanıcısı Fatih'in hesabına bağlı (Remote Control oturumu "Natro sunucu", tmux `claude`; `claude-sunucu durum`). Sunucu işleri bu oturumda doğrudan yapılır, GitHub turu yok. Tarayıcıdaki "Natro sunucu" oturumu için Fatih'in bir kez e-posta onayı gerekiyor. `enes` kullanıcısı hazır (sunucu açılışında oturum kendiliğinden başlar) ama **Enes henüz giriş yapmadı**: `ssh updated@136.144.200.84` → `sudo -iu enes claude-giris`.
- **Sunucuya bağlanma:** `ssh updated@136.144.200.84` (şifreyle; şifre zarfta). `updated` kullanıcısında şifresiz sudo var.
- **Sunucudaki kopyalar:** `/opt/updated/site` panelin canlı kopyası (her panel güncellemesinde sıfırlanır, düzenleme yapılmaz); site çalışma kopyası `/opt/updated/calisma/site`; Stüdyo `/opt/updated/studio`.
- **Erişimler Fatih + Enes'te;** ek olarak **basılı kapalı zarf** hazırlanacak: Natro, GitHub + iki adımlı doğrulama kurtarma kodları, yedek şifresi, VPS şifresi, studio@updated.com.tr şifresi. Fatih iki adımlı doğrulama için Google Authenticator kullanıyor (telefon kaybında kurtarma kodları zarftan).

## Sıradaki işler (Fatih, 23 Ekim 16:05; bu sırayla)
0. Oturum başında: `cd /opt/updated/calisma/site && git pull` ve `cd /opt/updated/studio && git pull`.
1. **Stüdyo ekranı GitHub Pages'ten Natro'ya** (Fatih: "Stüdyo tamamen Natro'da, GitHub'la konuşmasın"). **Sunucu tarafı bitti (23 Ekim 16:35):** sunucu 2 dakikada bir Stüdyo deposunun `main` dalına bakar; değişiklik varsa ekranı derler (~40 sn) ve değişen fonksiyonları Natro'daki Supabase'e yükler (`updated-studyo.timer`, `/usr/local/bin/updated-studyo-yayinla`). Derleme hata verirse eski sürüm yayında kalır; son 5 sürüm saklanır. Caddy: `/etc/caddy/conf.d/studyo.caddy`. Kalan: **(a)** Fatih Natro DNS'te `studio` kaydını `updated-studio.github.io` yerine `panel.updated.com.tr` yapar → **(b)** Claude sertifikayı ve girişi dener → **(c)** Stüdyo deposunda `.github/workflows/yayin.yml` ve `fonksiyonlar.yml` kapatılır, GitHub Pages ayarı kapatılır (Fatih onayıyla).
2. **`YEDEK_SIFRESI`:** Fatih belirler (şifre yöneticisi + zarf). Sunucuda `/opt/updated/yedek/sifre` onunla değiştirilir, yedek yeniden alınır.
3. **İkinci yedek kopyası (Natro dışı):** haftada bir şifreli yedek Fatih'in Mac'ine kendiliğinden insin (GitHub deploy key kuruluş kuralıyla kapalı; açılmayacak).
4. **Panel arayüzü:** "Taslaklar" ve "Yayında" ayrı menüler; panel Stüdyo tarzı, marka kitiyle, kullanımı kolay.
5. **30 Ekim 2026:** WordPress dosyaları (hosting) silinir; WordPress MySQL veritabanını Fatih Natro panelinden siler (Fatih onayıyla; site WordPress'e bağlı değil, doğrulandı).
6. Supabase bulut projeleri ~1-2 hafta sorunsuz çalışınca silinir; yedek deposundaki eski bulut yedek iş akışları kapatılır.
7. Tek giriş (Stüdyo + panel + site üyeleri, sunucudaki Supabase Auth) — yol haritası Otomasyon-1.
8. Kod için Forgejo (Natro'da) isteğe bağlı; GitHub salt okunur ayna olarak kalır (Fatih onayladı).

## Diğer açık işler
- [ ] **Sunucudan GitHub'a yazma yetkisi yok:** sunucudaki Claude değişiklikleri yerel olarak kaydedebiliyor ama depoya gönderemiyor (23 Ekim 16:40 itibarıyla `/opt/updated/calisma/site` ve `/opt/updated/studio`'da gönderilmemiş kayıtlar var). Çözüm Fatih'in kararı bekliyor.
- [ ] Flux (Fatih'in Mac'i): işçinin adresi `https://panel.updated.com.tr/functions/v1/triyaj-taslak` + yeni FLUX_TOKEN (sunucuda `functions.env`; güvenli yoldan verilecek).
- [ ] Google Search Console'a yeni site haritası; 301'ler kontrol edilir.
- [ ] Fotoğrafçılık bölümü baştan tasarlanacak (eski dosyalar kullanılmayacak; Fatih ile).
- [ ] Cloudflare (ücretsiz) önerildi: Natro'nun kör bot koruması yerine ayarlanabilir koruma + önbellek.

## Tüm altyapıyı Natro'ya taşıma (Fatih, 23 Ekim 05:00: "en önemli öncelik"; sebep: hepsi bir arada, daha hızlı, daha güvenli, aracı yok)
- **Sunucu büyütülmedi:** site derlemesi 20 sn, Supabase yalın kurulumda ~850 MB; mevcut VPS yetiyor (ilk "kaldırmaz" ölçümü yanlıştı, Fatih itiraz etti, haklıydı).
- **Aşama 1 BİTTİ (05:30):** 4 GB takas + Docker + yalın Supabase (`deploy/altyapi`; yönetim ekranı/imgproxy/havuz/kayıt yok). Panel verisi ve görselleri (3.138 dosya, 177 MB) Natro'da; panel `/etc/updated-panel.yerel` ile bağlı (silinirse buluta döner). S3 ucu `https://panel.updated.com.tr/storage/v1/s3` (imza genel adrese göre).
- **Aşama 2 BİTTİ (07:45):** Stüdyo'nun Supabase'i (22 tablo, 9.027 kayıt, 8 hesap, 3 kova, 8 zamanlanmış iş, 4 fonksiyon) taşındı. Fonksiyon gizli bilgileri `/opt/updated/supabase/functions.env`.
- **Aşama 3 BİTTİ (14:35):** Natro gece yedeği.
- **Aşama 4 (sürüyor):** Stüdyo ekranı Natro'ya (Sıradaki işler 1), sonra isteğe bağlı Forgejo.

## Günlük (en yeni üstte)
- **23 Ekim 2026 16:45** (Natro sunucusundaki Claude, Fatih'in hesabı): Fatih: "Stüdyo'yu Natro'ya taşı, eskimiş maddeleri temizle." Yapılan: Stüdyo ekranı sunucuda derlenip yayınlanıyor (`deploy/altyapi/studyo`: `studyo` kullanıcısı, 2 dakikalık zamanlayıcı, Caddy `conf.d/studyo.caddy`, yerel deneme ucu 127.0.0.1:8090; ilk derleme 38 sn, dosyalar GitHub Pages'tekiyle aynı). Sunucudaki fonksiyonlar depodakiyle birebir aynıydı. `deploy/panel/kur.sh` artık `conf.d`'yi içe alıyor (Caddyfile yeniden üretilince Stüdyo düşmesin). Stüdyo kalıcı olarak `/opt/updated/studio`'da, site çalışma kopyası `/opt/updated/calisma/site`. `enes` kullanıcısının `@reboot` satırı eklendi. `CLAUDE.md`: kural 8 (kim neye karar verir) + 9 (sunucudaki kopyalar); bu dosyada eskimiş maddeler temizlendi, "Çalışma biçimi ve erişim" bölümü eklendi. Bekleyen: Fatih'in DNS değişikliği; sunucudan GitHub'a yazma yetkisi.
- **23 Ekim 2026 07:50** (Fatih'in Claude'u): Fatih: "her şey Natro'da, aracı olmasın". Aşama 1 (panel verisi + görseller) ve aşama 2 (Stüdyo'nun Supabase'i) Natro'ya taşındı; ayrıntı "Tüm altyapıyı Natro'ya taşıma" bölümünde. Fatih yol haritasını verdi (aşağıda "Yol haritası"); önce altyapı temelleri bitecek.
- **23 Ekim 2026 04:35** (Fatih'in Claude'u): Fatih: "Stüdyo taslaklarını doğrudan Payload'a gönderelim, bitince WordPress tamamen devreden çıksın." Yapılan (PR #1): `/api/triyaj/import` sağlamlaştırıldı (yayındaki/panelde düzenlenmiş taslağın üzerine yazmaz → 409 `yayinda`/`duzenlendi`, `force` ile yazılır; kategori yalnız var olanlardan → 422; görsel aynı adresse yeniden yüklenmez; SEO başlık/açıklama; etiketler `seo.geo.entities` (eski kod yanlış yere yazıyordu); güncellemede iş akışı durumu sıfırlanmaz), yeni uçlar `/api/triyaj/durum` ve `/api/triyaj/kapak`; panel iş akışına "Stüdyo anahtarını eşitle" (sunucudaki `STUDIO_IMPORT_KEY` → Stüdyo Supabase Secrets, `SUPABASE_ACCESS_TOKEN` gerekir); `deploy/canli.json` `wordpress` anahtarı (false → `.htaccess` wp-json/xmlrpc/PHP kapalı, wp-admin panele); PR'larda panel tip denetimi (`kontrol.yml`). Bu çalışma ortamından panel ve npm'e erişilemedi; doğrulama GitHub'da. Stüdyo tarafı: studio PR #24.
- **23 Ekim 2026 04:20** (Fatih'in Claude'u): **updated.com.tr yeni sisteme geçti** (Fatih'in isteği, yedeksiz). `deploy/canli.json` canli=true; FTP `canli@updated.com.tr` → public_html. WordPress dosyaları klasörde duruyor (wp-admin, wp-json, wp-content çalışır; Stüdyo taslakları gitmeye devam eder). v2 artık güncellenmiyor. Sıradaki: Stüdyo → Payload bağlantısı, Search Console'a site haritası, v2'yi ana adrese yönlendirme.
- **23 Ekim 2026** (Fatih'in Claude'u): Görseller yeni kaliteyle yeniden üretildi (537/537). Stüdyo'da etiket kuralı (en fazla 3, izinli liste) ve otomatik taslak ataması duraklatıldı (Stüdyo deposu; Edge Function yayını için `SUPABASE_ACCESS_TOKEN` secret'ı bekleniyor). Eski site raporu: `deploy/rapor` (çıktı `raporlar` dalında). Bu dosya ve `CLAUDE.md` eklendi.
- **22 Ekim 2026** (Fatih'in Claude'u): WordPress taşıması, görsel onarımı, kurumsal sayfalar, eski adres yönlendirmeleri, panel Türkçe + logo, yayın anahtarı.

## Yol haritası (Fatih, 23 Ekim 2026; altyapı temelleri bittikten sonra sırayla)
Görsel: (1) Payload panel görünümü · (2) Stüdyo İçerik tasarım aracı: ana şablon kararı + yeni örnekler · (3) site arayüzü eksikleri, (3b) sonra geliştirme · (4) kategori/haber sayfalarında boş sağ sütun: reklam, önerilenler, günün önerisi, reels · (5) temaya göre ters logo · (6) marka kitinin sitenin tamamına uygulanması.
Otomasyon: (1) Stüdyo ↔ Payload tam bağlantı, tek kullanıcı girişi · (2) taslak Payload'a tam hazır gelir (SEO, GEO, adres, metadata, zorunlu düzenlemeler) · (3) tasarım aracına düşen haberin türü Story/Post'u belirler · (4) siteye eklenen haber Stüdyo tasarım aracına düşer (hangi editör girdiyse onda).
Panel/altyapı: (1) hızlı yorum + üyelik, puan kazanma · (2) panelde sitenin ayrıntılı ayarları · (3) kullanıcı sistemi (bot koruması, güvenlik) · (4) profillere ekipman ilerlemesi (kamera → lens → gimbal) · (5) "offocus"tan özellik listesi çekme.
