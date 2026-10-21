# UPDATED Kulüp

Fotoğraf, video ve dron için dersler, simülatörler, alıştırmalar ve haftalık görevler. Sitenin parçası (`/kulup`), aynı tasarım dili.

## Bugün

- `apps/web/src/pages/kulup.astro` kabuğu basar; uygulama `public/kulup/*.js` (onaylanan Kulüp şablonu).
- Simülatörler: pozlama üçgeni, enstantane, dron (rüzgâr/irtifa). İlerleme ve XP tarayıcıda (`localStorage`).
- İçerik şablondaki örnek veriden gelir.

## Sonraki adımlar (sırayla)

1. **İçerik Payload'dan:** `KulupTracks` (yol → modül → adım) ve `KulupQuizzes` doldurulur; `kulup.js` örnek verisi yerine `/api/kulup-tracks?depth=1` okunur. Simülatörler `simulatorId` ile eşlenir (`expo`, `shutter`, `drone`).
2. **Üyelik:** Supabase Auth (e-posta bağlantısı + Google). Site oturumu gerekmez; yalnız Kulüp'te "İlerlememi kaydet" ile açılır.
3. **İlerleme:** `supabase/kulup.sql` çalıştırılır. Yerel ilerleme ilk girişte hesaba taşınır.
4. **Görev teslimi:** Supabase Storage `kulup-teslimler` (özel kova). Onay/geri bildirim panelden.
5. **Astro bileşenlerine taşıma:** simülatörler tek tek Astro adasına (island) çevrilir; SEO için ders metinleri sunucuda basılır.

## Kurallar

- Kit geçerli: degrade, gölge, saydamlık yok; radius 0; hareket 120/200/320 ms.
- Simülatör sonuçları eğitim amaçlıdır; gerçek cihaz değerleri gibi sunulmaz.
