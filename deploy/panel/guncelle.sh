#!/usr/bin/env bash
# Paneli GitHub'daki son koda günceller: indir → kur → veritabanı göçleri → derle → yeniden başlat.
# Kullanım: sudo bash guncelle.sh  (ortam dosyası /etc/updated-panel.env workflow tarafından yazılır)
set -euo pipefail
APP=/opt/updated
REPO="${PANEL_REPO:-https://github.com/updated-studio/site.git}"
run() { sudo -u panel -H bash -c "set -a; . /etc/updated-panel.env; . /etc/updated-panel.secrets; [ -f /etc/updated-panel.yerel ] && . /etc/updated-panel.yerel; set +a; cd $APP/site && $1"; }
chown root:panel /etc/updated-panel.secrets && chmod 640 /etc/updated-panel.secrets
chgrp panel /etc/updated-panel.env && chmod 640 /etc/updated-panel.env

if [ ! -d "$APP/site/.git" ]; then sudo -u panel git clone --depth 1 "$REPO" "$APP/site"; fi
sudo -u panel git -C "$APP/site" fetch --depth 1 origin main
sudo -u panel git -C "$APP/site" reset --hard origin/main

run "npm install --workspace apps/cms --include=dev --no-audit --no-fund --legacy-peer-deps"
run "cd apps/cms && npx payload generate:importmap"
# İlk kurulumda göç dosyası yoksa şemadan üretilir (workflow bunu depoya geri yazar).
if ! ls "$APP/site/apps/cms/src/migrations/"*.ts >/dev/null 2>&1; then run "cd apps/cms && npx payload migrate:create ilk-kurulum"; fi
run "cd apps/cms && npx payload migrate"
run "cd apps/cms && NODE_OPTIONS=--max-old-space-size=4096 npx next build"
systemctl restart updated-panel
for i in $(seq 1 30); do curl -sf -o /dev/null http://127.0.0.1:3001/admin && { echo "Panel çalışıyor"; exit 0; }; sleep 3; done
journalctl -u updated-panel -n 60 --no-pager; exit 1
