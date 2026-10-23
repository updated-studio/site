#!/usr/bin/env bash
# Stüdyo'yu sunucuda yayınlar (GitHub Pages ve bulut fonksiyon yayını yerine).
# Zamanlayıcı (updated-studyo.timer) 2 dakikada bir çalıştırır: Stüdyo deposunun main dalı değiştiyse
# ekranı derler, /var/www/studio/aktif'e alır; değişen fonksiyonları Natro'daki Supabase'e yükler.
# Derleme hata verirse yayındaki sürüm olduğu gibi kalır.
# Elle: sudo bash yayinla.sh            (değişiklik yoksa bir şey yapmaz)
#       sudo bash yayinla.sh --zorla    (değişiklik olmasa da yeniden derler)
set -euo pipefail
REPO=https://github.com/updated-studio/studio.git
EV=/var/lib/updated-studyo           # studyo kullanıcısının evi: kaynak + npm önbelleği
K=$EV/kaynak
W=/var/www/studio
F=/opt/updated/supabase/volumes/functions
exec 9>/run/updated-studyo.lock; flock -n 9 || { echo "başka bir yayın sürüyor"; exit 0; }
u() { runuser -u studyo -- env HOME=$EV "$@"; }

[ -d "$K/.git" ] || u git clone -q "$REPO" "$K"
u git -C "$K" fetch -q origin main
yeni=$(u git -C "$K" rev-parse origin/main)
eski=$(cat "$EV/son" 2>/dev/null || echo yok)
if [ "$yeni" = "$eski" ] && [ "${1:-}" != "--zorla" ]; then exit 0; fi
u git -C "$K" reset -q --hard "$yeni"
kisa=${yeni:0:7}
echo "Stüdyo $kisa: $(u git -C "$K" log -1 --format=%s)"

# 1) Fonksiyonlar: yalnız depoda olan ve farklı olanlar yüklenir (sunucunun kendi main/hello fonksiyonlarına dokunulmaz)
degisti=""
for d in "$K"/supabase/functions/*/; do
  n=$(basename "$d"); [ -f "$d/index.ts" ] || continue
  diff -rq "$d" "$F/$n" >/dev/null 2>&1 && continue
  rm -rf "$F/$n.yeni"; cp -a "$d" "$F/$n.yeni"; chown -R root:root "$F/$n.yeni"
  rm -rf "$F/$n"; mv "$F/$n.yeni" "$F/$n"; degisti="$degisti $n"
done
if [ -n "$degisti" ]; then
  (cd /opt/updated/supabase && docker compose restart functions >/dev/null 2>&1)
  for i in $(seq 1 30); do [ "$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS http://127.0.0.1:8000/functions/v1/triyaj-taslak)" = 200 ] && break; sleep 3; done
  echo "fonksiyonlar yüklendi:$degisti (deneme: $(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS http://127.0.0.1:8000/functions/v1/triyaj-taslak))"
fi

# 2) Ekran: paketler yalnız package-lock değişince kurulur; derleme bellek sınırıyla
cd "$K"
kilit=$(sha1sum package-lock.json | cut -c1-40)
if [ "$kilit" != "$(cat "$EV/kilit" 2>/dev/null)" ] || [ ! -d node_modules ]; then
  u npm ci --no-audit --no-fund --loglevel=error
  echo "$kilit" > "$EV/kilit"
fi
rm -rf dist
u env NODE_OPTIONS=--max-old-space-size=1536 npm run build --silent >"$EV/derleme.log" 2>&1 || { tail -40 "$EV/derleme.log"; echo "DERLEME HATASI: yayındaki sürüm değişmedi"; exit 1; }
[ -f dist/index.html ] || { echo "dist/index.html yok: yayındaki sürüm değişmedi"; exit 1; }

# 3) Yeni sürüm klasörü + tek hamlede geçiş (aktif bağlantısı); son 5 sürüm saklanır (geri dönüş: ln -sfn)
hedef="$W/surumler/$(date +%Y%m%d-%H%M%S)-$kisa"
mkdir -p "$W/surumler"; cp -a dist "$hedef"; chown -R root:root "$hedef"; chmod -R a+rX "$hedef"
ln -sfn "$hedef" "$W/aktif.yeni"; mv -T "$W/aktif.yeni" "$W/aktif"
ls -1dt "$W"/surumler/*/ | tail -n +6 | xargs -r rm -rf
echo "$yeni" > "$EV/son"
echo "yayında: $hedef ($(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8090/))"
