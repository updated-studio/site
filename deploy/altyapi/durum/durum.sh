#!/usr/bin/env bash
# Sistem durumu özeti (25 Ekim 2026; Stüdyo → Sistem Durumu). 5 dakikada bir (updated-durum.timer) çalışır,
# /var/lib/updated-durum/durum.json'a yazar. Gizli bilgi yazılmaz; panel bu dosyayı yalnız yöneticilere verir (/api/studyo/durum).
set -uo pipefail
CIKTI=/var/lib/updated-durum/durum.json
mtime() { [ -e "$1" ] && date -u -d "@$(stat -c %Y "$1")" +%FT%TZ || echo null; }
q() { docker exec supabase-db psql -U postgres -d postgres -Atc "$1" 2>/dev/null; }
aktif() { systemctl is-active "$1" 2>/dev/null || true; }

# Site: son başarılı derleme (son), hata işareti (yeniden), son derleme günlüğünün son satırı
S=/var/lib/updated-site
site_hata=false; [ -f $S/yeniden ] && site_hata=true
site_son=$(tail -n 3 $S/derleme.log 2>/dev/null | tr -d '\r' | tail -n 1 | cut -c1-200)
site_yukleme=$(mtime $S/yukleme.log)

# Stüdyo ekranı: son derleme günlüğü
T=/var/lib/updated-studyo
studyo_hata=false; grep -qi "hata\|error" <(tail -n 20 $T/derleme.log 2>/dev/null | grep -vi "warn\|chunk") && studyo_hata=true

# Gece yedeği: son satır (zaman · özet); hosting kopyası "hosting tamam" ise başarılı
yedek_son=$(tail -n 1 /opt/updated/yedek/yedek.log 2>/dev/null | cut -c1-19)
yedek_hosting=false; tail -n 1 /opt/updated/yedek/yedek.log 2>/dev/null | grep -q "hosting tamam" && yedek_hosting=true
yedek_github=true; tail -n 1 /opt/updated/yedek/yedek.log 2>/dev/null | grep -q "GitHub HATA" && yedek_github=false

# Sunucu
disk=$(df --output=pcent / | tail -1 | tr -dc 0-9)
bellek=$(free -m | awk '/^Mem:/{print int($7)}')
takas=$(free -m | awk '/^Swap:/{print int($3)}')
yuk=$(cut -d' ' -f1 /proc/loadavg)
kapsayicilar=$(docker ps -a --format '{{.Names}}\t{{.Status}}' 2>/dev/null | jq -R -s 'split("\n") | map(select(length>0) | split("\t") | {ad: .[0], durum: .[1], saglikli: ((.[1] | test("^Up")) and ((.[1] | test("unhealthy")) | not))})')

# Veritabanı: zamanlanmış işler, Haber Masası, kaynaklar
isler=$(q "select coalesce(json_agg(x order by x.ad), '[]') from (select j.jobname ad, j.schedule plan, max(d.end_time) filter (where d.status='succeeded') son_basari, count(*) filter (where d.status='failed' and d.start_time>now()-interval '24 hours') hata24 from cron.job j left join cron.job_run_details d on d.jobid=j.jobid and d.start_time>now()-interval '3 days' group by 1,2) x")
haber=$(q "select json_build_object('son_haber', (select max(created_at) from tr_items), 'son24', (select count(*) from tr_items where created_at>now()-interval '24 hours'), 'oto', (select value from tr_settings where key='oto_son'), 'taslak24', (select count(*) from tr_drafts where created_at>now()-interval '24 hours'), 'kaynak_calisan', (select count(*) from tr_sources where active and status='Çalışıyor'), 'kaynak_sorunlu', (select count(*) from tr_sources where active and status<>'Çalışıyor'), 'sorunlu_kaynaklar', (select coalesce(json_agg(name), '[]') from tr_sources where active and status<>'Çalışıyor'))")
site_db=$(q "select json_build_object('son_yayin', (select max(published_at) from payload.news where _status='published'), 'bugun', (select count(*) from payload.news where _status='published' and published_at >= date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul'), 'incelemede', (select count(*) from payload.news where _status='draft' and workflow_state='incelemede'), 'uper', (select count(*) from payload.uyeler), 'yorum_onayda', (select count(*) from payload.yorumlar where durum='onay-bekliyor'))")

mkdir -p "$(dirname $CIKTI)"
jq -n \
  --arg zaman "$(date -u +%FT%TZ)" \
  --argjson site_hata $site_hata --arg site_son "$site_son" --arg site_derleme "$(mtime $S/derleme.log)" --arg site_yukleme "$site_yukleme" --arg site_commit "$(head -c 7 $S/son 2>/dev/null)" \
  --argjson studyo_hata $studyo_hata --arg studyo_derleme "$(mtime $T/derleme.log)" \
  --arg panel "$(aktif updated-panel)" --arg panel_guncelle "$(systemctl is-failed updated-panel-guncelle 2>/dev/null || true)" --arg caddy "$(aktif caddy)" \
  --arg yedek_son "$yedek_son" --argjson yedek_hosting $yedek_hosting --argjson yedek_github $yedek_github \
  --argjson disk "${disk:-0}" --argjson bellek "${bellek:-0}" --argjson takas "${takas:-0}" --arg yuk "$yuk" \
  --argjson kapsayicilar "${kapsayicilar:-[]}" --argjson isler "${isler:-[]}" --argjson haber "${haber:-null}" --argjson site_db "${site_db:-null}" \
  '{zaman:$zaman,
    site:{hata:$site_hata, son_satir:$site_son, son_derleme:$site_derleme, son_yukleme:$site_yukleme, surum:$site_commit, icerik:$site_db},
    studyo:{hata:$studyo_hata, son_derleme:$studyo_derleme},
    panel:{durum:$panel, guncelleme:$panel_guncelle}, caddy:$caddy,
    yedek:{son:$yedek_son, hosting:$yedek_hosting, github:$yedek_github},
    sunucu:{disk_yuzde:$disk, bos_bellek_mb:$bellek, takas_mb:$takas, yuk:$yuk},
    kapsayicilar:$kapsayicilar, zamanlanmis_isler:$isler, haber_masasi:$haber}' > $CIKTI.tmp && mv $CIKTI.tmp $CIKTI
chmod 644 $CIKTI
