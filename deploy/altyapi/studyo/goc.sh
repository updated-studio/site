#!/usr/bin/env bash
# Stüdyo'nun veritabanı göçünü (studio deposu supabase/migrations/NNNN_*.sql) Natro'daki Supabase'te elle uygular.
# Göçler bilerek kendiliğinden uygulanmaz: biri dosyayı okuyup bu komutu çalıştırır. Dosya tek işlemde çalışır
# (hata verirse hiçbir değişiklik kalmaz). Uygulananlar updated.studyo_gocler tablosunda.
# Kullanım: sudo updated-studyo-goc 0025_ornek.sql      · bekleyenleri listele: sudo updated-studyo-goc --bekleyen
set -euo pipefail
K=/var/lib/updated-studyo/kaynak
sql() { (cd /opt/updated/supabase && docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"); }
sql -c "set client_min_messages to warning; create schema if not exists updated; create table if not exists updated.studyo_gocler (dosya text primary key, uygulandi timestamptz not null default now());" >/dev/null
# İlk kez: o ana kadarki dosyalar (0001-0024) Natro'ya taşınırken zaten uygulanmıştı; uygulanmış sayılır.
if [ "$(sql -tAc 'select count(*) from updated.studyo_gocler')" = 0 ]; then
  for g in "$K"/supabase/migrations/0*.sql; do n=$(basename "$g"); [[ "$n" < 0025 ]] && sql -c "insert into updated.studyo_gocler values ('$n', '-infinity')" >/dev/null; done
fi
if [ "${1:-}" = --bekleyen ]; then
  [ -n "${2:-}" ] && K=$2
  for g in "$K"/supabase/migrations/[0-9]*.sql; do n=$(basename "$g")
    [ "$(sql -tAc "select count(*) from updated.studyo_gocler where dosya='$n'")" = 1 ] || printf ' %s' "$n"; done
  exit 0
fi
n=$(basename "${1:?göç dosyasının adı (ör. 0025_ornek.sql)}"); g="$K/supabase/migrations/$n"
[ -f "$g" ] || { echo "Bulunamadı: $g (önce Stüdyo yayınının main'i çekmesini bekle)"; exit 1; }
[ "$(sql -tAc "select count(*) from updated.studyo_gocler where dosya='$n'")" = 0 ] || { echo "$n zaten uygulanmış."; exit 0; }
sql -1 -f - < "$g"
sql -c "insert into updated.studyo_gocler (dosya) values ('$n')" >/dev/null
echo "uygulandı: $n"
