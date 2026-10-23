# updated.com.tr — yeni site

Astro (statik site) + Payload 3 (yayın paneli) + Supabase (açık kaynak, Natro VPS'te). Tasarım: UPDATED Marka Kiti 1.2.
**Her şey Natro'da çalışır (23 Ekim 2026'dan beri); GitHub kodu saklar ve sunucuya hiç bağlanmaz** (yalnız PR'larda kod kontrolü: `.github/workflows/kontrol.yml`).

```
apps/web       Astro 5 · statik HTML; Natro VPS'te derlenir → Natro hosting (FTP, yalnız değişen dosyalar)
apps/cms       Payload 3 (Next 15) · panel /admin, REST /api, triyaj /api/triyaj/import, önizleme /api/onizleme
packages/kit   Marka kiti kuralları — iki uygulama da kullanır
deploy/        sunucu betikleri: altyapi/ (Supabase, site yayını, Stüdyo yayını, yedek, Claude), panel/ (kurulum, güncelleme)
docs/          Stüdyo entegrasyonu, Kulüp yol haritası
```

## Nasıl çalışır

```
Stüdyo · Haber Masası ──► Payload panel ──► Supabase (Natro VPS)
                              │ Yayınla: /var/spool/updated-site'a istek
                              ▼
            Natro VPS: updated-site-yayin ──► derle (~1 dk) ──► Natro hosting (FTP) ──► updated.com.tr
```

- **Site:** panelde Yayınla → birkaç dakikada sitede. Kod `main`'de değişince de (2 dk'da bir bakılır) ve her gece 04.00'te derlenir. Betik `deploy/altyapi/site/yayinla.sh` (`sudo updated-site-yayinla --dene` yüklemeden dener).
- **Panel:** `apps/cms` `main`'de değişince sunucu kendisi günceller (`deploy/panel/otomatik.sh`, 2 dk).
- **Stüdyo:** `updated-studio/studio` `main`'de değişince sunucu derler ve yayınlar (`deploy/altyapi/studyo`).
- Gizli ayarlar yalnız sunucuda: `/etc/updated-panel.*`, `/etc/updated-site.env`, `/opt/updated/supabase/.env`, `functions.env`.
- Kayıtlar: `journalctl -u updated-site-yayin`, `-u updated-panel-guncelle`, `-u updated-studyo`.

---

## Tarihsel kurulum notları (GitHub Actions dönemi, 23 Ekim 2026 öncesi; artık geçerli değil)

### 1. Önce GitHub'da deneme (panel olmadan)

1. Bu kodu `updated-studio/site` deposuna gönderin.
2. Settings › Pages › Source: **GitHub Actions**.
3. Settings › Secrets and variables › Actions › **Variables**:
   - `HAZIRLIK_PAGES` = `1`
   - `HAZIRLIK_URL` = `https://updated-studio.github.io/site`
   - `HAZIRLIK_BASE` = `/site`
   - `CMS_URL` boş bırakılırsa site **örnek verilerle** derlenir (tasarım ve akış denemesi).
4. Actions › "Siteyi derle ve yayınla" › Run workflow.

Hazırlık sürümü her zaman arama motorlarına kapalıdır.

## 2. Supabase (ayrı proje)

1. Yeni proje, bölge Frankfurt (eu-central-1).
2. **Veritabanı:** Connect › Session pooler (5432) adresi → panelde `DATABASE_URI`. Payload tablolarını `payload` şemasına kurar.
3. **Görseller:** Storage › `media` adında **public** kova. Storage › S3 Connection › erişim anahtarı → `S3_*`. `MEDIA_PUBLIC_URL` = `https://<ref>.supabase.co/storage/v1/object/public/media`.
4. Kulüp (sonra): `supabase/kulup.sql`.

## 3. Panel (Payload)

Panel Node.js sunucusu ister; Natro paylaşımlı barındırmada çalışmaz. Seçenekler:

| Seçenek | Not |
|---|---|
| Natro'da Node.js destekli paket ya da VPS | Natro'ya sorulacak: cPanel "Setup Node.js App" var mı? |
| Render / Railway / Fly.io | Kalıcı sunucu; zamanlanmış yayın kuyruğu sorunsuz çalışır |
| Vercel | Çalışır; zamanlanmış yayın için ayrıca cron gerekir |

Kurulum:

```bash
npm install
cp apps/cms/.env.example apps/cms/.env   # doldurun
npm run dev:cms                          # http://localhost:3001/admin
npm run migrate -w apps/cms              # canlı veritabanında tablolar
```

Panel ortamına ayrıca:
- `GITHUB_REPO=updated-studio/site` ve `GITHUB_DISPATCH_TOKEN` (yalnız bu depo, "Contents: Read and write" izinli ince taneli token) → yayında derleme tetiklenir.
- `WEB_URL` (canlı site), `EXTRA_ORIGINS` (hazırlık adresi), `PREVIEW_SECRET` (rastgele).

Panel hazır olunca GitHub Variables'a `CMS_URL` eklenir; hazırlık sitesi gerçek içerikle derlenir.

## 4. Natro

GitHub › Settings › Secrets and variables › Actions:

| Tür | Ad | Değer |
|---|---|---|
| Secret | `NATRO_FTP_HOST` | ör. `ftp.updated.com.tr` |
| Secret | `NATRO_FTP_USER` / `NATRO_FTP_PASSWORD` | Natro panelinden FTP hesabı (yalnız site klasörüne yetkili) |
| Secret | `INDEXNOW_KEY` | rastgele 32 karakter |
| Variable | `NATRO` | `1` |
| Variable | `SITE_URL` | `https://updated.com.tr` |
| Variable | `NATRO_DIR` | **zorunlu**, alt alan adının klasörü (ör. `v2.updated.com.tr/`); FTP kullanıcısı o klasöre kilitliyse `./` + `NATRO_FTP_KILITLI=1` |
| Variable | `NATRO_STAGING` | v2 / hazırlık için `1` (noindex, örnek veriye izin) |
| Variable | `NATRO_FTP_SECURITY` | sertifika alan adıyla uyuşmazsa `loose` |
| Variable | `NATRO_ANA_SITE` | yalnız ana siteye geçiş günü `evet` |
| Variable | `NATRO_FTP_PROTOCOL` | `ftps` (olmazsa `ftp`) |
| Variable | `PUBLIC_BULTEN_URL` | bülten sağlayıcısının kayıt adresi (varsa) |

**Güvenlik:** yüklemeden önce hedef klasör listelenir; içinde WordPress dosyası (wp-config.php, wp-content…) varsa yükleme durur. Kök klasörler (`public_html`, `httpdocs`) `NATRO_ANA_SITE=evet` olmadan reddedilir. Yükleme yalnız kendi yüklediği dosyaları günceller/siler, klasördeki başka dosyalara dokunmaz.

Derleme `.htaccess` üretir: uzantısız adresler, https, sondaki "/" yönlendirmesi, 404 sayfası, önbellek ve güvenlik başlıkları, WordPress'ten kalan eski adreslerin 301 yönlendirmeleri. Şifreler sohbete, koda ya da e-postaya yazılmaz; yalnız GitHub Secrets'a girilir.

## 5. WordPress'ten taşıma

1. WordPress › Kullanıcılar › Profil › **Uygulama Parolaları** → yeni parola (yalnız komut satırında kullanılır).
2. Deneme: `DRY_RUN=1 LIMIT=50 WP_URL=https://updated.com.tr WP_USER=… WP_APP_PASSWORD=… npm run wp:migrate`
3. Tam taşıma: aynı komut, `DRY_RUN` ve `LIMIT` olmadan. Tekrar çalıştırılabilir (`wpId` ile eşlenir).
4. `apps/web/src/redirects.json` (eski → yeni adres) üretilir; depoya eklenip gönderilince `.htaccess`'e 301 olarak girer.
5. İncelemeler: `WP_REVIEW_CATEGORY=inceleme WP_SCORE_META=<puan alanı>` → /20'ye çevrilir, ürün künyesi "QC bekliyor" işaretiyle açılır.

## 6. Yayına geçiş

1. GitHub Pages'te örnek verilerle deneme.
2. Panel + Supabase kurulur, WordPress taşınır, hazırlık gerçek içerikle derlenir.
3. Natro'da hazırlık alt alan adı (ör. `yeni.updated.com.tr`, `NATRO_STAGING=1`), ekip bir hafta paralel çalışır.
4. Natro'da `public_html` yedeklenir (WordPress dosyaları + veritabanı dökümü), `NATRO_DIR=public_html/`, `NATRO_STAGING` silinir, derleme çalıştırılır.
5. Search Console: site haritası gönderilir (alan adı aynı, adres değişikliği bildirimi gerekmez).
6. Stüdyo · Haber Masası hedefi panele çevrilir (`docs/studio-entegrasyon.md`).

## Komutlar

| Komut | İş |
|---|---|
| `npm run dev:web` | Site, http://localhost:4321 (CMS_URL boşsa örnek veri) |
| `npm run dev:cms` | Panel, http://localhost:3001/admin |
| `npm run build -w apps/web` | Statik site → `apps/web/dist` |
| `npm run wp:migrate` | WordPress taşıması |
