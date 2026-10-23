# Kurtarma kılavuzu (Claude olmadan da)

Bu dosya, Claude'a ya da bir kişiye erişilemese bile sistemi ayakta tutmak ve geri kurmak için yazıldı. Ayrıntılı kararlar: `ARCHITECTURE.md`, güncel durum: `DURUM.md`.

## Neler nerede (23 Ekim 2026)
| Parça | Yer | Nasıl yönetilir |
|---|---|---|
| Site (updated.com.tr) | Natro paylaşımlı hosting, `public_html` | Koddan derlenir (`apps/web`), FTP ile yüklenir |
| Panel (panel.updated.com.tr) | Natro VPS, `/opt/updated/site/apps/cms`, servis `updated-panel` | `systemctl restart updated-panel` |
| Veritabanı + giriş + dosyalar + Stüdyo fonksiyonları | Natro VPS, `/opt/updated/supabase` (Supabase açık kaynak, Docker) | `cd /opt/updated/supabase && sudo docker compose ps` |
| Stüdyo ekranı (studio.updated.com.tr) | Natro VPS, `/var/www/studio/aktif` (Caddy `/etc/caddy/conf.d/studyo.caddy`) | Kendiliğinden: `updated-studyo.timer`; elle: `sudo updated-studyo-yayinla --zorla` |
| Kod | GitHub `updated-studio/site`, `updated-studio/studio` (+ yedekte tam kopya) | |
| Yedek | Natro hosting, şifreli, her gece 03:15, son 7 gün | `/opt/updated/yedek/yedekle.sh` |

## Erişimler (kimde olmalı: Fatih + Enes + 3. kişi)
- Natro müşteri paneli (hosting, VPS, DNS, e-posta).
- VPS'e bağlanma (kullanıcı ve şifre/anahtar; Natro panelinde VPS bilgileri).
- GitHub `updated-studio` kuruluşu (Owner).
- **Yedek şifresi** (`YEDEK_SIFRESI`): onsuz yedekler açılamaz. Şifre yöneticisinde + basılı/kasada.
- Gemini/Groq hesapları, studio@updated.com.tr e-posta şifresi.

## Sık durumlar
- **Panel açılmıyor:** VPS'e bağlan → `sudo systemctl restart updated-panel`; olmazsa `journalctl -u updated-panel -n 50`.
- **Stüdyo giriş/veri gelmiyor:** `cd /opt/updated/supabase && sudo docker compose up -d` (kapalı servisleri açar).
- **Stüdyo'nun yeni sürümü bozuk çıktı:** `ls /var/www/studio/surumler` → bir öncekini seç → `sudo ln -sfn /var/www/studio/surumler/<klasör> /var/www/studio/aktif` (anında döner).
- **Sunucu yeniden başladı:** her şey kendiliğinden açılır (Docker ve servisler otomatik). Claude: `claude-sunucu`.

## Yedekten geri kurma (özet)
1. Hosting'den yedek klasörünü indir (FTP, `public_html` altında `.yedek-…` klasörü, gün adlı alt klasör).
2. Aç: `openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in veritabani.tar.gz.enc -pass pass:'YEDEK_SIFRESI' | tar xz`
   (dosyalar için aynısı `dosyalar.tar.gz.enc`).
3. İçinden çıkanlar: `natro/` (veritabanı SQL'leri), `kod/` (site ve Stüdyo kodunun tam geçmişi: `git clone site.bundle site`), `gizli/` (sunucu ayarları ve anahtarlar).
4. Yeni sunucuda: kodu aç → `deploy/altyapi/kur.sh` (Supabase) → `gizli/supabase.env`'yi `/opt/updated/supabase/.env` yap → SQL'leri sırayla yükle (`sema.sql`, `veri.sql`, `depolama.sql`, `zamanlanmis-isler.sql`) → `dosyalar` klasörünü `volumes/storage`'a koy → `deploy/panel/kur.sh` + `guncelle.sh` (panel).
