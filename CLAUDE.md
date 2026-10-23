# updated.com.tr yeni site: çalışma talimatı (her Claude oturumu için)

Bu depoda birden fazla Claude çalışır (Fatih'in ve Enes'in oturumları). Kimse sohbet geçmişine güvenmez; ortak hafıza bu depodadır.

1. **Oturumun ilk işi:** `DURUM.md` (şu an ne çalışıyor, ne yarım, ne bekliyor), sonra `ARCHITECTURE.md` (kararlar) ve gerekirse `README.md` (kurulum).
2. **Her iş parçasının sonunda** `DURUM.md` güncellenir: "Şu an" bölümü + "Günlük"ün en üstüne tarihli kısa kayıt (ne yapıldı, kim istedi, ne yarım kaldı). Başkasının kaydı silinmez.
3. Mimariyi değiştiren karar `ARCHITECTURE.md` karar listesine yazılır.
4. **Ana siteye (updated.com.tr, WordPress) dokunulmaz;** yeni site v2.updated.com.tr'de. Natro yüklemesi yalnız kendi yüklediği dosyaları siler (`deploy/natro-yukle.mjs`, `.github/natro-kontrol.sh`).
5. Gizli bilgi koda/dokümana yazılmaz; GitHub Secrets ve sunucudaki `/etc/updated-panel.*` dosyalarında durur.
6. Kullanıcıya ayar değiştirtilecekse ilgili sayfanın **doğrudan bağlantısı** verilir; anlatım Türkçe, adım adım.
7. Stüdyo (ekip paneli, Haber Masası) ayrı depodadır: `updated-studio/studio`; onun kuralları `CLAUDE.md`, `ORTAK_CALISMA.md`, `hafiza/GUNLUK.md` dosyalarındadır.
