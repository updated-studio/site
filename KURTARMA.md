# Kurtarma kılavuzu (Claude olmadan da)

Bu dosya, Claude'a ya da bir kişiye erişilemese bile sistemi ayakta tutmak ve geri kurmak için yazıldı. Ayrıntılı kararlar: `ARCHITECTURE.md`, güncel durum: `DURUM.md`.

## Neler nerede (23 Ekim 2026)
| Parça | Yer | Nasıl yönetilir |
|---|---|---|
| Site (updated.com.tr) | Natro paylaşımlı hosting, `public_html` | Natro VPS'te derlenir, FTP ile yüklenir: `sudo updated-site-yayinla --zorla` (kayıt: `journalctl -u updated-site-yayin`) |
| Panel (panel.updated.com.tr) | Natro VPS, `/opt/updated/site/apps/cms`, servis `updated-panel` | `systemctl restart updated-panel` |
| Veritabanı + giriş + dosyalar + Stüdyo fonksiyonları | Natro VPS, `/opt/updated/supabase` (Supabase açık kaynak, Docker) | `cd /opt/updated/supabase && sudo docker compose ps` |
| Stüdyo ekranı (studio.updated.com.tr) | Natro VPS, `/var/www/studio/aktif` (Caddy `/etc/caddy/conf.d/studyo.caddy`) | Kendiliğinden: `updated-studyo.timer`; elle: `sudo updated-studyo-yayinla --zorla` |
| Kod | GitHub `updated-studio/site`, `updated-studio/studio` (+ yedekte tam kopya) | GitHub sunucuya bağlanmaz; sunucu 2 dk'da bir `main`'i çeker (site, panel, Stüdyo) |
| Okur hesapları (Uper'ler, 24 Ekim 2026) | Natro VPS, ayrı giriş servisi `supabase-uye-auth` (veritabanı `uyeler`), dışarıya `panel.updated.com.tr/uye/v1`; profiller/yorumlar panelde (`payload.uyeler`, `payload.yorumlar`) | Kurulum/ayar: `sudo bash deploy/altyapi/uye/kur.sh`; Google ve Cloudflare anahtarları: `sudo updated-uye-ayar google` / `cloudflare` / `durum` |
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
- **Site güncellenmiyor:** `journalctl -u updated-site-yayin -n 40`; elle: `sudo updated-site-yayinla --zorla`. GitHub'a ihtiyaç yok.
- **Panel kodu güncellenmiyor:** `journalctl -u updated-panel-guncelle -n 40`; elle: `sudo updated-panel-guncelle`.
- **Ekipten biri Stüdyo'nun Site modülüne giremiyor:** Stüdyo → Ekip → Yönetim'de site rolüne bak ("Sitede yetkisi yok" ise rol ver). Panel hesabı ilk girişte kendiliğinden açılır (`apps/cms/src/auth/studyo.ts`).
- **Stüdyo'da rol değişti ama panele yansımadı / veritabanı yeniden kurulduysa:** tetikleyicinin izni (bir kez): `sudo docker exec -i supabase-db psql -U supabase_admin -d postgres -c "grant usage on schema payload to postgres; grant select, update (role, name, enable_a_p_i_key, api_key, api_key_index) on payload.users to postgres; grant select, delete on payload.users_sessions to postgres"`.
- **Okurlar giriş yapamıyor / kayıt e-postası gelmiyor:** `sudo docker logs --tail 50 supabase-uye-auth`; servis kapalıysa `cd /opt/updated/supabase && sudo docker compose up -d uye-auth`. Ayarları yeniden yazmak: `sudo bash /opt/updated/site/deploy/altyapi/uye/kur.sh`.
- **Yorumlar yüklenmiyor:** panel uçları `/api/uye/*` (`apps/cms/src/endpoints/uye.ts`); `journalctl -u updated-panel -n 50 | grep uye`.
- **Sunucu yeniden başladı:** her şey kendiliğinden açılır (Docker ve servisler otomatik). Claude: `claude-sunucu`.

## Yedekten geri kurma (özet)
1. Hosting'den yedek klasörünü indir (FTP, `public_html` altında `.yedek-…` klasörü, gün adlı alt klasör).
2. Aç: `openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in veritabani.tar.gz.enc -pass pass:'YEDEK_SIFRESI' | tar xz`
   (dosyalar için aynısı `dosyalar.tar.gz.enc`).
3. İçinden çıkanlar: `natro/` (veritabanı SQL'leri), `kod/` (site ve Stüdyo kodunun tam geçmişi: `git clone site.bundle site`), `gizli/` (sunucu ayarları ve anahtarlar).
4. Yeni sunucuda: kodu aç → `deploy/altyapi/kur.sh` (Supabase) → `gizli/supabase.env`'yi `/opt/updated/supabase/.env` yap → SQL'leri sırayla yükle (`veri.sql`'i `PGOPTIONS='-c session_replication_role=replica'` ile: yorumlar birbirine bağlı olduğu için; `sema.sql`, `veri.sql`, `depolama.sql`, `zamanlanmis-isler.sql`) → okur hesapları: `gizli/uye-gizli.env` ve `gizli/uye-dis.env`'yi `/opt/updated/supabase/`'a koy, `deploy/altyapi/uye/kur.sh` çalıştır (veritabanını ve tabloları kurar), sonra `uye-hesaplari.sql`'i `uyeler` veritabanına yükle → `dosyalar` klasörünü `volumes/storage`'a koy → `deploy/panel/kur.sh` + `guncelle.sh` (panel).
