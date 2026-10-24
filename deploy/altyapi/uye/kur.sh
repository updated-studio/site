#!/usr/bin/env bash
# Sitenin okur hesapları (Uper'ler) için ayrı giriş servisi: Supabase Auth (GoTrue), kendi veritabanı "uyeler", kendi anahtarı.
# Stüdyo'nun (ekibin) giriş servisinden tamamen ayrıdır: okur hesabı ekip ekranlarına hiçbir yoldan giremez.
# Tekrar çalıştırmak zararsız: anahtar ve veriler korunur, ayar dosyası yeniden yazılır, servis yeniden başlar.
# Kullanım: sudo bash deploy/altyapi/uye/kur.sh
# Google girişi ve Cloudflare doğrulaması anahtarları: sudo updated-uye-ayar (anahtarı yazan kişi girer; ekrana ve sohbete yazılmaz)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
SB=/opt/updated/supabase
GIZLI=$SB/uye-gizli.env      # kalıcı: imza anahtarı (değişirse bütün okur oturumları kapanır)
DIS=$SB/uye-dis.env          # isteğe bağlı: Google ve Cloudflare anahtarları (updated-uye-ayar yazar)
SITE=https://updated.com.tr
DIS_ADRES=https://panel.updated.com.tr/uye/v1
umask 077
install -m 755 "$HERE/ayar.sh" /usr/local/bin/updated-uye-ayar

# 1) Veritabanı: aynı Postgres sunucusunda ayrı veritabanı (Stüdyo ve panel verisiyle karışmaz)
q() { docker exec -i supabase-db psql -X -q -v ON_ERROR_STOP=1 -U supabase_admin "$@"; }
if [ "$(q -d postgres -tAc "select 1 from pg_database where datname='uyeler'")" != 1 ]; then
  q -d postgres -c "create database uyeler"
fi
q -d uyeler -c "create schema if not exists auth authorization supabase_auth_admin; grant create, connect on database uyeler to supabase_auth_admin; revoke connect on database uyeler from public; alter role supabase_auth_admin in database uyeler set search_path = auth"

# 2) Kalıcı anahtar (bir kez üretilir)
[ -f "$GIZLI" ] || echo "UYE_JWT_SECRET=$(openssl rand -hex 40)" > "$GIZLI"
chmod 600 "$GIZLI"
# shellcheck disable=SC1090
. "$GIZLI"
oku() { grep -E "^$1=" "$SB/.env" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
DB_SIFRE=$(oku POSTGRES_PASSWORD)
GOOGLE_ID=""; GOOGLE_SECRET=""; TURNSTILE_SECRET=""; TURNSTILE_SITE=""
# shellcheck disable=SC1090
[ -f "$DIS" ] && . "$DIS"

# 3) E-posta şablonları (Türkçe; Caddy panel.updated.com.tr/uye-eposta/ altından sunar, servis oradan okur)
mkdir -p /opt/updated/uye/eposta
install -m 644 "$HERE"/eposta/*.html /opt/updated/uye/eposta/
chmod 755 /opt/updated/uye /opt/updated/uye/eposta
T=https://panel.updated.com.tr/uye-eposta

# 4) Ayar dosyası
cat > $SB/uye-auth.env <<ENV
GOTRUE_API_HOST=0.0.0.0
GOTRUE_API_PORT=9999
API_EXTERNAL_URL=$DIS_ADRES
GOTRUE_DB_DRIVER=postgres
GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin:$DB_SIFRE@db:5432/uyeler
GOTRUE_DB_NAMESPACE=auth
GOTRUE_SITE_URL=$SITE/hesap
GOTRUE_URI_ALLOW_LIST=$SITE/**
GOTRUE_DISABLE_SIGNUP=false
GOTRUE_JWT_ADMIN_ROLES=service_role
GOTRUE_JWT_AUD=uye
GOTRUE_JWT_EXP=3600
GOTRUE_JWT_SECRET=$UYE_JWT_SECRET
GOTRUE_JWT_ISSUER=$DIS_ADRES
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_EXTERNAL_PHONE_ENABLED=false
GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=false
GOTRUE_PASSWORD_MIN_LENGTH=8
GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED=true
GOTRUE_MAILER_OTP_EXP=3600
GOTRUE_SMTP_ADMIN_EMAIL=$(oku SMTP_ADMIN_EMAIL)
GOTRUE_SMTP_HOST=$(oku SMTP_HOST)
GOTRUE_SMTP_PORT=$(oku SMTP_PORT)
GOTRUE_SMTP_USER=$(oku SMTP_USER)
GOTRUE_SMTP_PASS=$(oku SMTP_PASS)
GOTRUE_SMTP_SENDER_NAME=UPDATED
GOTRUE_SMTP_MAX_FREQUENCY=60s
GOTRUE_MAILER_URLPATHS_CONFIRMATION=/uye/v1/verify
GOTRUE_MAILER_URLPATHS_INVITE=/uye/v1/verify
GOTRUE_MAILER_URLPATHS_RECOVERY=/uye/v1/verify
GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE=/uye/v1/verify
GOTRUE_MAILER_TEMPLATES_CONFIRMATION=$T/onay.html
GOTRUE_MAILER_TEMPLATES_MAGIC_LINK=$T/baglanti.html
GOTRUE_MAILER_TEMPLATES_RECOVERY=$T/sifre.html
GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE=$T/eposta-degisimi.html
GOTRUE_MAILER_SUBJECTS_CONFIRMATION=UPDATED hesabını onayla
GOTRUE_MAILER_SUBJECTS_MAGIC_LINK=UPDATED giriş bağlantın
GOTRUE_MAILER_SUBJECTS_RECOVERY=UPDATED şifreni yenile
GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGE=UPDATED e-posta adresini onayla
# Kötüye kullanım sınırları (kişi başına; Caddy gerçek adresi X-Forwarded-For'a yazar)
GOTRUE_RATE_LIMIT_HEADER=X-Forwarded-For
GOTRUE_RATE_LIMIT_EMAIL_SENT=60
GOTRUE_RATE_LIMIT_VERIFY=30
GOTRUE_RATE_LIMIT_TOKEN_REFRESH=150
GOTRUE_RATE_LIMIT_OTP=30
GOTRUE_RATE_LIMIT_ANONYMOUS_USERS=0
GOTRUE_LOG_LEVEL=warn
ENV
if [ -n "$GOOGLE_ID" ] && [ -n "$GOOGLE_SECRET" ]; then
  cat >> $SB/uye-auth.env <<ENV
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=$GOOGLE_ID
GOTRUE_EXTERNAL_GOOGLE_SECRET=$GOOGLE_SECRET
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=$DIS_ADRES/callback
ENV
fi
if [ -n "$TURNSTILE_SECRET" ]; then
  cat >> $SB/uye-auth.env <<ENV
GOTRUE_SECURITY_CAPTCHA_ENABLED=true
GOTRUE_SECURITY_CAPTCHA_PROVIDER=turnstile
GOTRUE_SECURITY_CAPTCHA_SECRET=$TURNSTILE_SECRET
ENV
fi
chmod 600 $SB/uye-auth.env

# 5) Panel: okur anahtarını doğrulamak ve hesap silmek için aynı imza anahtarını bilir (/etc/updated-panel.yerel; yalnız sunucuda)
Y=/etc/updated-panel.yerel
touch $Y
yaz() { if grep -q "^$1=" $Y; then sed -i "s|^$1=.*|$1=$2|" $Y; else echo "$1=$2" >> $Y; fi; }
yaz UYE_JWT_SECRET "$UYE_JWT_SECRET"
yaz UYE_AUTH_URL "http://127.0.0.1:9998"
yaz UYE_GOOGLE "$([ -n "$GOOGLE_ID" ] && [ -n "$GOOGLE_SECRET" ] && echo 1 || echo 0)"
yaz UYE_TURNSTILE_SITE "$TURNSTILE_SITE"
# Yanıt bildirimi e-postaları (panel gönderir): giriş servisiyle aynı posta kutusu
yaz UYE_SMTP_HOST "$(oku SMTP_HOST)"; yaz UYE_SMTP_PORT "$(oku SMTP_PORT)"; yaz UYE_SMTP_USER "$(oku SMTP_USER)"; yaz UYE_SMTP_PASS "$(oku SMTP_PASS)"
chgrp panel $Y 2>/dev/null || true; chmod 640 $Y

# 6) Servisi başlat (servis tanımı ortak kurulum dosyasında)
install -m 644 "$HERE/../docker-compose.updated.yml" $SB/docker-compose.updated.yml
cd $SB
docker compose up -d uye-auth >/dev/null
for i in $(seq 1 30); do curl -sf -o /dev/null http://127.0.0.1:9998/health && break; sleep 2; done
curl -sf -o /dev/null http://127.0.0.1:9998/health && echo "Okur giriş servisi çalışıyor (Google: $([ -n "$GOOGLE_ID" ] && echo açık || echo kapalı), Cloudflare doğrulaması: $([ -n "$TURNSTILE_SECRET" ] && echo açık || echo kapalı))" || { docker logs --tail 40 supabase-uye-auth; exit 1; }
