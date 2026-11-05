#!/usr/bin/env bash
# Panel nöbetini kurar (bir kez; tekrar çalıştırmak zararsız). Ayrıntı: nobet.sh.
# Kullanım: sudo bash deploy/altyapi/panel-nobet/kur.sh
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
install -m 755 "$HERE/nobet.sh" /usr/local/bin/updated-panel-nobet
mkdir -p /var/lib/updated-panel-nobet; chmod 755 /var/lib/updated-panel-nobet
cat > /etc/systemd/system/updated-panel-nobet.service <<UNIT
[Unit]
Description=Panel nöbeti (yanıt vermeyen paneli yeniden başlatır)
[Service]
Type=oneshot
ExecStart=/usr/local/bin/updated-panel-nobet
UNIT
cat > /etc/systemd/system/updated-panel-nobet.timer <<UNIT
[Unit]
Description=Panel nöbeti, 2 dakikada bir
[Timer]
OnBootSec=5min
OnUnitActiveSec=2min
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now updated-panel-nobet.timer
echo "panel nöbeti kuruldu"
