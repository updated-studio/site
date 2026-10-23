#!/usr/bin/env bash
# Natro VPS: takas alanı + Docker + Supabase'in açık kaynak sürümü (yalın). Tekrar çalıştırılabilir; var olan veriyi ve anahtarları bozmaz.
# Kullanım: sudo PANEL_DOMAIN=panel.updated.com.tr STUDIO_URL=https://studio.updated.com.tr bash kur.sh
# Gizli değerler sunucuda üretilir ve /opt/updated/supabase/.env (600) içinde kalır; hiçbiri ekrana yazılmaz.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
DOMAIN="${PANEL_DOMAIN:-panel.updated.com.tr}"
STUDIO_URL="${STUDIO_URL:-https://studio.updated.com.tr}"
DIR=/opt/updated/supabase
# Resmî kurulum dosyalarının sabitlenmiş sürümü (güncelleme bilerek yapılır)
SB_REF=2ddb9a9894c93f5d76e00c0554a2f43e96e6660e
HERE="$(cd "$(dirname "$0")" && pwd)"

# 1) Takas alanı: 4 GB (bellek dolunca servis düşmesin; swappiness düşük, yalnız sıkışınca kullanılır)
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
  chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
sysctl -q -w vm.swappiness=10; echo 'vm.swappiness=10' > /etc/sysctl.d/90-updated.conf

# 2) Docker (resmî depo; compose eklentisi dahil)
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  apt-get update -qq >/dev/null
  apt-get install -y -qq ca-certificates curl gnupg jq openssl git >/dev/null
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq >/dev/null
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null
fi
# Docker kayıtları diski doldurmasın
mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ]; then
  echo '{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }' > /etc/docker/daemon.json
  systemctl restart docker
fi
systemctl enable --now docker >/dev/null 2>&1

# 3) Resmî kurulum dosyaları (yalnız ilk kez; .env ve volumes/ korunur)
if [ ! -f "$DIR/docker-compose.yml" ]; then
  tmp=$(mktemp -d)
  git -C "$tmp" init -q && git -C "$tmp" remote add origin https://github.com/supabase/supabase.git
  git -C "$tmp" sparse-checkout set docker >/dev/null 2>&1 || true
  git -C "$tmp" -c protocol.version=2 fetch -q --depth 1 --filter=blob:none origin "$SB_REF"
  git -C "$tmp" checkout -q FETCH_HEAD
  mkdir -p "$DIR" && cp -a "$tmp/docker/." "$DIR/" && rm -rf "$tmp"
  echo "$SB_REF" > "$DIR/.updated-surum"
fi
cp "$HERE/docker-compose.updated.yml" "$DIR/docker-compose.updated.yml"

# 4) .env: yalnız ilk kez üretilir (anahtarlar değişirse bütün istemciler bozulur)
cd "$DIR"
if [ ! -f .env ]; then
  umask 077
  cp .env.example .env
  sh utils/generate-keys.sh --update-env >/dev/null
fi
chmod 600 .env
ayarla() { if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else echo "$1=$2" >> .env; fi; }
ayarla COMPOSE_FILE "docker-compose.yml:docker-compose.updated.yml"
ayarla SUPABASE_PUBLIC_URL "https://$DOMAIN"
ayarla API_EXTERNAL_URL "https://$DOMAIN/auth/v1"
ayarla SITE_URL "$STUDIO_URL"
ayarla ADDITIONAL_REDIRECT_URLS "$STUDIO_URL/**,https://updated-studio.github.io/**"
ayarla DISABLE_SIGNUP "true"
ayarla ENABLE_PHONE_SIGNUP "false"
ayarla ENABLE_PHONE_AUTOCONFIRM "false"
ayarla ENABLE_ANONYMOUS_USERS "false"
ayarla FUNCTIONS_VERIFY_JWT "false"
ayarla STORAGE_TENANT_ID "updated"
ayarla REGION "local"

# 5) Yalnız kullanılan servisleri başlat
docker compose up -d --remove-orphans db auth rest realtime storage functions api-gw
for i in $(seq 1 60); do
  saglam=$(docker compose ps --format '{{.Service}} {{.Health}}' | awk '$2=="healthy"' | wc -l)
  [ "$saglam" -ge 6 ] && break; sleep 5
done
docker compose ps --format '{{.Service}}: {{.Status}}'
