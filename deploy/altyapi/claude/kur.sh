#!/usr/bin/env bash
# Claude Code'u Natro sunucusuna kurar (Remote Control: Claude sunucuda çalışır, claude.ai/telefondan yazılır; gelen port açılmaz).
# Giriş (claude.ai hesabı) Fatih tarafından BİR KEZ elle yapılır: bkz. deploy/altyapi/claude/BENIOKU.md
# Kullanım: sudo bash kur.sh <kullanıcı>
set -uo pipefail
adim() { echo "· $*"; }
K="${1:-${SUDO_USER:-updated}}"
id "$K" >/dev/null 2>&1 || { echo "kullanıcı yok: $K"; exit 1; }
export DEBIAN_FRONTEND=noninteractive
command -v tmux >/dev/null || { apt-get update -qq </dev/null >/dev/null 2>&1; apt-get install -y -qq tmux </dev/null 2>&1 | tail -2; }
adim "tmux: $(command -v tmux || echo YOK)"
npm install -g --no-audit --no-fund @anthropic-ai/claude-code 2>&1 | tail -3
adim "claude: $(command -v claude || echo YOK)"
# Sunucuyu yönetmesi için: docker grubu (Supabase kapları) ve /opt/updated okuma-yazma
usermod -aG docker "$K"
chgrp -R "$K" /opt/updated/site 2>/dev/null || true
# Başlatıcı: tmux içinde Remote Control sunucusu (oturum kapanınca da çalışır)
cat > /usr/local/bin/claude-sunucu <<'SH'
#!/usr/bin/env bash
# Natro sunucusunda Claude (Remote Control). Başlat: claude-sunucu · Durum: claude-sunucu durum · Durdur: claude-sunucu dur
case "${1:-baslat}" in
  durum) tmux has-session -t claude 2>/dev/null && echo "çalışıyor (tmux attach -t claude ile bakılır)" || echo "çalışmıyor";;
  dur) tmux kill-session -t claude 2>/dev/null && echo durduruldu || echo "zaten çalışmıyor";;
  *) tmux has-session -t claude 2>/dev/null && { echo "zaten çalışıyor"; exit 0; }
     tmux new-session -d -s claude -c /opt/updated "claude remote-control --name 'Natro sunucu' --spawn same-dir"
     sleep 3; echo "başladı: claude.ai/code → oturum listesinde 'Natro sunucu'";;
esac
SH
chmod 755 /usr/local/bin/claude-sunucu
# Tek seferlik giriş: claude.ai hesabıyla giriş, sonra Remote Control'ü ekranda başlatır (iki "y" onayı kullanıcıdan).
cat > /usr/local/bin/claude-giris <<'SH'
#!/usr/bin/env bash
echo "1/2 · claude.ai girişi: açılan bağlantıyı tarayıcıda aç, onayla, verilen kodu buraya yapıştır."
claude auth login || { echo "Giriş tamamlanmadı. Tekrar: claude-giris"; exit 1; }
tmux kill-session -t claude 2>/dev/null
echo
echo "2/2 · Şimdi iki soru gelecek; ikisine de y yazıp Enter'a bas."
echo "     'Natro sunucu' bağlandı yazınca bu pencereyi kapatabilirsin; Claude arka planda çalışmaya devam eder."
sleep 3
tmux new-session -s claude -c /opt/updated "claude remote-control --name 'Natro sunucu' --spawn same-dir"
SH
chmod 755 /usr/local/bin/claude-giris
# Sunucu yeniden başlarsa kendiliğinden açılsın
( crontab -u "$K" -l 2>/dev/null | grep -v claude-sunucu; echo "@reboot /usr/local/bin/claude-sunucu" ) | crontab -u "$K" -
echo "claude sürümü: $(claude --version 2>/dev/null | head -1)"
echo "kullanıcı: $K · giriş yapılmış mı: $( [ -f /home/$K/.claude/.credentials.json ] || [ -f /home/$K/.claude.json ] && echo muhtemelen evet || echo HAYIR — BENIOKU adım 2)"
