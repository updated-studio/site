#!/usr/bin/env bash
# Panel nöbeti (6 Kasım 2026): panel veritabanı bağlantısı koptuktan sonra asılı kalabiliyor (5 ve 6 Kasım kesintileri: süreç ayakta,
# istekler yanıtsız; elle yeniden başlatılana kadar site paneli, Stüdyo'nun site bölümleri ve site yayını duruyordu).
# 2 dakikada bir (updated-panel-nobet.timer) panelin yerel adresine sorar; art arda 2 denemede yanıt gelmezse paneli yeniden başlatır.
# Panel güncellenirken (updated-panel-guncelle çalışıyor) ya da son yeniden başlatmadan beri 10 dakika geçmediyse dokunmaz.
# Günlük: /var/lib/updated-panel-nobet/nobet.log (yalnız olaylar yazılır).
set -uo pipefail
D=/var/lib/updated-panel-nobet; mkdir -p "$D"
GUNLUK=$D/nobet.log; SAYAC=$D/hata; SON=$D/son-baslatma
yaz() { echo "$(date -u +%FT%TZ) $*" >> "$GUNLUK"; }

systemctl is-active --quiet updated-panel-guncelle.service && exit 0
[ "$(systemctl is-active updated-panel.service 2>/dev/null)" = "active" ] || exit 0   # durdurulmuş ya da başlıyor: systemd'nin işi
# Yeni başlayan panel ilk isteklere geç yanıt verir: son 3 dakikada başladıysa bekle
BAS=$(systemctl show updated-panel.service -p ActiveEnterTimestampMonotonic --value 2>/dev/null || echo 0)
SIMDI=$(awk '{print int($1*1000000)}' /proc/uptime)
[ $(( (SIMDI - BAS) / 1000000 )) -lt 180 ] && exit 0

KOD=$(curl -s -o /dev/null -m 20 -w '%{http_code}' 'http://127.0.0.1:3001/api/products?limit=1&depth=0' || true)
if [ "$KOD" = "200" ]; then rm -f "$SAYAC"; exit 0; fi

N=$(( $(cat "$SAYAC" 2>/dev/null || echo 0) + 1 )); echo "$N" > "$SAYAC"
[ "$N" -lt 2 ] && exit 0
if [ -f "$SON" ] && [ $(( $(date +%s) - $(stat -c %Y "$SON") )) -lt 600 ]; then yaz "yanıt yok (kod ${KOD:-yok}), son yeniden başlatma 10 dk içinde: beklendi"; exit 0; fi
yaz "panel $N denemedir yanıt vermiyor (kod ${KOD:-yok}): yeniden başlatılıyor"
touch "$SON"; rm -f "$SAYAC"
systemctl restart updated-panel.service && yaz "yeniden başlatıldı" || yaz "YENİDEN BAŞLATILAMADI"
