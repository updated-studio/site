#!/usr/bin/env bash
# Panelin (Payload) veritabanını ve görsellerini Supabase bulutundan Natro'daki Supabase'e taşır, paneli yeni adreslere geçirir.
# Buluttaki veri SİLİNMEZ. Geri dönüş: /etc/updated-panel.yerel dosyasını kaldır + `systemctl restart updated-panel`.
# Kullanım: sudo bash panel-tasi.sh            (zaten taşındıysa yalnız görselleri eşitler)
#           sudo YENIDEN=1 bash panel-tasi.sh  (yereldeki payload şemasını silip buluttan yeniden alır)
set -euo pipefail
# EMNİYET (23 Ekim 2026): taşıma bitti, panel Natro'dan çalışıyor. Bu betik Natro'daki panel verisini buluttaki BAYAT kopyayla
# değiştirir; yalnız bilerek, felaket kurtarma için: PANEL_TASI_ONAY=natro-verisini-sil
[ "${PANEL_TASI_ONAY:-}" = natro-verisini-sil ] || { echo "Durduruldu: panel zaten Natro'da; bu betik Natro'daki güncel veriyi siler. Bkz. DURUM.md."; exit 1; }
SB=/opt/updated/supabase
YEREL=/etc/updated-panel.yerel
HERE="$(cd "$(dirname "$0")" && pwd)"
DOMAIN="${PANEL_DOMAIN:-panel.updated.com.tr}"
deger() { sed -n "s/^$1=//p" "$2" | head -1 | sed 's/^"\(.*\)"$/\1/'; }
psql_yerel() { docker exec -i supabase-db psql -X -q -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"; }

# Bulut (bugünkü) ayarları
CLOUD_DB=$(deger DATABASE_URI /etc/updated-panel.env)
[ -n "$CLOUD_DB" ] || { echo "Bulut veritabanı adresi bulunamadı"; exit 1; }
SERVICE=$(deger SERVICE_ROLE_KEY $SB/.env)

# 1) payload rolü (şifre yerel dosyada saklanır; tekrar çalışmada aynısı kullanılır)
PW=""; [ -f "$YEREL" ] && PW=$(deger PAYLOAD_DB_SIFRE "$YEREL") || true
[ -n "$PW" ] || PW=$(openssl rand -hex 24)
if [ "$(psql_yerel -tAc "select 1 from pg_roles where rolname='payload'")" = "1" ]; then
  psql_yerel -c "alter role payload with login password '$PW'" >/dev/null
else
  psql_yerel -c "create role payload with login password '$PW'" >/dev/null
fi
psql_yerel -c "grant connect, create on database postgres to payload" >/dev/null

# 2) Veritabanı: ilk taşımada (ya da YENIDEN=1) buluttan alınır
VAR=$(psql_yerel -tAc "select 1 from information_schema.schemata where schema_name='payload'")
# Geçişten sonra yerel veri asıldır: buluttan yeniden almak onu ezer, bu yüzden geçişten sonra YENIDEN reddedilir
if [ "${YENIDEN:-0}" = "1" ] && [ -f "$YEREL" ]; then echo "Panel zaten Natro'da çalışıyor; YENIDEN reddedildi (yerel veriyi ezerdi)"; exit 1; fi
if [ "$VAR" != "1" ] || [ "${YENIDEN:-0}" = "1" ]; then
  [ "$VAR" = "1" ] && psql_yerel -c "drop schema payload cascade" >/dev/null
  docker exec supabase-db pg_dump "$CLOUD_DB" -n payload --no-owner --no-privileges -Fc -f /tmp/payload.dump
  docker exec -e PGPASSWORD="$PW" supabase-db pg_restore -h localhost -U payload -d postgres --no-owner --no-privileges --exit-on-error /tmp/payload.dump
  docker exec supabase-db rm -f /tmp/payload.dump
  echo "veritabanı: buluttan alındı"
else
  echo "veritabanı: zaten taşınmış (yeniden almak için YENIDEN=1)"
fi
# Doğrulama: buluttaki ve yereldeki kayıt sayıları
say() { echo "select (select count(*) from payload.news)||'/'||(select count(*) from payload.media)||'/'||(select count(*) from payload.categories)"; }
B=$(docker exec supabase-db psql -X "$CLOUD_DB" -tAc "$(say)")
Y=$(psql_yerel -tAc "$(say)")
echo "kayıt (haber/görsel/kategori): bulut $B · Natro $Y"

# 3) Görseller: yerelde "media" kovası (herkese açık) + buluttan kopya
curl -s -o /dev/null -X POST http://127.0.0.1:8000/storage/v1/bucket -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" \
  -H "Content-Type: application/json" -d '{"id":"media","name":"media","public":true}' || true
KAYNAK_ENDPOINT=$(deger S3_ENDPOINT /etc/updated-panel.env) KAYNAK_REGION=$(deger S3_REGION /etc/updated-panel.env) \
KAYNAK_KEY=$(deger S3_ACCESS_KEY_ID /etc/updated-panel.env) KAYNAK_SECRET=$(deger S3_SECRET_ACCESS_KEY /etc/updated-panel.env) \
HEDEF_ENDPOINT=https://$DOMAIN/storage/v1/s3 HEDEF_REGION=$(deger REGION $SB/.env) \
HEDEF_KEY=$(deger S3_PROTOCOL_ACCESS_KEY_ID $SB/.env) HEDEF_SECRET=$(deger S3_PROTOCOL_ACCESS_KEY_SECRET $SB/.env) \
NODE_PATH=/opt/updated/site/node_modules node "$HERE/medya-kopyala.cjs"

# Not: depolama S3 imzasını genel adrese (SUPABASE_PUBLIC_URL) göre doğrular; uç bu yüzden 127.0.0.1 değil, genel adres.
# 4) Panel yeni adreslere: yerel dosya bulut ayarlarının önüne geçer (systemd'de en son yüklenir)
umask 027
cat > "$YEREL" <<EOF
# Natro'daki Supabase (deploy/altyapi/panel-tasi.sh). Silinirse panel buluta döner.
PAYLOAD_DB_SIFRE=$PW
DATABASE_URI=postgresql://payload:$PW@127.0.0.1:5432/postgres
S3_BUCKET=media
S3_ENDPOINT=https://$DOMAIN/storage/v1/s3
S3_REGION=$(deger REGION $SB/.env)
S3_ACCESS_KEY_ID=$(deger S3_PROTOCOL_ACCESS_KEY_ID $SB/.env)
S3_SECRET_ACCESS_KEY=$(deger S3_PROTOCOL_ACCESS_KEY_SECRET $SB/.env)
MEDIA_PUBLIC_URL=https://$DOMAIN/storage/v1/object/public/media
EOF
chown root:panel "$YEREL" && chmod 640 "$YEREL"
U=/etc/systemd/system/updated-panel.service
grep -q "updated-panel.yerel" $U || sed -i '/^EnvironmentFile=\/etc\/updated-panel.secrets/a EnvironmentFile=-/etc/updated-panel.yerel' $U
systemctl daemon-reload && systemctl restart updated-panel

# 5) Deneme; olmazsa buluta geri dön
ok=0
for i in $(seq 1 40); do curl -sf -o /dev/null http://127.0.0.1:3001/admin && { ok=1; break; }; sleep 3; done
H=$(curl -s "http://127.0.0.1:3001/api/news?limit=1&depth=0" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).totalDocs)}catch{console.log('?')}})")
G=$(curl -s "http://127.0.0.1:3001/api/media?limit=1&depth=0" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).docs[0].url)}catch{console.log('')}})")
GK=$( [ -n "$G" ] && curl -s -o /dev/null -w '%{http_code}' "$G" || echo yok)
echo "panel: açılış $ok · yayındaki haber $H · örnek görsel $GK ($G)"
if [ "$ok" != "1" ] || [ "$H" = "?" ] || [ "$GK" != "200" ]; then
  mv "$YEREL" "$YEREL.iptal"; systemctl restart updated-panel
  echo "DENEME BAŞARISIZ: panel buluta geri döndü ($YEREL.iptal)"; exit 1
fi
echo "TAMAM: panel Natro'daki veritabanı ve görsellerle çalışıyor"
