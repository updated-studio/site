#!/usr/bin/env bash
# Natro gece yedeğini kurar: betik, GitHub'a yazma anahtarı (yalnız updated-studio/yedek deposuna, "deploy key"), her gece 03:15 (TR).
# Anahtar sunucuda üretilir; özel kısmı sunucudan çıkmaz, açık kısmı (herkese gösterilebilir) ekrana yazılır ve depoya eklenir.
# Kullanım: sudo bash kur.sh [calistir]
set -euo pipefail
D=/opt/updated/yedek
HERE="$(cd "$(dirname "$0")" && pwd)"
command -v rsync >/dev/null || { apt-get update -qq >/dev/null; apt-get install -y -qq rsync >/dev/null; }
mkdir -p $D && chmod 700 $D
install -m 700 "$HERE/yedekle.sh" $D/yedekle.sh
[ -f $D/anahtar ] || ssh-keygen -q -t ed25519 -N '' -C "natro-yedek@updated" -f $D/anahtar
chmod 600 $D/anahtar
# Türkiye yıl boyu UTC+3: 00:15 UTC = 03:15
echo "15 0 * * * root bash $D/yedekle.sh >> $D/yedek.log 2>&1" > /etc/cron.d/updated-yedek
chmod 644 /etc/cron.d/updated-yedek
echo "YEDEK_ACIK_ANAHTAR=$(cat $D/anahtar.pub)"
if [ "${1:-}" = "calistir" ]; then
  bash $D/yedekle.sh 2>&1 | grep -vE "^(remote:|To |Warning)" | cut -c1-200 | tail -6; echo "son: $(tail -1 $D/yedek.log)"
fi
