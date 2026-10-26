# Mimari ve karar kaydı

## Genel akış

```
Stüdyo · Haber Masası (triyaj)
   │  POST /api/triyaj/import (sunucudan, anahtarla)
   ▼
Payload panel ──► Supabase (ayrı proje): Postgres (şema: payload) + Storage (media, WebP)
   │  yayın / düzeltme / kaldırma → afterChange: GitHub repository_dispatch "yayin"
   ▼
GitHub Actions: Astro statik derleme ──► Natro (FTP, değişen dosyalar) ──► IndexNow
                                    └──► GitHub Pages (hazırlık)
```

## Kararlar

| # | Karar | Neden |
|---|---|---|
| 1 | Site Astro, panel Payload 3 | Astro: hızlı, az JS, SEO. Payload: Postgres üzerinde tipli içerik, taslak/sürüm, rol, kendi uçlarımız. |
| 2 | Site statik, Natro'da; derleme GitHub Actions'ta | Site Natro'da yayınlanacak (karar). Paylaşımlı barındırma Node çalıştırmaz; statik HTML her pakette çalışır, hızlıdır, saldırı yüzeyi yoktur. Panel ayrı Node sunucusunda. |
| 3 | Ayrı Supabase projesi, `payload` şeması | Karar: Stüdyo'dan ayrı. Site yükü ve yedekleri Stüdyo'yu etkilemez. |
| 4 | Görseller Supabase Storage, WebP türevleri (480/800/1600, OG 1200×630 JPEG) | ≤200 KB kuralı; srcset ile cihaz boyutunda yükleme. |
| 5 | Sayfalama yolu `/…/sayfa/N` | Statik dosya: her sayfa ayrı HTML. Kaynak başına en fazla 50 sayfa üretilir; daha eskisi künye, arama ve site haritasından bulunur. |
| 6 | Sonsuz akış: ilk sayfa sayfada, sonrası `/parca/akis/{kaynak}/{N}` statik HTML parçası | Arama motoru ilk 20 haberi görür; JS kapalıyken "Daha fazla" bağlantısı `/sayfa/N`'e gider. |
| 7 | Akış sırası: 20 haber → YouTube şeridi → (tek sayfalarda) video reklam → Reels şeridi | Ekip isteği. 12. karttan sonra akış içi reklam, 8. sırada sponsorlu kart (kampanya varsa). |
| 8 | Reklamlar Payload `ads` koleksiyonu | Kit 10b: "Reklam" etiketi, ilk paragraftan önce yok, makalede ≤2, açılır/sesli yok; video sessiz, 5 sn sonra geçilir. Kampanya yoksa alan basılmaz. |
| 9 | Künye = `products` koleksiyonu; haber/inceleme/kıyas ilişkiyle bağlanır | Ürün sayfası join alanlarıyla tüm içeriği listeler; metindeki ürün adları otomatik künye etiketine dönüşür. |
| 10 | Teknik değer kaynağıyla saklanır; bilinmeyen boş kalır | Kit: bilgi önce. Çakışma çözümü Stüdyo'daki içe aktarma modülünde (PDF/Excel/JSON → QC). |
| 11 | Kıyas adresi alfabetik `a-vs-b`, ters sıra 301 | Tek adres. |
| 12 | Yayın kuralı panelde zorlanır (`hooks/workflow.ts`) | Yalnız yayın yönetmeni yayınlar, kendi haberini onaylayamaz, kontrol listesi tamam olmalı, başlıkta yasak kelime/ünlem yok, sızıntı başlığında "sızıntı/iddia". |
| 13 | SEO/GEO otomatik (`hooks/autoSeo.ts`) + JSON-LD (`web/src/lib/seo.ts`) | NewsArticle (+about Product), Review (/20), Product, ItemList, Breadcrumb, FAQ; Google News site haritası (48 saat), `llms.txt`. |
| 14 | Eski WordPress adresleri `.htaccess`'te 301 | `scripts/postbuild.mjs` redirects.json'dan üretir; ters sıralı kıyaslar da aynı yerde. |
| 15 | Kulüp şimdilik istemci uygulaması (`/kulup`) | Altyapı hazır (Payload koleksiyonları + Supabase SQL); içerik ve üyelik sonraki aşama. |
| 16 | Marka kiti kuralları `packages/kit` | Panel doğrulaması ve site önizlemesi aynı listeyi kullanır. |
| 17 | Arama statik dizinle (`/ara-dizin.json`) tarayıcıda | Sunucu yok; dizin kısa (tür, başlık, adres, kategori). |
| 18 | Taslak önizleme `/onizleme?tur&id&k` sayfası, veri panelin `/api/onizleme` ucundan | Taslaklar statik derlemeye girmez; parola panelde doğrulanır. |
| 19 | CMS varken hata derlemeyi durdurur | Örnek veri asla canlıya çıkmaz; yarım derleme FTP'ye yüklenmez. |
| 21 | Görseller okura Natro'dan (`/medya/…`) | Supabase ücretsiz katmanı ayda 5 GB çıkış verir; haber sitesi bunu hızla aşar. Derlemede kullanılan görseller indirilip siteyle yüklenir (önbellekli). Asıl dosyalar Supabase'de kalır. |
| 22 | Anlık katman (`/api/canli`, 404 yedeği) | Statik derleme 1–2 dk sürer. Yeni haber son dakika şeridine ve yan listeye hemen düşer; adresi derlenmemişse 404 sayfası haberi panelden okuyup gösterir. |
| 23 | Kendi okunma sayacı (`/api/okunma`, `/api/en-cok-okunan`) | Çerezsiz, kişisel veri yok; "En çok okunanlar" son 48 saatten. Ek servis yok. |
| 24 | Natro'ya yalnız değişen dosyalar (`deploy/natro-yukle.mjs`) | Özet (sha1) karşılaştırması; yayından kalkan sayfa silinir; bizim yüklemediğimiz dosyalara dokunulmaz. |
| 25 | Site veritabanı yedeği `updated-studio/yedek` deposunda | Stüdyo yedeğiyle aynı yöntem, her gece 03.35. |
| 26 | Panel sunucusu: şimdi Oracle (ücretsiz ARM), sonra Natro VPS | `deploy/panel/*.sh` iki yerde de aynı; https'i Caddy kendi alır. |
| 20 | Hazırlık GitHub Pages'te (`BASE_PATH=/site`) | Alan adı gerekmeden deneme; postbuild iç bağlantılara önek ekler, her sayfa noindex. |
| 27 | Stüdyo taslakları panele (`/api/triyaj/import`), WordPress devre dışı (23 Ekim 2026) | Tek yayın sistemi. Uç üzerine yazmaz (yayında/düzenlenmiş → 409), kategori yalnız var olanlardan; anahtar sunucuda üretilir, panel iş akışı Stüdyo'nun Supabase Secrets'ına eşitler. WordPress dosyaları silinmez; `deploy/canli.json` `wordpress:false` ile PHP girişleri kapanır, eski görseller statik kalır. |
| 30 | Tek giriş: ekip ve site rolleri Stüdyo'da (24 Ekim 2026) | Fatih: "bütün sistem tek yerden". Kişinin site rolü Stüdyo `profiles.site_rol`; panel hesabı Stüdyo girişiyle ilk istekte açılır (`auth/studyo.ts`), rol/silme tetikleyiciyle anında yansır. Payload'un kendi paneli yalnız yöneticilere, yedek kapı. Payload altyapı kalır; ekranı Stüdyo, panelin bütün özellikleri Stüdyo'ya taşınır. |
| 29 | Site derlemesi ve panel güncellemesi Natro'da; GitHub sunucuya bağlanmaz (23 Ekim 2026) | Fatih: "hiçbir şey kalmasın". `deploy/altyapi/site` (Yayınla → `/var/spool/updated-site` → systemd path; kod değişince 2 dk; gece 04.00) ve `deploy/panel/otomatik.sh` (2 dk). Ağır derlemeler ortak kilitle sırayla (bellek). GitHub iş akışları ve sunucudaki GitHub SSH anahtarları kaldırıldı; yalnız PR kod kontrolü kaldı. Bu tablodaki eski GitHub Actions/Pages kararları (20, 24, 26) tarihsel. |
| 31 | Okur üyeliği "Uper" (24 Ekim 2026) | Fatih: "en öncelikli iş". Okur hesapları ekipten tamamen ayrı: ayrı giriş servisi (Supabase Auth, `deploy/altyapi/uye`, veritabanı `uyeler`, kendi imza anahtarı; e-posta+şifre, e-postaya bağlantı, Google; isteğe bağlı Cloudflare Turnstile). Okur anahtarı Payload kullanıcısı olmaz: yalnız `/api/uye/*` uçları tanır (`Authorization: Uper …`), ekip yetkisi alamaz. Profil ve yorumlar Payload koleksiyonu (`uyeler`, `yorumlar`; Stüdyo → Site → Topluluk'ta kendiliğinden yönetilir), tepki/beğeni/kayıt/bildirim/puan ham tablolar (göç `20261024_145308_uye_topluluk`). Moderasyon: bağlantı, uygunsuz kelime ve yeni Uper'in ilk yorumu onaya; 3 şikâyet gizler. Puan → seviye (Kamera→Lens→Gimbal→Işık→Dron→Stüdyo), kurallar `lib/uye.ts` `PUAN`. Site statik kalır; topluluk bölümü tarayıcıda yüklenir (`scripts/uye.ts`, `/hesap`, `/uper`). |
| 28 | Stüdyo ekranı Natro'da (`deploy/altyapi/studyo`, 23 Ekim 2026) | Fatih: "Stüdyo tamamen Natro'da". Sunucu 2 dk'da bir Stüdyo deposunun `main` dalına bakar, değişince derler ve değişen fonksiyonları yükler; ekibin çalışma şekli değişmez (main'e gönder → birkaç dk'da yayında). Derleme hatasında eski sürüm kalır, son 5 sürüm saklanır. Caddy ana dosyası `conf.d/*.caddy`'yi içe alır. |
| 32 | Site altı ana bölüm: Ana Sayfa · Haberler · İncelemeler & Kıyaslamalar · Rehber · Araçlar · Kulüp (26 Ekim 2026) | Fatih: her biri ayrı sayfa ve çalışma mantığı; Kulüp yeni nesil forum (topluluğa dair her şey). Menü kodda sabit (`ANA_MENU`, `lib/api.ts`); panelin menü listesi kullanılmaz. Künyeler ve Karşılaştırma İncelemeler & Kıyaslamalar'ın altına girer. Ana sayfa ilk bölüm: 13 manşetlik slider (editör seçer, eksikse en yeni haberler) + sonraki 6 haber + 300×600 dikey afiş (reklam alanı `hp`), altında 970×250 bant. Öneri: claude.ai/artifact/Gbm3ES1pivXfbpqpdGKKMJ. |

## Kit uyumu (kısa)

- Renkler, yazı tipleri, ızgara: `apps/web/src/styles/brand.css` (tokens.json'dan).
- Degrade, gölge, saydamlık, radius yok. Hareket 120/200/320 ms. Otomatik dönen slayt, daktilo efekti, paralaks, logoya efekt yok.
- Son dakika şeridi yalnız aktif haber varken (2 saat, derleme anına göre; gece 04.00'te güvenlik derlemesi şeridi temizler); etiket 24 saat.
- Puan /20 tam sayı, puan kutusu metnin sonunda.
