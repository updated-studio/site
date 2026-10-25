#!/usr/bin/env bash
# Natro gece yedeği (Fatih, 23 Ekim 2026: "GitHub artı Natro, garanti olsun"). İki ayrı yere, birbirinden bağımsız:
#   1) GitHub özel deposu updated-studio/yedek, klasör natro/ — düz SQL + dosyalar; eski yedekler deponun geçmişinde.
#   2) Natro paylaşımlı hosting (FTP), public_html/.yedek-<rastgele>/ — ŞİFRELİ (AES-256), klasör web'e kapalı (.htaccess),
#      son 7 gün (gün adıyla döner). Şifre sunucuda /opt/updated/yedek/sifre ve GitHub yedek deposunda natro/HOSTING_SIFRESI.txt.
# İçerik (hosting): + kod (depoların tam geçmişi) + gizli ayarlar. İçerik: veritabanı (Stüdyo public + panel payload + kullanıcı hesapları auth + zamanlanmış işler + depolama kayıtları),
#   depolama dosyaları (görseller, profil fotoğrafları), Stüdyo fonksiyon kodu. Gizli anahtar dosyaları (.env) yedeklenmez.
# Biri başarısız olsa diğeri yine çalışır. Kayıt: /opt/updated/yedek/yedek.log
set -uo pipefail
D=/opt/updated/yedek
SB=/opt/updated/supabase
IS=$D/is; REPO=$D/depo
log() { echo "$(date '+%F %T') $*" | tee -a $D/yedek.log; }
q() { docker exec supabase-db psql -X -tA -U supabase_admin -d postgres -c "$1"; }
dump() { docker exec supabase-db pg_dump -U supabase_admin -d postgres --no-owner "$@"; }

# --- dökümler (bir kez alınır, iki hedefe gider)
rm -rf $IS; mkdir -p $IS/natro && chmod 700 $IS
set -e
dump -s -n public -n payload > $IS/natro/sema.sql
dump -a -n public -n payload -n auth --exclude-table='auth.schema_migrations' > $IS/natro/veri.sql
dump -a -t cron.job > $IS/natro/zamanlanmis-isler.sql
dump -a -t storage.buckets -t storage.objects > $IS/natro/depolama.sql
tar -C $SB/volumes/functions -czf $IS/natro/fonksiyonlar.tgz --exclude=./main --exclude=./hello .
set +e
# Okur hesapları (Uper'ler, ayrı veritabanı "uyeler"; deploy/altyapi/uye). Profilleri ve yorumları zaten payload şemasında.
if [ "$(q "select 1 from pg_database where datname='uyeler'")" = 1 ]; then
  docker exec supabase-db pg_dump -U supabase_admin -d uyeler --no-owner -a -n auth --exclude-table='auth.schema_migrations' > $IS/natro/uye-hesaplari.sql
fi
# Kod: depoların tam geçmişi (git bundle; tek dosyadan geri açılır). Herkese açık depolar adres üzerinden alınır.
mkdir -p $IS/kod
for r in site studio; do
  rm -rf $IS/kod/$r.git
  git clone -q --mirror "https://github.com/updated-studio/$r.git" $IS/kod/$r.git 2>/dev/null \
    && git -C $IS/kod/$r.git bundle create -q $IS/kod/$r.bundle --all 2>/dev/null; rm -rf $IS/kod/$r.git
done
# Gizli ayarlar: YALNIZ şifreli hosting yedeğine girer (GitHub'a gitmez). Geri yüklemede anahtarlar aynı kalır, kimse yeniden giriş yapmaz.
mkdir -p $IS/gizli
cp $SB/.env $IS/gizli/supabase.env 2>/dev/null; cp $SB/functions.env $IS/gizli/ 2>/dev/null
cp $SB/uye-gizli.env $SB/uye-dis.env $SB/uye-auth.env $IS/gizli/ 2>/dev/null
cp /etc/updated-panel.env /etc/updated-panel.secrets /etc/updated-panel.yerel $IS/gizli/ 2>/dev/null
cp /etc/caddy/Caddyfile $IS/gizli/ 2>/dev/null
cp -r /etc/caddy/conf.d $IS/gizli/caddy-conf.d 2>/dev/null; cp /etc/updated-site.env $IS/gizli/ 2>/dev/null
# UPDATED Monitör imza anahtarı: kaybolursa uygulama güncellenemez (yeni anahtar = kaldırıp yeniden kurmak gerekir)
cp -r /opt/updated/monitor-imza $IS/gizli/ 2>/dev/null
OZET="$(date '+%d.%m.%Y %H:%M') · Stüdyo $(q 'select count(*) from public.tr_items') haber · panel $(q 'select count(*) from payload.news') haber · $(q 'select count(*) from auth.users') hesap · $(q 'select count(*) from payload.uyeler' 2>/dev/null || echo 0) Uper · $(du -sh $SB/volumes/storage | cut -f1) dosya"
echo "$OZET" > $IS/natro/SON_YEDEK.txt
SONUC=""

# --- 1) GitHub
gh_yedek() {
  export GIT_SSH_COMMAND="ssh -i $D/anahtar -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20"
  [ -d $REPO/.git ] || git clone -q --depth 1 git@github.com:updated-studio/yedek.git $REPO || return 1
  git -C $REPO fetch -q --depth 1 origin main && git -C $REPO reset -q --hard origin/main || return 1
  mkdir -p $REPO/natro/dosyalar
  cp $IS/natro/*.sql $IS/natro/*.tgz $IS/natro/SON_YEDEK.txt $REPO/natro/
  rsync -a --delete $SB/volumes/storage/ $REPO/natro/dosyalar/
  cp $D/sifre $REPO/natro/HOSTING_SIFRESI.txt
  cd $REPO && git add -A natro
  git diff --cached --quiet && { echo "değişiklik yok"; return 0; }
  git -c user.name="natro-yedek" -c user.email="yedek@updated.com.tr" commit -q -m "Natro yedeği $(date '+%d.%m.%Y %H:%M')" && git push -q origin HEAD:main
}
if [ -f $D/anahtar ]; then
  if out=$(gh_yedek 2>&1); then SONUC="GitHub tamam${out:+ ($out)}"; else SONUC="GitHub HATA: $(echo "$out" | tail -1 | cut -c1-120)"; fi
else SONUC="GitHub: anahtar yok"; fi

# --- 2) Natro hosting (FTP, şifreli)
host_yedek() {
  [ -f $D/ftp.env ] || { echo "FTP bilgisi yok"; return 1; }
  . $D/ftp.env
  local gun; gun=$(LC_ALL=C date +%a | tr 'A-Z' 'a-z')
  local paket=$IS/updated-$gun
  mkdir -p $paket
  tar -C $IS -czf - natro kod gizli | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass file:$D/sifre -out $paket/veritabani.tar.gz.enc
  # Dosyalar: yalnız değiştiyse (liste özeti)
  local ozet; ozet=$(cd $SB/volumes/storage && find . -type f -printf '%P %s %T@\n' | sort | sha1sum | cut -c1-16)
  if [ "$ozet" != "$(cat $D/dosya-ozeti 2>/dev/null)" ]; then
    tar -C $SB/volumes -czf - storage | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass file:$D/sifre -out $paket/dosyalar.tar.gz.enc
  fi
  printf 'Require all denied\nDeny from all\n' > $IS/htaccess
  echo "$OZET" > $paket/BILGI.txt
  local ssl='set ftp:ssl-allow yes; set ftp:ssl-force yes; set ftp:ssl-protect-data yes; set ssl:verify-certificate no;'
  lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" -e "$ssl set net:max-retries 3; set net:timeout 60; set ftp:passive-mode yes;
    mkdir -f -p $FTP_DIR; cd $FTP_DIR; put $IS/htaccess -o .htaccess; mkdir -f -p $gun; cd $gun;
    mput $paket/*; bye" >/dev/null 2>&1 || return 1
  # Doğrulama: hostingdeki dosyalar ve klasörün web'e kapalı olduğu (klasör adı kayda yazılmaz)
  local liste; liste=$(lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" -e "$ssl set net:timeout 30; cd $FTP_DIR/$gun; cls -s --block-size=1048576; bye" 2>/dev/null | tr -s ' \n' ' ')
  local web; web=$(curl -s -o /dev/null -w '%{http_code}' "https://updated.com.tr/$FTP_DIR/$gun/BILGI.txt")
  echo "hostingde: $liste· web erişimi: $web"
  echo "$ozet" > $D/dosya-ozeti
  echo "$gun klasörü"
}
if out=$(host_yedek 2>&1); then SONUC="$SONUC · hosting tamam ($out)"; else SONUC="$SONUC · hosting HATA: $(echo "$out" | tail -1 | cut -c1-120)"; fi

rm -rf $IS
log "$OZET · $(echo "$SONUC" | tr "\n" " ")"
case "$SONUC" in *HATA*|*"anahtar yok"*) exit 1;; esac
