#!/usr/bin/env bash
# Yüklemeden önce güvenlik kontrolü: ana siteye (WordPress) asla dokunulmaz.
# 1) NATRO_DIR zorunlu; kök klasörler (public_html, httpdocs, /) yalnız NATRO_ANA_SITE=evet ise kabul edilir.
# 2) Hedef klasör FTP ile listelenir; içinde WordPress dosyası varsa yükleme DURUR.
set -u
fail() { echo "::error title=Natro güvenlik kontrolü::$1"; exit 1; }
DIR="${NATRO_DIR:-}"
[ -n "$DIR" ] || fail "NATRO_DIR boş. Alt alan adının klasörünü yazın (ör. v2.updated.com.tr/ ya da FTP kullanıcısı o klasöre bağlıysa ./)."
if [ "${DIR%/}" = "." ] && [ "${NATRO_FTP_KILITLI:-}" != "1" ] && [ "${NATRO_ANA_SITE:-}" != "evet" ]; then
  fail "NATRO_DIR='./' yalnız FTP kullanıcısı v2 klasörüne kilitliyse kullanılır (NATRO_FTP_KILITLI=1)."
fi
case "${DIR%/}" in
  ""|"/"|"public_html"|"/public_html"|"httpdocs"|"/httpdocs"|"www"|"htdocs"|"./public_html")
    [ "${NATRO_ANA_SITE:-}" = "evet" ] || fail "NATRO_DIR='$DIR' ana site klasörü gibi görünüyor. Ana siteye geçiş günü NATRO_ANA_SITE=evet ile açılır." ;;
esac
proto="${NATRO_FTP_PROTOCOL:-ftps}"; opts=(-sS --list-only --max-time 60 --user "$NATRO_FTP_USER:$NATRO_FTP_PASSWORD")
[ "$proto" != "ftp" ] && opts+=(--ssl-reqd)
[ "${NATRO_FTP_SECURITY:-strict}" = "loose" ] && opts+=(-k)
path="${DIR#./}"; path="${path%/}"
url="ftp://$NATRO_FTP_HOST/${path:+$path/}"
list=$(curl "${opts[@]}" "$url" 2>&1) || fail "Klasör listelenemedi ($url): $list"
echo "Hedef klasör: $url"; echo "$list" | head -20
if echo "$list" | grep -qiE '^(wp-config\.php|wp-content|wp-admin|wp-includes|wp-login\.php|xmlrpc\.php)$'; then
  if [ "${NATRO_ANA_SITE:-}" = "evet" ] && [ "${WP_YANYANA:-}" = "1" ]; then
    echo "::notice title=Natro::Ana site klasörü (WordPress yan yana modu): WordPress dosyalarına dokunulmaz; çakışan dosyalar önce .wp-yedek adıyla saklanır, yalnız bizim yüklediklerimiz silinebilir."
    exit 0
  fi
  # WordPress kapalı mod (deploy/canli.json "wordpress": false): dosyaları klasörde durur ama çalışmaz; yükleme yine onlara dokunmaz
  if [ "${NATRO_ANA_SITE:-}" = "evet" ] && [ "${WP_YANYANA:-}" = "0" ]; then
    echo "::notice title=Natro::Ana site klasörü (WordPress kapalı): WordPress dosyaları duruyor ama çalışmıyor; yükleme onlara dokunmaz, yalnız bizim yüklediklerimiz silinebilir."
    exit 0
  fi
  fail "Hedef klasörde WordPress dosyaları var ($url). Bu ana site olabilir; yükleme durduruldu."
fi
echo "Kontrol tamam: klasörde WordPress yok."
