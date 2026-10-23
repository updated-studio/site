#!/usr/bin/env bash
# Paneli sunucuda kendiliğinden günceller (eski GitHub Actions "panel" iş akışı yerine; GitHub sunucuya bağlanmaz).
# updated-panel-guncelle.timer 2 dakikada bir main'e bakar:
#   deploy/panel/** değiştiyse      → kur.sh (Caddy, systemd birimi; tekrar çalıştırmak zararsız)
#   apps/cms, packages değiştiyse   → guncelle.sh (indir, kur, panel veritabanı göçleri, derle, yeniden başlat)
#   yalnız başka dosyalar           → panelin kopyası main'e alınır, panel yeniden başlamaz
# Ortam dosyaları (/etc/updated-panel.env, .secrets, .yerel) artık yalnız sunucuda; GitHub'dan yazılmaz.
# Kurulum: sudo bash deploy/panel/otomatik.sh kur      · elle: sudo updated-panel-guncelle
set -euo pipefail
if [ "${1:-}" = kur ]; then
  install -m 755 "$0" /usr/local/bin/updated-panel-guncelle
  cat > /etc/systemd/system/updated-panel-guncelle.service <<UNIT
[Unit]
Description=Panel güncellemesi (main değiştiyse)
After=network-online.target
[Service]
Type=oneshot
ExecStart=/usr/local/bin/updated-panel-guncelle
TimeoutStartSec=40min
UNIT
  cat > /etc/systemd/system/updated-panel-guncelle.timer <<UNIT
[Unit]
Description=Panel kodu değişti mi, 2 dakikada bir
[Timer]
OnBootSec=4min
OnUnitInactiveSec=2min
[Install]
WantedBy=timers.target
UNIT
  systemctl daemon-reload; systemctl enable --now updated-panel-guncelle.timer >/dev/null 2>&1
  echo "Panel otomatik güncelleme kuruldu: $(systemctl is-active updated-panel-guncelle.timer)"; exit 0
fi

S=/opt/updated/site
g() { runuser -u panel -- git -C "$S" "$@"; }
# Ağır derlemeler (site, panel) aynı anda çalışmaz: bellek 3,8 GB
exec 9>/run/updated-agir.lock; flock 9
g fetch -q origin main
eski=$(g rev-parse HEAD); yeni=$(g rev-parse origin/main)
[ "$eski" = "$yeni" ] && exit 0
degisen=$(g diff --name-only "$eski" "$yeni" 2>/dev/null || echo HEPSI)
echo "Panel ${eski:0:7} → ${yeni:0:7}"
T=$(mktemp -d)
for f in kur.sh guncelle.sh; do g show "$yeni:deploy/panel/$f" > "$T/$f"; done
if grep -qE '^(deploy/panel/|HEPSI)' <<<"$degisen"; then
  PANEL_DOMAIN=panel.updated.com.tr bash "$T/kur.sh" 2>&1 | tail -3
fi
if grep -qE '^(apps/cms/|packages/|package\.json|package-lock\.json|deploy/panel/|HEPSI)' <<<"$degisen"; then
  bash "$T/guncelle.sh" 2>&1 | tail -15     # kendi içinde main'i çeker
else
  g reset -q --hard "$yeni"; echo "yalnız kopya güncellendi (panel yeniden başlamadı)"
fi
rm -rf "$T"
echo "panel: $(curl -s -o /dev/null -w '%{http_code}' -m 20 http://127.0.0.1:3001/admin)"
