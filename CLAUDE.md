# updated.com.tr yeni site: çalışma talimatı (her Claude oturumu için)

Bu depoda birden fazla Claude çalışır (Fatih'in ve Enes'in oturumları). Kimse sohbet geçmişine güvenmez; ortak hafıza bu depodadır.

1. **Oturumun ilk işi:** `DURUM.md` (şu an ne çalışıyor, ne yarım, ne bekliyor), sonra `ARCHITECTURE.md` (kararlar) ve gerekirse `README.md` (kurulum).
2. **Her iş parçasının sonunda** `DURUM.md` güncellenir: "Şu an" bölümü + "Günlük"ün en üstüne tarihli kısa kayıt (ne yapıldı, kim istedi, ne yarım kaldı). Başkasının kaydı silinmez.
3. Mimariyi değiştiren karar `ARCHITECTURE.md` karar listesine yazılır.
4. Yeni site 23 Ekim 2026'dan beri updated.com.tr'de (`public_html`); WordPress kapalı ama dosyaları hosting'de duruyor, silinmesi Fatih'in onayıyla. Natro yüklemesi yalnız kendi yüklediği dosyaları siler (`deploy/natro-yukle.mjs`, `deploy/natro-kontrol.sh`).
5. Gizli bilgi koda/dokümana yazılmaz; yalnız sunucuda durur (`/etc/updated-panel.*`, `/etc/updated-site.env`, `/opt/updated/supabase/.env`, `functions.env`).
6. Kullanıcıya ayar değiştirtilecekse ilgili sayfanın **doğrudan bağlantısı** verilir; anlatım Türkçe, adım adım.
7. Stüdyo (ekip paneli, Haber Masası) ayrı depodadır: `updated-studio/studio`; onun kuralları `CLAUDE.md`, `ORTAK_CALISMA.md`, `hafiza/GUNLUK.md` dosyalarındadır.
8. **Kim neye karar verir (Fatih, 23 Ekim 2026):**
   - **Yön ve tercih kararları Fatih'in:** altyapı/araç seçimi, bir şeyin nerede duracağı, maliyet, güvenlik tercihleri, ekibin göreceği değişiklikler, iş sırası. Seçenekleri bedelleriyle sade anlat, bir tavsiye ver, kararı Fatih'e bırak.
   - **Uygulama ayrıntılarında sorma** (komut, dosya, ayar değeri, hatayı çözme yolu): kendin karar ver, ne seçtiğini tek cümleyle söyle, devam et.
   - **Her zaman sor:** geri alınamayan işler (silme, para ödeme, hesap/ayar kapatma) ve Fatih'in ya da Enes'in elle yapması gereken adımlar (DNS, şifre girme, onay); bunları adım adım ve doğrudan bağlantıyla anlat.
   - Birden fazla soru varsa tek mesajda topla. Sade Türkçe konuş, teknik terimi açıkla.
9. **Sunucuda çalışma (Natro VPS):** panelin kopyası `/opt/updated/site` her panel güncellemesinde sıfırlanır (`deploy/panel/guncelle.sh`); orada düzenleme yapılmaz. Site deposunun çalışma kopyası `/opt/updated/calisma/site`, Stüdyo'nunki `/opt/updated/studio`.
10. **GitHub sunucuya dokunmaz (23 Ekim 2026'dan beri, Fatih: "hiçbir şey kalmasın").** GitHub kodu saklar; derleme, yayın, panel ve Stüdyo güncellemesi sunucuda kendiliğinden olur (README "Nasıl çalışır"). GitHub'da yalnız PR kod kontrolü (`kontrol.yml`, sunucuya bağlanmaz) kaldı; kaldırılması Fatih'in kararı. Sunucuda çalışacak yeni iş `deploy/` altına betik + systemd zamanlayıcısı olarak yazılır, GitHub iş akışı olarak değil.
