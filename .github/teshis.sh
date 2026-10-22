#!/usr/bin/env bash
# Yükleme sonrası teşhis: sitenin gerçekten açıldığını dışarıdan dener, sonucu GitHub notu olarak yazar.
u="${SITE_URL%/}"; out=""
for p in / /robots.txt /mobil /haberler /marka/og-varsayilan.jpg /index.html; do
  for base in "$u" "${u/https:/http:}"; do
    r=$(curl -sk -o /tmp/b -D /tmp/h -w '%{http_code} %{redirect_url}' --max-time 20 "$base$p" 2>&1)
    srv=$(grep -i '^server:' /tmp/h | head -1 | tr -d '\r')
    out+="$base$p → $r · $srv · $(head -c 120 /tmp/b | tr -d '\n\r' | sed 's/%/%25/g')%0A"
  done
done
opts=(-sS --list-only --max-time 30 --user "$NATRO_FTP_USER:$NATRO_FTP_PASSWORD" -k)
[ "${NATRO_FTP_PROTOCOL:-ftps}" != "ftp" ] && opts+=(--ssl-reqd)
d="${NATRO_DIR#./}"; d="${d%/}"
root=$(curl "${opts[@]}" "ftp://$NATRO_FTP_HOST/" 2>&1 | head -40 | tr '\n' ' ')
tgt=$(curl "${opts[@]}" "ftp://$NATRO_FTP_HOST/${d:+$d/}" 2>&1 | head -40 | tr '\n' ' ')
pwd=$(curl "${opts[@]}" -Q PWD "ftp://$NATRO_FTP_HOST/" 2>&1 | head -3 | tr '\n' ' ')
h=$(echo "$u" | sed -E 's#https?://##; s#/.*##'); dns="$h → $(getent ahostsv4 "$h" | awk '{print $1}' | sort -u | tr '\n' ' ') · ana: $(getent ahostsv4 "${h#*.}" | awk '{print $1}' | sort -u | tr '\n' ' ')"
echo "::notice title=Teşhis · DNS::${dns}"
# FTP klasörü sunucuda nereye düşüyor? Bizim robots.txt'yi ("Disallow: /") ana alan adının altındaki olası yollarda ara.
ana="${h#*.}"; yer=""
for p in "" /v2 /v2.updated.com.tr /public_html/v2 /subdomains/v2 /v2/public_html; do
  for b in "https://$ana" "http://$ana" "http://$h"; do
    c=$(curl -sk --max-time 15 -o /tmp/r -w '%{http_code}' "$b$p/robots.txt"); grep -q '^Disallow: /$' /tmp/r 2>/dev/null && yer+="BULUNDU: $b$p/robots.txt ($c)%0A"
  done
done
anac=$(curl -sk --max-time 15 -o /dev/null -w '%{http_code}' "https://$ana/")
echo "::notice title=Teşhis · Konum::ana site https://$ana → $anac%0A${yer:-bizim dosyalar hiçbir denenen adreste görünmüyor}"
echo "::notice title=Teşhis · HTTP::${out}"
echo "::notice title=Teşhis · FTP::kök: ${root}%0Ahedef (${d:-.}): ${tgt}"
