#!/usr/bin/env bash
# Panel sunucusunda "panel" kullanıcısıyla çalışır: ortamı yükler, WordPress taşıma betiğini çalıştırır, geçici ayar dosyasını siler.
set -a; . /etc/updated-panel.env; . /etc/updated-panel.secrets; . /opt/updated/wp.env; set +a
trap 'rm -f /opt/updated/wp.env' EXIT
# Taşıma betiğinin en son hâli (panel kurulumunu beklemeden)
git -C /opt/updated/site fetch -q --depth 1 origin main && git -C /opt/updated/site reset -q --hard origin/main
cd /opt/updated/site/apps/cms
echo "Başlıyor: $WP_URL · deneme=${DRY_RUN:-0} · sınır=${LIMIT:-yok}"
export NODE_ENV=production
rm -f scripts/wp-migrate.log.json
if [ "${ONAR:-0}" = "1" ]; then timeout 2h npx tsx --tsconfig tsconfig.json scripts/medya-onar.ts 2>&1; k=$?; else timeout 4h npx tsx --tsconfig tsconfig.json scripts/wp-migrate.ts 2>&1; k=$?; fi
echo "çıkış kodu: $k"
exit $k
