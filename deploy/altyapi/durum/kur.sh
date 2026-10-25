#!/usr/bin/env bash
# Sistem durumu özetini kurar (bir kez; tekrar çalıştırmak zararsız). Ayrıntı: durum.sh.
# Kullanım: sudo bash deploy/altyapi/durum/kur.sh
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
install -m 755 "$HERE/durum.sh" /usr/local/bin/updated-durum
mkdir -p /var/lib/updated-durum; chmod 755 /var/lib/updated-durum
cat > /etc/systemd/system/updated-durum.service <<UNIT
[Unit]
Description=Sistem durumu özeti (Stüdyo → Sistem Durumu)
[Service]
Type=oneshot
ExecStart=/usr/local/bin/updated-durum
Nice=10
UNIT
cat > /etc/systemd/system/updated-durum.timer <<UNIT
[Unit]
Description=Sistem durumu özeti, 5 dakikada bir
[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now updated-durum.timer
/usr/local/bin/updated-durum && echo "durum.json yazıldı"
