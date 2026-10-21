# updated.com.tr — yeni site

Astro (site) + Payload 3 (yayın paneli) + Supabase (veritabanı ve dosyalar). Tasarım: UPDATED Marka Kiti 1.2.

```
apps/web     Astro 5 · sunucuda basılır, Vercel önbelleğinde (ISR) tutulur
apps/cms     Payload 3 (Next 15) · panel /admin, REST /api, triyaj ucu /api/triyaj/import
packages/kit Marka kiti kuralları (sınırlar, etiketler, kontrol listesi) — iki uygulama da kullanır
supabase/    Kulüp ilerleme tabloları (SQL)
docs/        Stüdyo entegrasyonu, Kulüp yol haritası
```

> **Durum:** Kod yazıldı, veri katmanı örnek veriyle denendi; `npm install` ve tam derleme bu ortamda yapılamadı (paket sunucusuna erişim kapalıydı). İlk kurulumda `npm run build` ile doğrulanacak.

## 1. Gerekenler

- Node 20.9+ (22 önerilir)
- Supabase projesi: Postgres bağlantı adresi + Storage (S3 erişim anahtarı)
- Vercel hesabı (iki proje: `updated-web`, `updated-cms`)
- Hazırlık alan adı: `yeni.updated.com.tr` (site) ve `panel.updated.com.tr` (panel)

## 2. Yerelde çalıştırma

```bash
npm install
cp apps/cms/.env.example apps/cms/.env   # değerleri doldurun
cp apps/web/.env.example apps/web/.env
npm run dev:cms    # http://localhost:3001/admin — ilk açılışta yönetici hesabı oluşturulur
npm run dev:web    # http://localhost:4321
```

`apps/web/.env` içinde `CMS_URL` boş bırakılırsa site örnek verilerle açılır (tasarım önizlemesi).

## 3. Supabase

1. **Veritabanı:** Project Settings › Database › Connection string (Session pooler, port 5432) → `DATABASE_URI`. Payload tabloları `payload` şemasına kurulur; Stüdyo tablolarına dokunmaz.
2. **Storage:** `media` adında **public** kova. Storage › S3 Connection › yeni erişim anahtarı → `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` (`https://<ref>.supabase.co/storage/v1/s3`), `S3_REGION`. `MEDIA_PUBLIC_URL` = `https://<ref>.supabase.co/storage/v1/object/public/media`.
3. **Kulüp (sonra):** `supabase/kulup.sql` SQL Editor'da çalıştırılır.

İlk kurulumda tablolar için: `npm run migrate -w apps/cms` (geliştirmede Payload şemayı kendisi eşitler).

## 4. Vercel

| Proje | Kök | Ortam değişkenleri |
|---|---|---|
| updated-cms | `apps/cms` | `apps/cms/.env.example` içindekiler |
| updated-web | `apps/web` | `apps/web/.env.example` içindekiler |

- `ISR_BYPASS_TOKEN` iki projede **aynı** olmalı (panel yayın sonrası sayfayı yeniler).
- `PREVIEW_SECRET` iki projede aynı olmalı (taslak önizleme).
- `INDEXNOW_KEY`: rastgele 32 karakter; `apps/web/public/<anahtar>.txt` dosyasına aynı değer yazılır.
- Hazırlıkta `SHOW_AD_SLOTS=1` reklam yerlerini gösterir.

## 5. WordPress'ten taşıma

1. WordPress › Kullanıcılar › Profil › **Uygulama Parolaları** → yeni parola. Sohbete, koda veya e-postaya yazılmaz; yalnız komut satırında ortam değişkeni olarak verilir.
2. Önce deneme: `DRY_RUN=1 LIMIT=50 WP_URL=https://updated.com.tr WP_USER=… WP_APP_PASSWORD=… npm run wp:migrate`
3. Sonra tam taşıma (aynı komut, `DRY_RUN` ve `LIMIT` olmadan). Tekrar çalıştırılabilir; kayıtlar `wpId` ile eşlenir.
4. Çıktılar: `apps/web/src/redirects.json` (eski adres → yeni adres, 301) ve `apps/cms/scripts/wp-migrate.log.json`.
5. İncelemeler: `WP_REVIEW_CATEGORY=inceleme WP_SCORE_META=<puan meta alanı>` verilirse İnceleme olarak aktarılır; 5'lik puan ×4, 10'luk ×2 → /20. Ürün künyesi otomatik açılır ve "QC bekliyor" işaretlenir.
6. Adresler: haber `/{kategori}/{wp-slug}` — WordPress slug'ı korunur.

## 6. Yayına geçiş (sıra)

1. Hazırlık sitesi (`yeni.updated.com.tr`) — `robots.txt` her şeyi kapatır.
2. Taşıma + ekip kontrolü (bir hafta paralel yayın).
3. Search Console: yeni site haritası, adres değişikliği yok (aynı alan adı).
4. DNS: `updated.com.tr` → Vercel. WordPress salt okunur yedek olarak `eski.updated.com.tr`'de kalır.
5. Stüdyo · Haber Masası hedefi Payload'a çevrilir (`docs/studio-entegrasyon.md`).

## Komutlar

| Komut | İş |
|---|---|
| `npm run dev:cms` / `dev:web` | Geliştirme |
| `npm run build` | İki uygulamayı derler |
| `npm run generate:types -w apps/cms` | Payload tiplerini üretir |
| `npm run wp:migrate` | WordPress taşıması |
