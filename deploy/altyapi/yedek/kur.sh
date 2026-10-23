#!/usr/bin/env bash
# Natro gece yedeğini kurar (her gece 03:15 Türkiye): betik, GitHub yazma anahtarı (yalnız updated-studio/yedek deposuna),
# hosting şifreleme parolası ve FTP bilgileri. Hepsi sunucuda üretilir/saklanır (600). FTP bilgileri stdin'den gelir (FTP_HOST/USER/PASS).
# Kullanım: ... | sudo bash kur.sh [calistir]
set -euo pipefail
D=/opt/updated/yedek
HERE="$(cd "$(dirname "$0")" && pwd)"
# stdin (FTP bilgileri) önce okunur: paket kurulumu stdin'i tüketmesin
girdi=""; [ -t 0 ] || girdi=$(cat)
for p in rsync lftp; do command -v $p >/dev/null || { apt-get update -qq >/dev/null; apt-get install -y -qq $p >/dev/null 2>&1 </dev/null; }; done
mkdir -p $D && chmod 700 $D
install -m 700 "$HERE/yedekle.sh" $D/yedekle.sh
[ -f $D/anahtar ] || ssh-keygen -q -t ed25519 -N '' -C "natro-yedek@updated" -f $D/anahtar
[ -f $D/sifre ] || openssl rand -base64 36 | tr -d '\n' > $D/sifre
# FTP bilgileri (stdin'den, KEY=deger satırları); klasör adı bir kez rastgele üretilir
if [ -n "$girdi" ]; then
    eski_dir=$( [ -f $D/ftp.env ] && sed -n 's/^FTP_DIR=//p' $D/ftp.env || true )
    { echo "$girdi" | grep -E '^FTP_(HOST|USER|PASS)='; echo "FTP_DIR=${eski_dir:-.yedek-$(openssl rand -hex 8)}"; } > $D/ftp.env.yeni
    mv $D/ftp.env.yeni $D/ftp.env
fi
chmod 600 $D/anahtar $D/sifre $D/ftp.env 2>/dev/null || true
echo "15 0 * * * root bash $D/yedekle.sh >/dev/null 2>&1" > /etc/cron.d/updated-yedek
chmod 644 /etc/cron.d/updated-yedek
echo "YEDEK_ACIK_ANAHTAR=$(cat $D/anahtar.pub)"
echo "FTP bilgisi: $( [ -s $D/ftp.env ] && echo var || echo YOK) · zamanlama: her gece 03:15"
echo "hosting'e bağlantı: $(timeout 15 bash -c "</dev/tcp/$(sed -n 's/^FTP_HOST=//p' $D/ftp.env 2>/dev/null)/21" 2>/dev/null && echo açık || echo KAPALI)"
if [ "${1:-}" = "calistir" ]; then
  bash $D/yedekle.sh >/dev/null 2>&1 || true; echo "son kayıtlar:"; tail -4 $D/yedek.log | cut -c1-300
fi
