# Natro sunucusunda Claude (doğrudan çalışma)

Claude sunucunun içinde çalışır; sen claude.ai/code'dan ya da Claude uygulamasından yazarsın. Sunucu dışarıya kapı açmaz (yalnız Anthropic'e giden şifreli bağlantı). Kaynak: https://code.claude.com/docs/en/remote-control

## Bir kerelik giriş (Fatih)
1. Mac'te Terminal → `ssh updated@<sunucu IP>` (IP Natro panelinde; şifre VPS şifresi).
2. `claude-giris` yaz. Bağlantıyı tarayıcıda aç → onayla → kodu Terminal'e yapıştır.
3. Gelen iki soruya `y` + Enter. "Natro sunucu" görünce pencereyi kapat.
4. claude.ai/code → oturum listesinde **Natro sunucu**.

## Bilinmesi gerekenler
- Team/Enterprise planında önce bir Owner'ın Remote Control'ü açması gerekir: https://claude.ai/admin-settings/claude-code
- Sunucu yeniden başlarsa kendiliğinden açılır (`@reboot`). Elle: `claude-sunucu`, `claude-sunucu durum`, `claude-sunucu dur`.
- Ortak hafıza aynı: her oturum önce site deposundaki `CLAUDE.md` + `DURUM.md` dosyalarını okur.
