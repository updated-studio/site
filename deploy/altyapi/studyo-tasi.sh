#!/usr/bin/env bash
# Stüdyo'nun Supabase'ini (bulut, fulmooonidwrqyybbkvu) Natro'daki Supabase'e taşır. Buluttaki veri SİLİNMEZ.
#   ASAMA=deneme : kopyalar; Natro'daki zamanlanmış işler KAPALI kalır (haber iki kez toplanmasın, e-posta iki kez gitmesin).
#                  Stüdyo arayüzü hâlâ buluta bağlı; Natro'daki kopya yalnız denemek için.
#   ASAMA=gecis  : buluttaki zamanlanmış işleri durdurur, son veriyi yeniden kopyalar, Natro'dakileri açar.
#                  (Arayüzün yeni adrese geçmesi ayrıca: Stüdyo deposu src/shared/supabase.ts.)
# Her çalışmada Natro'daki Stüdyo verisi (public şeması, auth kullanıcıları, Stüdyo zamanlanmış işleri) silinip buluttan yeniden alınır.
# Panelin verisi (payload şeması, media kovası) etkilenmez.
# Gizli bilgiler: /tmp/altyapi/studyo.env (iş akışı yazar, iş bitince silinir).
# Kullanım: sudo ASAMA=deneme bash studyo-tasi.sh
set -euo pipefail
ASAMA="${ASAMA:-deneme}"
SB=/opt/updated/supabase
HERE="$(cd "$(dirname "$0")" && pwd)"
DOMAIN="${PANEL_DOMAIN:-panel.updated.com.tr}"
REF=fulmooonidwrqyybbkvu
BULUT_URL="https://$REF.supabase.co"
deger() { sed -n "s/^$1=//p" "$2" | head -1 | sed 's/^"\(.*\)"$/\1/'; }
GIZLI="$HERE/studyo.env"
[ -f "$GIZLI" ] || { echo "gizli bilgi dosyası yok"; exit 1; }
BULUT_SIFRE=$(deger STUDYO_DB_SIFRE "$GIZLI")
# Havuz adresi: aynı bölgede aws-0 / aws-1 olabilir; çalışan seçilir
HAVUZ=""
for h in aws-1-eu-central-1 aws-0-eu-central-1; do
  if docker exec -e PGPASSWORD="$BULUT_SIFRE" supabase-db psql -X -tAc "select 1" "host=$h.pooler.supabase.com port=5432 dbname=postgres user=postgres.$REF sslmode=require connect_timeout=10" >/dev/null 2>&1; then HAVUZ=$h; break; fi
done
[ -n "$HAVUZ" ] || { echo "hata: Stüdyo bulut veritabanına bağlanılamadı"; exit 1; }
BULUT="host=$HAVUZ.pooler.supabase.com port=5432 dbname=postgres user=postgres.$REF sslmode=require"
BULUT_URI="postgresql://postgres.$REF:$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],safe=""))' "$BULUT_SIFRE")@$HAVUZ.pooler.supabase.com:5432/postgres"

bulut() { docker exec -i -e PGPASSWORD="$BULUT_SIFRE" supabase-db psql -X -q "$BULUT" -v ON_ERROR_STOP=1 "$@"; }
sa()    { docker exec -i supabase-db psql -X -q -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"; }
pg()    { docker exec -i supabase-db psql -X -q -U postgres -h localhost -d postgres -v ON_ERROR_STOP=1 "$@"; }
I=/tmp/studyo-tasi; rm -rf $I; mkdir -p $I; chmod 700 $I

echo "== aşama: $ASAMA"
bulut -tAc "select 'bulut bağlantısı tamam · ' || version()" | cut -c1-60

# 0) Zamanlanmış işler: buluttaki liste (geçişte önce buluttakiler durdurulur)
echo "== adım 0"
bulut -tA -c "select format('select cron.schedule(%L, %L, %L);', jobname, schedule, replace(command, 'https://$REF.supabase.co/functions/v1/', 'http://functions:9000/')) from cron.job order by jobid" > $I/cron.sql
bulut -tA -c "select format('update cron.job set active = %L where jobname = %L;', active, jobname) from cron.job order by jobid" > $I/cron-aktif.sql
echo "buluttaki zamanlanmış işler: $(grep -c . $I/cron.sql)"
if [ "$ASAMA" = "gecis" ]; then
  bulut -tAc "select count(cron.alter_job(jobid, active := false)) from cron.job where active" | sed 's/^/buluttaki işler durduruldu: /'
fi

# 1) Bulut dökümü (yalnız Stüdyo'nun kendi şeması public; auth ve depolama ayrıca)
echo "== adım 1"
docker exec -e PGPASSWORD="$BULUT_SIFRE" supabase-db pg_dump "$BULUT" -s -n public --no-owner -f /tmp/st-sema.sql
docker exec -e PGPASSWORD="$BULUT_SIFRE" supabase-db pg_dump "$BULUT" -a -n public --no-owner -f /tmp/st-veri.sql
docker cp supabase-db:/tmp/st-sema.sql $I/sema.sql; docker cp supabase-db:/tmp/st-veri.sql $I/veri.sql
docker exec supabase-db rm -f /tmp/st-sema.sql /tmp/st-veri.sql
# Bulut adresleri: fonksiyon çağrıları doğrudan fonksiyon sunucusuna, dosya adresleri panel alan adına
sed -i "s#https://$REF.supabase.co/functions/v1/#http://functions:9000/#g" $I/sema.sql
sed -i "s#https://$REF.supabase.co/storage/v1/#https://$DOMAIN/storage/v1/#g; s#https://$REF.supabase.co/functions/v1/#http://functions:9000/#g" $I/veri.sql
grep -E '^ALTER PUBLICATION' $I/sema.sql > $I/yayin.sql || true
sed -i '/^ALTER PUBLICATION/d; /^COMMENT ON SCHEMA public/d; /^CREATE SCHEMA public;/d' $I/sema.sql
# Supabase'in kendi rolleri adına varsayılan yetkiler (bulutta platform yazar; burada yalnız postgres'inkiler kalır)
sed -i '/^ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin/d; /^ALTER DEFAULT PRIVILEGES FOR ROLE supabase_/d' $I/sema.sql
echo "döküm: şema $(grep -c '^CREATE TABLE' $I/sema.sql) tablo · veri $(du -h $I/veri.sql | cut -f1)"

# 2) Natro'daki eski Stüdyo kopyasını temizle (panelin payload şemasına dokunulmaz)
echo "== adım 2"
sa <<'SQL'
-- Stüdyo'nun bulutta kullandığı eklentiler: zamanlanmış işler (pg_cron) ve sunucudan istek (pg_net)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
grant usage on schema net to postgres, service_role;
grant execute on all functions in schema net to postgres, service_role;
select cron.unschedule(jobid) from cron.job where jobname not like 'payload%';
drop schema if exists public cascade;
create schema public authorization postgres;
grant usage on schema public to anon, authenticated, service_role;
truncate auth.users cascade;
SQL
# Varsayılan yetkiler postgres adına (yeni tablo/fonksiyon API rollerine açık; bulutla aynı)
pg <<'SQL'
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
SQL

# 3) Şema (postgres sahipliğinde, buluttaki gibi) + gerçek zamanlı yayın listesi
echo "== adım 3"
pg < $I/sema.sql
[ -s $I/yayin.sql ] && sa < $I/yayin.sql
# auth.users / storage üzerindeki Stüdyo tetikleyicileri ve depolama erişim kuralları
bulut -tA -c "select format('drop trigger if exists %I on %s; ', t.tgname, t.tgrelid::regclass) || pg_get_triggerdef(t.oid) || ';' from pg_trigger t join pg_proc p on p.oid=t.tgfoid join pg_namespace n on n.oid=p.pronamespace
  where t.tgrelid in ('auth.users'::regclass,'storage.objects'::regclass,'storage.buckets'::regclass) and not t.tgisinternal and n.nspname='public'" > $I/tetik.sql
bulut -tA -c "select format('drop policy if exists %I on %I.%I; create policy %I on %I.%I as %s for %s to %s%s%s;', policyname, schemaname, tablename, policyname, schemaname, tablename,
  permissive, cmd, array_to_string(roles, ', '), coalesce(' using (' || qual || ')', ''), coalesce(' with check (' || with_check || ')', ''))
  from pg_policies where schemaname='storage'" > $I/kural.sql
sa < $I/tetik.sql; sa < $I/kural.sql
echo "tetikleyici: $(grep -c . $I/tetik.sql) · depolama kuralı: $(grep -c . $I/kural.sql)"

# 4) Kullanıcı hesapları (şifreleriyle): yalnız iki tarafta da olan, üretilmemiş sütunlar (sürüm farkına karşı)
echo "== adım 4"
for t in users identities; do
  ortak=$(comm -12 \
    <(bulut -tAc "select column_name from information_schema.columns where table_schema='auth' and table_name='$t' and is_generated='NEVER' " | sort) \
    <(sa -tAc "select column_name from information_schema.columns where table_schema='auth' and table_name='$t' and is_generated='NEVER'" | sort) | paste -sd, -)
  bulut -c "\copy (select $ortak from auth.$t) to stdout" > $I/auth-$t.tsv
  sa -c "set session_replication_role = replica" -c "\copy auth.$t($ortak) from stdin" < $I/auth-$t.tsv
  echo "auth.$t: $(wc -l < $I/auth-$t.tsv) kayıt"
done

# 5) Stüdyo verisi (tetikleyiciler kapalı: kayıtlar olduğu gibi gelsin)
echo "== adım 5"
( echo "set session_replication_role = replica;"; cat $I/veri.sql ) | sa

# 6) Haber Masası → panel kolonları (göç 0024; bulutta hiç çalışmadı)
echo "== adım 6"
[ -f "$HERE/0024_site_paneli.sql" ] && pg < "$HERE/0024_site_paneli.sql" && echo "göç 0024 uygulandı"

# 7) Depolama kovaları ve dosyalar
echo "== adım 7"
bulut -tA -F $'\t' -c "select id, public, coalesce(file_size_limit::text,''), coalesce(array_to_string(allowed_mime_types, ','),'') from storage.buckets where id <> 'media'" |
while IFS=$'\t' read -r id acik boyut turler; do
  sa -c "insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('$id','$id','$acik'::boolean,nullif('$boyut','')::bigint,nullif(string_to_array('$turler',','),'{}'))
         on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types" < /dev/null
  echo "kova: $id (herkese açık: $acik)"
done
BULUT_DB="$BULUT_URI" BULUT_URL="$BULUT_URL" HEDEF_ENDPOINT="https://$DOMAIN/storage/v1/s3" HEDEF_REGION=$(deger REGION $SB/.env) \
HEDEF_KEY=$(deger S3_PROTOCOL_ACCESS_KEY_ID $SB/.env) HEDEF_SECRET=$(deger S3_PROTOCOL_ACCESS_KEY_SECRET $SB/.env) \
NODE_PATH=/opt/updated/site/node_modules node "$HERE/studyo-dosya-kopyala.cjs"

# 8) Zamanlanmış işler: aynı adlarla; denemede hepsi kapalı, geçişte buluttaki açık/kapalı durumuyla
echo "== adım 8"
pg -tA < $I/cron.sql >/dev/null
if [ "$ASAMA" = "gecis" ]; then sa < $I/cron-aktif.sql; else sa -c "update cron.job set active = false"; fi
echo "zamanlanmış iş: $(sa -tAc 'select count(*) from cron.job') (açık: $(sa -tAc 'select count(*) from cron.job where active'))"

# 10) Fonksiyonlar: kod (Stüdyo deposundan) + gizli bilgiler + giriş e-postaları (SMTP)
echo "== adım 10"
F=$SB/functions.env; umask 077
FLUX=$( [ -f $F ] && deger FLUX_TOKEN $F || true ); [ -n "$FLUX" ] || FLUX=$(openssl rand -hex 24)
{
  echo "GEMINI_API_KEY=$(deger GEMINI_API_KEY "$GIZLI")"
  echo "GROQ_API_KEY=$(deger GROQ_API_KEY "$GIZLI")"
  echo "SMTP_HOST=mail.kurumsaleposta.com"
  echo "SMTP_PORT=465"
  echo "SMTP_USER=studio@updated.com.tr"
  echo "SMTP_PASSWORD=$(deger SMTP_PASSWORD "$GIZLI")"
  echo "MAIL_FROM=studio@updated.com.tr"
  echo "FLUX_TOKEN=$FLUX"
  echo "STUDIO_IMPORT_KEY=$(deger STUDIO_IMPORT_KEY /etc/updated-panel.secrets)"
  echo "PANEL_URL=https://$DOMAIN"
  echo "SITE_URL=https://updated.com.tr"
} > $F
chmod 600 $F
if [ -d "$HERE/fonksiyonlar" ]; then
  for d in "$HERE"/fonksiyonlar/*/; do n=$(basename "$d"); rm -rf "$SB/volumes/functions/$n"; cp -a "$d" "$SB/volumes/functions/$n"; done
  echo "fonksiyonlar: $(ls "$HERE/fonksiyonlar" | paste -sd' ' -)"
fi
(
  cd $SB
  ayarla() { if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else echo "$1=$2" >> .env; fi; }
  ayarla SMTP_ADMIN_EMAIL studio@updated.com.tr; ayarla SMTP_HOST mail.kurumsaleposta.com; ayarla SMTP_PORT 465
  ayarla SMTP_USER studio@updated.com.tr; ayarla SMTP_PASS "$(deger SMTP_PASSWORD "$GIZLI")"; ayarla SMTP_SENDER_NAME "Updated Studyo"
  ayarla DISABLE_SIGNUP false
  docker compose up -d auth functions >/dev/null 2>&1
)
for i in $(seq 1 30); do [ "$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS http://127.0.0.1:8000/functions/v1/triyaj-taslak)" = 200 ] && break; sleep 3; done
echo "fonksiyon denemesi (triyaj-taslak OPTIONS): $(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS http://127.0.0.1:8000/functions/v1/triyaj-taslak)"

# 9) Karşılaştırma: tablo tablo kayıt sayısı
echo "== adım 9"
fark=0; toplam=0
for t in $(pg -tAc "select tablename from pg_tables where schemaname='public' order by 1"); do
  b=$(bulut -tAc "select count(*) from public.\"$t\""); y=$(pg -tAc "select count(*) from public.\"$t\"")
  toplam=$((toplam+y)); [ "$b" = "$y" ] || { echo "FARK $t: bulut $b · Natro $y"; fark=$((fark+1)); }
done
echo "public: $(pg -tAc "select count(*) from pg_tables where schemaname='public'") tablo, $toplam kayıt, farklı tablo: $fark"
echo "kullanıcı: bulut $(bulut -tAc 'select count(*) from auth.users') · Natro $(sa -tAc 'select count(*) from auth.users')"
rm -rf $I
echo "TAMAM ($ASAMA)"
