# Durum (ortak hafıza: her oturum okur, her iş sonunda günceller)

## Şu an (23 Ekim 2026)
- **Site:** https://updated.com.tr (23 Ekim'den beri canlı; Astro, statik). Eski hazırlık adresi v2.updated.com.tr. Kod: bu depo `apps/web`. GitHub Actions derler, Natro paylaşımlı hostinge FTP ile yükler (`.github/workflows/yayin.yml`). https yok (Natro'dan v2 için SSL istenecek).
- **Panel (Payload):** https://panel.updated.com.tr/admin — Natro VPS (Ubuntu 24.04, kullanıcı `updated`), Caddy + systemd `updated-panel`. Kod `apps/cms`; `apps/cms/**` değişince `.github/workflows/panel.yml` sunucuyu günceller.
- **Veritabanı + görseller:** Supabase projesi `updated-site` (Londra, ref werbsodzhfxliffveexk), şema `payload`, kova `media`. Gece yedeği: `updated-studio/yedek` deposu.
- **Yayın akışı:** panelde Yayınla → GitHub `repository_dispatch` (secret `YAYIN_TOKEN`, sunucuda `GITHUB_DISPATCH_TOKEN`) → site derlenir, ~3-5 dk. Son dakika şeridi `/api/canli` ile anlık.
- **WordPress taşıması bitti:** 189 haber, 18 kategori, 10 yazar, 537 görsel, 3 kurumsal sayfa; eski adresler 301 (`apps/web/src/redirects.json` + `postbuild.mjs` kalıpları). Etiketler taşınmadı (bilerek; aramaya yönlenir). WordPress tam yedeği alındı (Fatih kontrol etti).
- **Görseller:** asıl WebP %88, türevler %72–78 (`apps/cms/src/collections/Media.ts`); WordPress 945 MB → 185 MB.
- **Natro bot koruması** ("One moment, please…", openresty) 23 Ekim gecesi açıldı; GitHub'dan yapılan dış kontroller (teşhis, `deploy/kontrol`) siteyi göremiyor. Ziyaretçiler etkilenmiyor.

## Bekleyenler
- [ ] v2 için SSL + bot korumasını Natro destekten iste (Fatih).
- [ ] Ana alan adına geçiş (aşağıdaki plan) — Fatih onayıyla.
- [ ] **Stüdyo → Payload bağlantısı (kod hazır, 23 Ekim 04:30–):** site PR #1 + studio PR #24. Site PR #1 **birleşti, panel güncel (05:00)**. Sıra: (1) Fatih `SUPABASE_ACCESS_TOKEN`'ı site ve studio depolarına secret olarak girer → (2) panel iş akışı elle yeniden çalıştırılır (anahtar Supabase'e yazılır) → (3) Stüdyo'da "Veritabanı göçü" 0024 → (4) studio PR birleşir (fonksiyon + ekran) → (5) Stüdyo → Ayarlar → "Bağlantıyı dene" + bir taslak gönderimi → (6) `deploy/canli.json` `"wordpress": false` (WordPress'in PHP girişleri kapanır; dosyalar silinmez, eski görseller açık kalır).
- [ ] Fotoğrafçılık bölümü baştan tasarlanacak (eski dosyalar kullanılmayacak; Fatih ile).
- [ ] Ekip hesapları panelde; Stüdyo ile tek giriş.
- [ ] Cloudflare (ücretsiz) önerildi: Natro'nun kör bot koruması yerine ayarlanabilir koruma + önbellek.

## Ana alan adına geçiş (23 Ekim gecesi, Fatih: "bu gece aktaracağız")
Yöntem: **WordPress silinmez, taşınmaz.** Yeni site `public_html`'e WordPress'in yanına yüklenir; `.htaccess` (eskisi `.htaccess.wp-yedek`) ziyaretçiyi yeni siteye, `wp-admin`, `wp-json` (Stüdyo taslakları), `wp-content` (eski görsel adresleri) isteklerini WordPress'e verir. Anahtar: `deploy/canli.json` (`canli`, `prova`); FTP: `CANLI_FTP_USER/PASSWORD` secret'ları (public_html'e bağlı hesap).
- **Geri dönüş (2 dk):** FTP ile `public_html/.htaccess.wp-yedek` → `.htaccess` adıyla geri koy ve `index.html`'i sil (ya da adını değiştir); WordPress olduğu gibi döner. Sonra `deploy/canli.json` → `"canli": false`.
- Kalıcı çözüm sonrası: Stüdyo taslakları panele bağlanınca WordPress `eski.updated.com.tr`'ye alınır.

## Eski plan notu
1. Stüdyo taslakları panele gidecek şekilde bağlanır, ekip bir gün v2'de dener.
2. WordPress `eski.updated.com.tr` alt alan adına taşınır (silinmez; yedek zaten var).
3. Site `public_html`'e yüklenir (`NATRO_DIR` değişir, `STAGING` kapanır → https zorlaması ve indeksleme açılır), `SITE_URL=https://updated.com.tr`.
4. Google Search Console'a yeni site haritası; 301'ler kontrol edilir.

## Günlük (en yeni üstte)
- **23 Ekim 2026 04:35** (Fatih'in Claude'u): Fatih: "Stüdyo taslaklarını doğrudan Payload'a gönderelim, bitince WordPress tamamen devreden çıksın." Yapılan (PR #1): `/api/triyaj/import` sağlamlaştırıldı (yayındaki/panelde düzenlenmiş taslağın üzerine yazmaz → 409 `yayinda`/`duzenlendi`, `force` ile yazılır; kategori yalnız var olanlardan → 422; görsel aynı adresse yeniden yüklenmez; SEO başlık/açıklama; etiketler `seo.geo.entities` (eski kod yanlış yere yazıyordu); güncellemede iş akışı durumu sıfırlanmaz), yeni uçlar `/api/triyaj/durum` ve `/api/triyaj/kapak`; panel iş akışına "Stüdyo anahtarını eşitle" (sunucudaki `STUDIO_IMPORT_KEY` → Stüdyo Supabase Secrets, `SUPABASE_ACCESS_TOKEN` gerekir); `deploy/canli.json` `wordpress` anahtarı (false → `.htaccess` wp-json/xmlrpc/PHP kapalı, wp-admin panele); PR'larda panel tip denetimi (`kontrol.yml`). Bu çalışma ortamından panel ve npm'e erişilemedi; doğrulama GitHub'da. Stüdyo tarafı: studio PR #24.
- **23 Ekim 2026 04:20** (Fatih'in Claude'u): **updated.com.tr yeni sisteme geçti** (Fatih'in isteği, yedeksiz). `deploy/canli.json` canli=true; FTP `canli@updated.com.tr` → public_html. WordPress dosyaları klasörde duruyor (wp-admin, wp-json, wp-content çalışır; Stüdyo taslakları gitmeye devam eder). v2 artık güncellenmiyor. Sıradaki: Stüdyo → Payload bağlantısı, Search Console'a site haritası, v2'yi ana adrese yönlendirme.
- **23 Ekim 2026** (Fatih'in Claude'u): Görseller yeni kaliteyle yeniden üretildi (537/537). Stüdyo'da etiket kuralı (en fazla 3, izinli liste) ve otomatik taslak ataması duraklatıldı (Stüdyo deposu; Edge Function yayını için `SUPABASE_ACCESS_TOKEN` secret'ı bekleniyor). Eski site raporu: `deploy/rapor` (çıktı `raporlar` dalında). Bu dosya ve `CLAUDE.md` eklendi.
- **22 Ekim 2026** (Fatih'in Claude'u): WordPress taşıması, görsel onarımı, kurumsal sayfalar, eski adres yönlendirmeleri, panel Türkçe + logo, yayın anahtarı.
