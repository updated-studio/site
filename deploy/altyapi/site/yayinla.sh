#!/usr/bin/env bash
# Siteyi (updated.com.tr) sunucuda derler ve Natro hostinge yükler (eski GitHub Actions "Siteyi derle ve yayınla" yerine).
# Tetikler (deploy/altyapi/site/kur.sh kurar):
#   - panelde Yayınla: panel /var/spool/updated-site içine bir dosya bırakır → updated-site-yayin.path hemen başlatır
#   - site kodu main'de değişince: updated-site-yayin.timer 2 dakikada bir bakar
#   - her gece 04.00 (TR) güvenlik derlemesi: updated-site-gece.timer (--gece)
# Yayın sırasında gelen istekler biriktirilir, bu derleme bitince tek derlemede yayınlanır.
# Hata olursa yayındaki site olduğu gibi kalır; 10 dakika sonra kendiliğinden yeniden denenir.
# Elle: sudo updated-site-yayinla --zorla   ·  yüklemeden dene: sudo updated-site-yayinla --dene (derler, canlıyla karşılaştırır)
set -euo pipefail
REPO=https://github.com/updated-studio/site.git
EV=/var/lib/updated-site            # siteyayin kullanıcısının evi: kaynak, npm ve görsel önbelleği
K=$EV/kaynak
ISTEK=/var/spool/updated-site     # panel yazar (grup panel), bu betik okur ve siler
u() { runuser -u siteyayin -- env HOME=$EV "$@"; }
# Ağır derlemeler (site, panel) aynı anda çalışmaz: bellek 3,8 GB
exec 9>/run/updated-agir.lock; flock 9

[ -d "$K/.git" ] || u git clone -q "$REPO" "$K"
u git -C "$K" fetch -q origin main
yeni=$(u git -C "$K" rev-parse origin/main)
eski=$(cat "$EV/son" 2>/dev/null || echo yok)

neden=""
case "${1:-}" in --zorla) neden=elle;; --gece) neden=gece;; --dene) neden=deneme;; esac
compgen -G "$ISTEK/*" >/dev/null && neden="${neden:+$neden+}panel"
if [ "$yeni" != "$eski" ]; then
  if [ "$eski" = yok ] || ! u git -C "$K" diff --quiet "$eski" "$yeni" -- apps/web packages package.json package-lock.json deploy/canli.json deploy/natro-yukle.mjs deploy/natro-kontrol.sh deploy/altyapi/site 2>/dev/null; then
    neden="${neden:+$neden+}kod"
  fi
fi
[ -f "$EV/yeniden" ] && [ -n "$(find "$EV/yeniden" -mmin +10)" ] && neden="${neden:+$neden+}yeniden"
if [ -z "$neden" ]; then echo "$yeni" > "$EV/son"; exit 0; fi

# İstekler şimdi alınır: derleme sürerken gelenler bir sonraki tura kalır (denemede istekler beklemede kalır)
DENE=0; [ "${1:-}" = --dene ] && DENE=1
yollar=$(cat "$ISTEK"/* 2>/dev/null | jq -rs '[.[].paths[]?] | unique | join(",")' 2>/dev/null || true)
[ $DENE = 1 ] || rm -f "$ISTEK"/*
u git -C "$K" reset -q --hard "$yeni"
echo "Site ${yeni:0:7} derleniyor (neden: $neden)"
bas=$(date +%s)

# Canlı mod ayarları deploy/canli.json'dan (eski iş akışıyla aynı)
C="$K/deploy/canli.json"
[ "$(jq -r '.canli // false' "$C")" = true ] || { echo "canli.json: canli=false; sunucudan yalnız canlı site yayınlanır"; exit 1; }
export SITE_URL=https://updated.com.tr STAGING=0 CMS_URL=https://panel.updated.com.tr \
  MEDIA_PUBLIC_URL=https://panel.updated.com.tr/storage/v1/object/public/media \
  NATRO_DIR=./ NATRO_FTP_KILITLI=1 NATRO_ANA_SITE=evet NATRO_FTP_PROTOCOL=ftps NATRO_FTP_SECURITY=loose \
  YEDEK=$(jq -r 'if .yedek == false then 0 else 1 end' "$C") \
  WP_YANYANA=$(jq -r 'if .wordpress == false then 0 else 1 end' "$C") \
  PROVA=$(jq -r 'if .prova then 1 else 0 end' "$C")
# FTP ve isteğe bağlı ayarlar (INDEXNOW_KEY, PUBLIC_BULTEN_URL): /etc/updated-site.env (root, 600)
set -a; . /etc/updated-site.env; set +a

hata() { echo "YAYIN HATASI ($1): yayındaki site değişmedi; 10 dk sonra yeniden denenecek"; touch "$EV/yeniden"; exit 1; }
cd "$K"
kilit=$(cat package-lock.json apps/web/package.json 2>/dev/null | sha1sum | cut -c1-40)
if [ "$kilit" != "$(cat "$EV/kilit" 2>/dev/null)" ] || [ ! -d node_modules ]; then
  u npm install --workspace apps/web --no-audit --no-fund --legacy-peer-deps --loglevel=error >"$EV/kurulum.log" 2>&1 || { tail -30 "$EV/kurulum.log"; hata kurulum; }
  echo "$kilit" > "$EV/kilit"
fi
# Derleme FTP bilgilerini görmez (yalnız yükleme görür)
u env -u NATRO_FTP_PASSWORD -u NATRO_FTP_USER NODE_OPTIONS=--max-old-space-size=2048 npm run build --workspace apps/web >"$EV/derleme.log" 2>&1 || { tail -40 "$EV/derleme.log"; hata derleme; }
[ -f apps/web/dist/index.html ] || hata "dist/index.html yok"
if [ $DENE = 1 ]; then
  m=$(mktemp -d); chmod 755 "$m"
  lftp -u "$NATRO_FTP_USER,$NATRO_FTP_PASSWORD" "$NATRO_FTP_HOST" -e "set ftp:ssl-force yes; set ssl:verify-certificate no; get -O $m .yayin-manifest.json; bye" >/dev/null 2>&1
  node -e 'const fs=require("fs"),c=require("crypto"),p=require("path");const o=JSON.parse(fs.readFileSync(process.argv[1]));const d=process.argv[2];const w=x=>fs.readdirSync(x).flatMap(f=>{const q=p.join(x,f);return fs.statSync(q).isDirectory()?w(q):[q]});const n={};for(const f of w(d))n[p.relative(d,f)]=c.createHash("sha1").update(fs.readFileSync(f)).digest("hex");const k=Object.keys(n),deg=k.filter(x=>o[x]&&o[x]!==n[x]),yeni=k.filter(x=>!o[x]),sil=Object.keys(o).filter(x=>!n[x]);console.log(`DENEME: ${k.length} dosya · canlıyla aynı ${k.length-deg.length-yeni.length} · değişen ${deg.length} · yeni ${yeni.length} · kalkacak ${sil.length}`);for(const [a,l] of [["değişen",deg],["yeni",yeni],["kalkacak",sil]])if(l.length)console.log(`  ${a}: ${l.slice(0,12).join(" ")}${l.length>12?" …":""}`)' "$m/.yayin-manifest.json" apps/web/dist
  rm -rf "$m"; echo "deneme bitti: hiçbir şey yüklenmedi"; exit 0
fi

bash deploy/natro-kontrol.sh >"$EV/kontrol.log" 2>&1 || { tail -10 "$EV/kontrol.log"; hata "güvenlik kontrolü"; }
ok=0
for deneme in 1 2 3; do
  if u node deploy/natro-yukle.mjs apps/web/dist >"$EV/yukleme.log" 2>&1; then ok=1; break; fi
  echo "yükleme denemesi $deneme başarısız"; sleep 10
done
[ $ok = 1 ] || { tail -30 "$EV/yukleme.log"; hata yükleme; }
tail -3 "$EV/yukleme.log"

if [ -n "${INDEXNOW_KEY:-}" ] && [ "$PROVA" != 1 ]; then CHANGED_PATHS="$yollar" u node apps/web/scripts/indexnow.mjs || true; fi
rm -f "$EV/yeniden"; echo "$yeni" > "$EV/son"
echo "YAYINDA: ${yeni:0:7} · $(( $(date +%s) - bas )) sn · $(curl -s -o /dev/null -w '%{http_code}' -m 20 https://updated.com.tr/)"
