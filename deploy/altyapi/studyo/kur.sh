#!/usr/bin/env bash
# Stüdyo ekranını Natro sunucusunda yayına hazırlar (bir kez; tekrar çalıştırmak zararsız).
# studio.updated.com.tr → Caddy → /var/www/studio/aktif. Derleme/yükleme: yayinla.sh (zamanlayıcı, 2 dk).
# Kullanım: sudo bash deploy/altyapi/studyo/kur.sh
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
EV=/var/lib/updated-studyo
id studyo >/dev/null 2>&1 || useradd --system --home-dir $EV --create-home --shell /usr/sbin/nologin studyo
mkdir -p $EV /var/www/studio /etc/caddy/conf.d; chown studyo:studyo $EV
install -m 755 "$HERE/yayinla.sh" /usr/local/bin/updated-studyo-yayinla
install -m 755 "$HERE/goc.sh" /usr/local/bin/updated-studyo-goc

# Caddy: ana dosya (deploy/panel/kur.sh üretir) conf.d'yi içe alır; Stüdyo kendi dosyasında
grep -q 'import /etc/caddy/conf.d/\*' /etc/caddy/Caddyfile || printf '\nimport /etc/caddy/conf.d/*.caddy\n' >> /etc/caddy/Caddyfile
install -m 644 "$HERE/studyo.caddy" /etc/caddy/conf.d/studyo.caddy

cat > /etc/systemd/system/updated-studyo.service <<UNIT
[Unit]
Description=Stüdyo yayını (main değiştiyse derle + yayınla)
After=network-online.target docker.service
[Service]
Type=oneshot
ExecStart=/usr/local/bin/updated-studyo-yayinla
Nice=10
MemoryMax=2G
TimeoutStartSec=15min
UNIT
cat > /etc/systemd/system/updated-studyo.timer <<UNIT
[Unit]
Description=Stüdyo yayını, 2 dakikada bir
[Timer]
OnBootSec=2min
OnUnitInactiveSec=2min
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload

# İlk derleme, Caddy yalnız derleme başarılıysa yeniden yüklenir
/usr/local/bin/updated-studyo-yayinla --zorla
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
systemctl reload caddy
systemctl enable --now updated-studyo.timer >/dev/null 2>&1
echo "Stüdyo hazır: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8090/) (yerel deneme ucu)"
