# Natro sunucusunda Claude (doğrudan çalışma)

Claude sunucunun içinde çalışır; sen claude.ai/code'dan ya da Claude uygulamasından yazarsın. Sunucu dışarıya kapı açmaz (yalnız Anthropic'e giden şifreli bağlantı). Kaynak: https://code.claude.com/docs/en/remote-control

## Bir kerelik giriş (Fatih)
1. Mac'te Terminal'i aç, sunucuya bağlan: `ssh <kullanıcı>@<sunucu IP>` (Natro panelindeki VPS bilgileri).
2. `cd /opt/updated && claude` yaz. Açılan ekranda `/login` → claude.ai hesabınla giriş (tarayıcıda açılan bağlantı, gelen kodu Terminal'e yapıştır). Klasöre güven sorusuna "evet".
3. `/exit` ile çık, sonra `claude-sunucu` yaz. "başladı" demeli.
4. claude.ai/code → oturum listesinde **Natro sunucu**. Artık oradan yazınca Claude doğrudan sunucuda çalışır.

## Bilinmesi gerekenler
- Team/Enterprise planında önce bir Owner'ın Remote Control'ü açması gerekir: https://claude.ai/admin-settings/claude-code
- Sunucu yeniden başlarsa kendiliğinden açılır (`@reboot`). Elle: `claude-sunucu`, `claude-sunucu durum`, `claude-sunucu dur`.
- Ortak hafıza aynı: her oturum önce site deposundaki `CLAUDE.md` + `DURUM.md` dosyalarını okur.
