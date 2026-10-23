#!/usr/bin/env bash
# Panel sunucusunu hazırlar (Ubuntu 22.04/24.04, ARM veya x64). Tekrar çalıştırılabilir; var olanı bozmaz.
# Kurulanlar: Node 22, git, Caddy (https sertifikasını kendisi alır/yeniler), güvenlik duvarı (80/443), systemd hizmeti.
# Kullanım: sudo PANEL_DOMAIN=panel.updated.com.tr bash kur.sh
set -euo pipefail
# Sunucu adı çözülemiyor uyarısı (sudo) için: kendi adını hosts dosyasına ekle
grep -q "$(hostname)" /etc/hosts || echo "127.0.1.1 $(hostname)" >> /etc/hosts
DOMAIN="${PANEL_DOMAIN:-panel.updated.com.tr}"
APP=/opt/updated
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a

if ! command -v node >/dev/null || ! node -v | grep -q '^v22'; then
  apt-get update -qq >/dev/null
  apt-get install -y -qq ca-certificates curl gnupg git
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
command -v git >/dev/null || apt-get install -y -qq git

if ! command -v caddy >/dev/null; then
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq && apt-get install -y -qq caddy
fi

# Bazı imajlar (Oracle) 80/443'ü iptables ile kapalı getirir; ufw açıksa ona da izin verilir.
command -v ufw >/dev/null && ufw status | grep -q active && { ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443/tcp; } >/dev/null || true
for p in 80 443; do iptables -C INPUT -p tcp --dport $p -j ACCEPT 2>/dev/null || iptables -I INPUT -p tcp --dport $p -j ACCEPT; done
if command -v netfilter-persistent >/dev/null; then netfilter-persistent save >/dev/null 2>&1 || true; else apt-get install -y -qq iptables-persistent >/dev/null 2>&1 && netfilter-persistent save >/dev/null 2>&1 || true; fi

id panel >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/panel --shell /usr/sbin/nologin panel
mkdir -p "$APP" && chown panel:panel "$APP"

# Sunucuda üretilen ve burada kalan gizli değerler (bir kez üretilir).
S=/etc/updated-panel.secrets
if [ ! -f "$S" ]; then
  umask 077
  { echo "PAYLOAD_SECRET=$(openssl rand -hex 32)"; echo "PREVIEW_SECRET=$(openssl rand -hex 16)"; echo "STUDIO_IMPORT_KEY=$(openssl rand -hex 24)"; } > "$S"
fi
chmod 600 "$S"

cat > /etc/systemd/system/updated-panel.service <<UNIT
[Unit]
Description=UPDATED Panel (Payload)
After=network-online.target
Wants=network-online.target

[Service]
User=panel
WorkingDirectory=$APP/site/apps/cms
EnvironmentFile=/etc/updated-panel.env
EnvironmentFile=/etc/updated-panel.secrets
# Natro'daki Supabase'e geçişten sonra (deploy/altyapi/panel-tasi.sh): bulut ayarlarının önüne geçer
EnvironmentFile=-/etc/updated-panel.yerel
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
MemoryMax=6G

[Install]
WantedBy=multi-user.target
UNIT

cat > /etc/caddy/Caddyfile <<CADDY
$DOMAIN {
	encode zstd gzip
	request_body {
		max_size 50MB
	}
	# Supabase (kendi sunucumuzda, deploy/altyapi): Stüdyo ve panel görselleri bu yollardan
	@supabase path /rest/v1/* /auth/v1/* /storage/v1/* /realtime/v1/* /functions/v1/* /graphql/v1/*
	handle @supabase {
		reverse_proxy 127.0.0.1:8000
	}
	handle {
		reverse_proxy 127.0.0.1:3001
	}
}

# Diğer siteler (ör. Stüdyo: deploy/altyapi/studyo) kendi dosyalarında
import /etc/caddy/conf.d/*.caddy
CADDY
mkdir -p /etc/caddy/conf.d
systemctl daemon-reload
systemctl enable updated-panel >/dev/null 2>&1 || true
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
systemctl reload caddy 2>/dev/null || systemctl restart caddy || { journalctl -u caddy -n 30 --no-pager; exit 1; }
echo "Sunucu hazır: node $(node -v), caddy $(caddy version | cut -d' ' -f1)"
