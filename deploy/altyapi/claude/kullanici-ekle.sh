#!/usr/bin/env bash
# Sunucuya ikinci (ya da sonraki) bir Claude kullanıcısı ekler: kendi claude.ai hesabıyla giriş yapar, kendi "Natro sunucu (<ad>)" oturumu olur.
# Yetkiler 'updated' ile aynı (docker, /opt/updated, şifresiz sudo). Girişi o kişi yapar: ssh updated@... → sudo -iu <ad> claude-giris
# Kullanım: sudo bash kullanici-ekle.sh enes
set -euo pipefail
K="${1:?kullanıcı adı}"
id "$K" >/dev/null 2>&1 || useradd -m -s /bin/bash "$K"
usermod -aG docker "$K"
getent group updated >/dev/null && usermod -aG updated "$K" || true
echo "$K ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/91-claude-$K && chmod 440 /etc/sudoers.d/91-claude-$K
( crontab -u "$K" -l 2>/dev/null | grep -v claude-sunucu; echo "@reboot /usr/local/bin/claude-sunucu" ) | crontab -u "$K" -
echo "kullanıcı hazır: $K · giriş: ssh updated@panel.updated.com.tr → sudo -iu $K claude-giris"
