#!/usr/bin/env bash
# Natro gece yedeği: veritabanı (Stüdyo + panel + kullanıcı hesapları + depolama kayıtları) ve depolama dosyaları
# → özel GitHub deposu updated-studio/yedek, klasör natro/ (sunucu kendi gönderir; GitHub'da iş çalışmaz).
# Eski yedekler deponun geçmişinde durur (düz SQL; git yalnız farkı saklar). Dosyalar bir kez yüklenir, sonra yalnız yenileri.
# Gizli anahtarlar (.env, functions.env, panel secrets) YEDEKLENMEZ: geri yüklemede yeni anahtar üretilir, herkes yeniden giriş yapar.
# Kurulum: deploy/altyapi/yedek/kur.sh (cron: her gece 03:15 Türkiye). Elle: sudo bash /opt/updated/yedek/yedekle.sh
set -euo pipefail
D=/opt/updated/yedek
REPO=$D/depo
SB=/opt/updated/supabase
export GIT_SSH_COMMAND="ssh -i $D/anahtar -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
log() { echo "$(date '+%F %T') $*" | tee -a $D/yedek.log; }

if [ ! -d $REPO/.git ]; then git clone -q --depth 1 git@github.com:updated-studio/yedek.git $REPO; fi
git -C $REPO fetch -q --depth 1 origin main && git -C $REPO reset -q --hard origin/main
mkdir -p $REPO/natro/dosyalar

d() { docker exec supabase-db pg_dump -U supabase_admin -d postgres --no-owner "$@"; }
# Şema: Stüdyo (public) + panel (payload). auth/storage şemaları Supabase'in kendi kurulumundan gelir.
d -s -n public -n payload > $REPO/natro/sema.sql
# Veri: Stüdyo, panel, kullanıcı hesapları (auth), zamanlanmış işler
d -a -n public -n payload -n auth --exclude-table='auth.schema_migrations' > $REPO/natro/veri.sql
d -a -t cron.job > $REPO/natro/zamanlanmis-isler.sql
# Depolama kayıtları (kovalar ve dosya listesi); dosyaların kendisi aşağıda
d -a -t storage.buckets -t storage.objects > $REPO/natro/depolama.sql
# Dosyalar: Supabase depolama klasörü (değişmeyenler git'te tekrar saklanmaz)
rsync -a --delete $SB/volumes/storage/ $REPO/natro/dosyalar/
ls -la $SB/volumes/functions > /dev/null && tar -C $SB/volumes/functions -czf $REPO/natro/fonksiyonlar.tgz --exclude=main --exclude=hello .

boyut=$(du -sh $REPO/natro | cut -f1)
satir="$(date -u '+%Y-%m-%dT%H:%M:%SZ') · $boyut · Stüdyo $(docker exec supabase-db psql -X -tA -U supabase_admin -d postgres -c 'select count(*) from public.tr_items') haber · panel $(docker exec supabase-db psql -X -tA -U supabase_admin -d postgres -c 'select count(*) from payload.news') haber · $(docker exec supabase-db psql -X -tA -U supabase_admin -d postgres -c 'select count(*) from auth.users') hesap"
echo "$satir" > $REPO/natro/SON_YEDEK.txt
cd $REPO
git add -A natro
if git diff --cached --quiet; then log "değişiklik yok"; exit 0; fi
git -c user.name="natro-yedek" -c user.email="yedek@updated.com.tr" commit -q -m "Natro yedeği $(date '+%d.%m.%Y %H:%M')"
git push -q origin HEAD:main
log "TAMAM $satir"
