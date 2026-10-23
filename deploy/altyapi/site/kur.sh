#!/usr/bin/env bash
# Site yayınını sunucuya kurar (bir kez; tekrar çalıştırmak zararsız). Ayrıntı: yayinla.sh.
# FTP bilgisi /etc/updated-site.env'de; yoksa gece yedeğinin FTP bilgisinden (aynı hesap, public_html) üretilir.
# Kullanım: sudo bash deploy/altyapi/site/kur.sh
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
EV=/var/lib/updated-site
id siteyayin >/dev/null 2>&1 || useradd --system --home-dir $EV --create-home --shell /usr/sbin/nologin siteyayin
ISTEK=/var/spool/updated-site
mkdir -p $EV $ISTEK; chown siteyayin:siteyayin $EV; rm -rf $EV/istek
# İstek klasörü: panel yazar, yayın betiği (root) okur ve siler
chown root:panel $ISTEK; chmod 2770 $ISTEK
install -m 755 "$HERE/yayinla.sh" /usr/local/bin/updated-site-yayinla

if [ ! -f /etc/updated-site.env ]; then
  ( set -a; . /opt/updated/yedek/ftp.env; set +a; umask 077
    printf 'NATRO_FTP_HOST=%q\nNATRO_FTP_USER=%q\nNATRO_FTP_PASSWORD=%q\n' "$FTP_HOST" "$FTP_USER" "$FTP_PASS" > /etc/updated-site.env )
  echo "/etc/updated-site.env oluşturuldu (yedek FTP hesabından)"
fi
chmod 600 /etc/updated-site.env

birim() { cat > "/etc/systemd/system/$1"; }
birim updated-site-yayin.service <<UNIT
[Unit]
Description=Site yayını (derle + Natro'ya yükle)
After=network-online.target
[Service]
Type=oneshot
ExecStart=/usr/local/bin/updated-site-yayinla
Nice=5
MemoryMax=3G
TimeoutStartSec=30min
UNIT
birim updated-site-yayin.path <<UNIT
[Unit]
Description=Panelde Yayınla → site yayını
[Path]
DirectoryNotEmpty=$ISTEK
[Install]
WantedBy=paths.target
UNIT
birim updated-site-yayin.timer <<UNIT
[Unit]
Description=Site kodu değişti mi, 2 dakikada bir
[Timer]
OnBootSec=3min
OnUnitInactiveSec=2min
[Install]
WantedBy=timers.target
UNIT
birim updated-site-gece.service <<UNIT
[Unit]
Description=Site gece güvenlik derlemesi
[Service]
Type=oneshot
ExecStart=/usr/local/bin/updated-site-yayinla --gece
Nice=5
MemoryMax=3G
TimeoutStartSec=30min
UNIT
birim updated-site-gece.timer <<UNIT
[Unit]
Description=Site gece güvenlik derlemesi, 04.00 (TR)
[Timer]
OnCalendar=*-*-* 01:00:00 UTC
Persistent=true
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
[ "${1:-}" = --kapali ] && { echo "Kuruldu, tetikler kapalı (--kapali)"; exit 0; }
systemctl enable --now updated-site-yayin.path updated-site-yayin.timer updated-site-gece.timer >/dev/null 2>&1
echo "Site yayını kuruldu: $(systemctl is-active updated-site-yayin.path) / $(systemctl is-active updated-site-yayin.timer)"
