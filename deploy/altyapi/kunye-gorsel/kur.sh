#!/usr/bin/env bash
# Künye görsel işçisini kurar (bir kez; tekrar çalıştırmak zararsız). Ayrıntı: isci.mjs, isle.py.
# Kullanım: sudo bash deploy/altyapi/kunye-gorsel/kur.sh
# rembg (MIT lisanslı arka plan silme, isnet-general-use modeli) Docker kabında, ağsız çalışır; model ilk turda bir kez indirilir.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
install -d -m 755 /opt/updated-kunye-gorsel /var/lib/updated-kunye /var/lib/updated-kunye/model
install -m 644 "$HERE/isci.mjs" "$HERE/isle.py" /opt/updated-kunye-gorsel/
docker image inspect danielgatis/rembg:2.0.84 >/dev/null 2>&1 || docker pull danielgatis/rembg:2.0.84
# Model indirme (kap ağsız çalıştığı için önceden)
[ -f /var/lib/updated-kunye/model/models/isnet-general-use/isnet-general-use.onnx ] || [ -f /var/lib/updated-kunye/model/isnet-general-use.onnx ] || \
  docker run --rm -e U2NET_HOME=/model -v /var/lib/updated-kunye/model:/model --entrypoint python danielgatis/rembg:2.0.84 -c "from rembg import new_session; new_session('isnet-general-use')"
cat > /etc/systemd/system/updated-kunye-gorsel.service <<UNIT
[Unit]
Description=Künye görselleri: arka plan silme ve standart tuval (Stüdyo → Künye onayı)
After=docker.service
[Service]
Type=oneshot
# Ağır işler (site ve panel derlemesi) aynı kilidi kullanır: 3,8 GB bellekte ikisi aynı anda çalışmaz, sırayla bekler
ExecStart=/usr/bin/flock /run/updated-agir.lock /usr/bin/node /opt/updated-kunye-gorsel/isci.mjs
Nice=15
TimeoutStartSec=45min
UNIT
cat > /etc/systemd/system/updated-kunye-gorsel.timer <<UNIT
[Unit]
Description=Künye görselleri, 15 dakikada bir
[Timer]
OnBootSec=5min
OnUnitActiveSec=15min
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now updated-kunye-gorsel.timer
echo "Kuruldu. Kayıt: journalctl -u updated-kunye-gorsel"
