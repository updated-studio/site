# Stüdyo · Haber Masası → yeni site

Triyaj (Stüdyo › Haber Masası) taslağı Payload'a gönderir (23 Ekim 2026'dan beri; WordPress gönderimi kaldırıldı); ekip haberi **son taslak** olarak önizlemede görür, yayın panelde yapılır.

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
{ "id": 123, "updatedAt": "…", "admin": "https://panel…/admin/collections/news/123", "preview": "https://site…/onizleme?tur=haber&id=123&k=…", "updated": false, "kategori": "Mobil", "kapak": true, "gorselHata": "" }
```

- Aynı `studioId` ikinci kez gelirse yeni kayıt açılmaz, taslak güncellenir.
- **Üzerine yazma koruması:** haber panelde yayınlanmış/planlanmışsa `409 {code:"yayinda"}`; Stüdyo'nun son gördüğü `updatedAt` (`lastSeen`) paneldekiyle aynı değilse (editör panelde değiştirmiş) `409 {code:"duzenlendi"}` — `force: true` ile yine yazılır ("Üzerine yaz").
- Kategori yalnız panelde var olanlardan (ad ya da kısa ad); yoksa `422 {code:"kategori"}`.
- Görsel indirilip WebP türevleri üretilir; aynı görsel adresi tekrar gelirse yeniden yüklenmez.
- `seo.title`/`seo.description` gelirse korunur, boşsa panel üretir; `tags` sayfa açmaz, `seo.geo.entities` olur (en fazla 4).
- Haber "◐ İncelemede" durumunda açılır. Yayın: yalnız yayın yönetmeni; kendi haberini onaylayamaz; kontrol listesi tamam olmalı (son dakika hariç).

## Diğer uçlar (aynı anahtar)

- `GET /api/triyaj/durum` → `{ ok, kategoriler:[{id,name,slug}], yazar, panel }` (Stüdyo → Ayarlar → "Bağlantıyı dene"; kategori listesi 12 saat Stüdyo'da saklanır).
- `POST /api/triyaj/kapak` `{ studioId, image }` → sonradan gelen görseli (Flux) kapağı olmayan taslağa ekler.
- İç link adayları için Stüdyo panelin herkese açık okuma ucunu kullanır: `GET /api/news?where[title][like]=…&select[title]=true&select[path]=true` (yalnız yayındakiler).

## Stüdyo tarafı

`supabase/functions/triyaj-taslak/site.ts` (WordPress'teki `wordpress.ts`'in yerini aldı). Anahtar Supabase Secrets'ta `STUDIO_IMPORT_KEY`; panel iş akışı (`.github/workflows/panel.yml`, "Stüdyo anahtarını eşitle") sunucudaki değeri `SUPABASE_ACCESS_TOKEN` organizasyon secret'ıyla Supabase'e yazar. Stüdyo'da sonuç `tr_drafts.site_*` kolonlarında (göç 0024); kartta "Son taslağı aç" ve "Panelde aç".
