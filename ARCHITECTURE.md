# Mimari ve karar kaydı

## Genel akış

```
Stüdyo · Haber Masası (triyaj)
   │  POST /api/triyaj/import (sunucudan, anahtarla)
   ▼
Payload panel ──► Supabase Postgres (şema: payload) + Storage (media, WebP)
   │  yayın / güncelleme → afterChange: Vercel ISR yenile + IndexNow
   ▼
Astro site (SSR + ISR) ──► okur
```

## Kararlar

| # | Karar | Neden |
|---|---|---|
| 1 | Site Astro, panel Payload 3 | Astro: hızlı, az JS, SEO. Payload: Postgres üzerinde tipli içerik, taslak/sürüm, rol, kendi uçlarımız. |
| 2 | Barındırma Vercel (iki proje) | Natro paylaşımlı barındırma Node çalıştırmıyor. ISR + bypass token ile yayın anında sayfa yenilenir. |
| 3 | Veritabanı mevcut Supabase, `payload` şeması | Stüdyo ile aynı yerde; tablolar karışmaz. Ayrı proje istenirse yalnız `DATABASE_URI` değişir. |
| 4 | Görseller Supabase Storage, WebP türevleri (480/800/1600, OG 1200×630 JPEG) | ≤200 KB kuralı; srcset ile cihaz boyutunda yükleme. |
| 5 | Sayfalama yolu `/…/sayfa/N` | Vercel ISR sorgu dizgesini önbellek anahtarına katmaz; `?sayfa=` aynı sayfayı döndürürdü. |
| 6 | Sonsuz akış: ilk sayfa sunucuda, sonrası `/parca/akis` HTML parçası | Arama motoru ilk 20 haberi görür; JS kapalıyken "Daha fazla" bağlantısı çalışır. |
| 7 | Akış sırası: 20 haber → YouTube şeridi → (tek sayfalarda) video reklam → Reels şeridi | Ekip isteği. 12. karttan sonra akış içi reklam, 8. sırada sponsorlu kart (kampanya varsa). |
| 8 | Reklamlar Payload `ads` koleksiyonu | Kit 10b: "Reklam" etiketi, ilk paragraftan önce yok, makalede ≤2, açılır/sesli yok; video sessiz, 5 sn sonra geçilir. Kampanya yoksa alan basılmaz. |
| 9 | Künye = `products` koleksiyonu; haber/inceleme/kıyas ilişkiyle bağlanır | Ürün sayfası join alanlarıyla tüm içeriği listeler; metindeki ürün adları otomatik künye etiketine dönüşür. |
| 10 | Teknik değer kaynağıyla saklanır; bilinmeyen boş kalır | Kit: bilgi önce. Çakışma çözümü Stüdyo'daki içe aktarma modülünde (PDF/Excel/JSON → QC). |
| 11 | Kıyas adresi alfabetik `a-vs-b`, ters sıra 301 | Tek adres. |
| 12 | Yayın kuralı panelde zorlanır (`hooks/workflow.ts`) | Yalnız yayın yönetmeni yayınlar, kendi haberini onaylayamaz, kontrol listesi tamam olmalı, başlıkta yasak kelime/ünlem yok, sızıntı başlığında "sızıntı/iddia". |
| 13 | SEO/GEO otomatik (`hooks/autoSeo.ts`) + JSON-LD (`web/src/lib/seo.ts`) | NewsArticle (+about Product), Review (/20), Product, ItemList, Breadcrumb, FAQ; Google News site haritası (48 saat), `llms.txt`. |
| 14 | Eski WordPress adresleri middleware'de tablodan 301 | Binlerce satır Vercel yönlendirme sınırına takılmaz. |
| 15 | Kulüp şimdilik istemci uygulaması (`/kulup`) | Altyapı hazır (Payload koleksiyonları + Supabase SQL); içerik ve üyelik sonraki aşama. |
| 16 | Marka kiti kuralları `packages/kit` | Panel doğrulaması ve site önizlemesi aynı listeyi kullanır. |

## Kit uyumu (kısa)

- Renkler, yazı tipleri, ızgara: `apps/web/src/styles/brand.css` (tokens.json'dan).
- Degrade, gölge, saydamlık, radius yok. Hareket 120/200/320 ms. Otomatik dönen slayt, daktilo efekti, paralaks, logoya efekt yok.
- Son dakika şeridi yalnız aktif haber varken (2 saat); etiket 24 saat.
- Puan /20 tam sayı, puan kutusu metnin sonunda.
