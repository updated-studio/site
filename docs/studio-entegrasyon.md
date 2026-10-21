# Stüdyo · Haber Masası → yeni site

Triyaj (Stüdyo › Haber Masası) bugün taslağı WordPress'e gönderiyor. Yeni sitede aynı düğme Payload'a gönderir; ekip haberi **son taslak** olarak önizlemede görür, yayın panelde yapılır.

## Uç

```
POST {CMS_URL}/api/triyaj/import
x-studio-key: {STUDIO_IMPORT_KEY}
Content-Type: application/json
```

```json
{
  "studioId": "kayit-uuid",
  "title": "Samsung'un 2027 katlanabilir ailesi sızdı: Galaxy Z Slide ve TriFold",
  "spot": "Sızıntıya göre ailede kayan ekranlı Z Slide ve üç katlanan TriFold yer alıyor.",
  "markdown": "Metin **markdown** olarak…",
  "category": "Mobil",
  "label": "sizinti",
  "shortAnswer": "2–3 cümlelik kısa cevap (AEO)",
  "sources": [{ "name": "Kaynak yayın", "url": "https://…", "primary": true }],
  "image": { "url": "https://…/gorsel.jpg", "credit": "Görsel: Samsung", "alt": "…", "ai": false },
  "products": ["galaxy-z-slide", "galaxy-z-trifold"],
  "priority": 8,
  "cluster": "samsung-katlanabilir-2027",
  "editorEmail": "deniz@updated.com.tr"
}
```

Yanıt:

```json
{ "id": 123, "admin": "https://panel…/admin/collections/news/123", "preview": "https://site…/onizleme/haber/123?k=…", "updated": false }
```

- Aynı `studioId` ikinci kez gelirse yeni kayıt açılmaz, taslak güncellenir.
- Kategori yoksa açılır. Görsel indirilip WebP türevleri üretilir (≤200 KB).
- SEO başlığı (≤60), açıklama (≤160), adres, okuma süresi, şema kayıtta otomatik dolar.
- Haber "◐ İncelemede" durumunda açılır. Yayın: yalnız yayın yönetmeni; kendi haberini onaylayamaz; kontrol listesi tamam olmalı (son dakika hariç).

## Stüdyo tarafındaki değişiklik (ayrı PR, `src/modules/haber-masasi`)

1. WordPress'e gönderen fonksiyonun yanına `sendToPayload(draft)` eklenir; hangi hedefin kullanılacağı ayarlardan seçilir (geçiş süresince ikisi de açık kalabilir).
2. `STUDIO_IMPORT_KEY` Stüdyo'da tarayıcıya konmaz; Supabase Edge Function üzerinden çağrılır (anahtar sunucuda).
3. Yanıttaki `preview` bağlantısı Haber Masası kartında "Son taslağı aç" olarak gösterilir.
4. ARCHITECTURE.md karar kaydına not düşülür (Stüdyo repo kuralı).
