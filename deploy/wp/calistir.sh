#!/usr/bin/env bash
# Panel sunucusunda "panel" kullanıcısıyla çalışır: ortamı yükler, WordPress taşıma betiğini çalıştırır, geçici ayar dosyasını siler.
set -a; . /etc/updated-panel.env; . /etc/updated-panel.secrets; . /opt/updated/wp.env; set +a
trap 'rm -f /opt/updated/wp.env' EXIT
cd /opt/updated/site/apps/cms
echo "Başlıyor: $WP_URL · deneme=${DRY_RUN:-0} · sınır=${LIMIT:-yok}"
timeout 4h npx payload run scripts/wp-migrate.ts 2>&1; k=$?
echo "payload run çıkış kodu: $k"
if [ ! -f scripts/wp-migrate.log.json ] || [ scripts/wp-migrate.log.json -ot /opt/updated/wp-calistir.sh ]; then
  echo "payload run özet üretmedi; tsx ile doğrudan deneniyor"
  timeout 4h npx tsx --tsconfig tsconfig.json scripts/wp-migrate.ts 2>&1; k=$?
  echo "tsx çıkış kodu: $k"
fi
exit $k
