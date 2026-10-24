#!/usr/bin/env bash
# Okur girişinin dış anahtarlarını girer: Google ile giriş ve Cloudflare "robot değilim" doğrulaması.
# Anahtarı oluşturan kişi kendisi yazar; yazılan ekranda görünmez, sohbete ve depoya girmez.
# Kullanım: sudo updated-uye-ayar google      (Google istemci kimliği + gizli anahtar)
#           sudo updated-uye-ayar cloudflare  (Turnstile site anahtarı + gizli anahtar)
#           sudo updated-uye-ayar durum
#           updated-uye-ayar uygula       (kendiliğinden: Stüdyo → Site → Topluluk → Üyelik girişi ayarları formu
#                                          /var/spool/updated-uye/*.json bırakır, updated-uye-ayar.path bunu çalıştırır)
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "sudo ile çalıştır: sudo updated-uye-ayar $*"; exit 1; }
DIS=/opt/updated/supabase/uye-dis.env
umask 077; touch $DIS; chmod 600 $DIS
yaz() { local v; v=$(printf '%s' "$2" | tr -d '\r\n '); if grep -q "^$1=" $DIS; then sed -i "s|^$1=.*|$1=$v|" $DIS; else echo "$1=$v" >> $DIS; fi; }
var() { grep -q "^$1=." $DIS && echo "girildi" || echo "yok"; }
case "${1:-durum}" in
  google)
    read -r -p "Google istemci kimliği (…apps.googleusercontent.com): " a
    read -r -s -p "Google istemci gizli anahtarı (görünmez): " b; echo
    [ -n "$a" ] && [ -n "$b" ] || { echo "İkisi de gerekli; değişiklik yapılmadı."; exit 1; }
    yaz GOOGLE_ID "$a"; yaz GOOGLE_SECRET "$b" ;;
  cloudflare)
    read -r -p "Turnstile site anahtarı (Site Key): " a
    read -r -s -p "Turnstile gizli anahtarı (Secret Key, görünmez): " b; echo
    [ -n "$a" ] && [ -n "$b" ] || { echo "İkisi de gerekli; değişiklik yapılmadı."; exit 1; }
    yaz TURNSTILE_SITE "$a"; yaz TURNSTILE_SECRET "$b" ;;
  uygula)
    shopt -s nullglob; n=0
    for f in /var/spool/updated-uye/*.json; do
      al() { jq -r --arg k "$1" '.[$k] // empty' "$f" 2>/dev/null; }
      gi=$(al GOOGLE_ID); gs=$(al GOOGLE_SECRET); ts=$(al TURNSTILE_SITE); tg=$(al TURNSTILE_SECRET)
      if [[ "$gi" =~ ^[0-9]{6,}-[a-z0-9]{10,}\.apps\.googleusercontent\.com$ && "$gs" =~ ^[A-Za-z0-9_-]{10,200}$ ]]; then yaz GOOGLE_ID "$gi"; yaz GOOGLE_SECRET "$gs"; n=$((n+1)); fi
      if [[ "$ts" =~ ^0x[A-Za-z0-9_-]{10,200}$ && "$tg" =~ ^0x[A-Za-z0-9_-]{10,200}$ ]]; then yaz TURNSTILE_SITE "$ts"; yaz TURNSTILE_SECRET "$tg"; n=$((n+1)); fi
      rm -f "$f"
    done
    [ "$n" -gt 0 ] || { echo "işlenecek geçerli anahtar yok"; exit 0; } ;;
  durum)
    echo "Google: $(var GOOGLE_SECRET) · Cloudflare: $(var TURNSTILE_SECRET)"; exit 0 ;;
  *) echo "Kullanım: sudo updated-uye-ayar google | cloudflare | durum"; exit 1 ;;
esac
bash /opt/updated/site/deploy/altyapi/uye/kur.sh   # panelin kopyası her zaman main
systemctl restart updated-panel
echo "Tamam. Panel yeniden başladı; sitede bir dakika içinde görünür."
