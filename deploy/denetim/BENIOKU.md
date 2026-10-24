# Marka Kiti denetimi (sunucuda)

Sayfanın hesaplanmış stillerini Marka Kiti 1.2 kurallarıyla karşılaştırır: palet dışı renk, köşe, gölge, saydamlık, gradyan,
set dışı yazı tipi, Big Shoulders < 20 px, 14 px altı yazı (etiket hariç), başlık satır yüksekliği 1,2 ve büyük harf, tek H1,
44 px dokunma alanı, alt metni olmayan görsel.

Kurulum (bir kez, sunucuda): `/opt/updated/calisma/araclar` içinde `npm i playwright@1.48.2`,
`PLAYWRIGHT_BROWSERS_PATH=$PWD/tarayici npx playwright install chromium`, `sudo npx playwright install-deps chromium`.

Kullanım: `PLAYWRIGHT_BROWSERS_PATH=/opt/updated/calisma/araclar/tarayici node deploy/denetim/denetim.mjs https://updated.com.tr/ 390 koyu`
Ekran görüntüsü: `node deploy/denetim/ekran.mjs <adres> <çıktı.png> [genişlik] [acik|koyu]`

Bilinen, bilerek kalan: son dakika şeridindeki bağlantı ve oklar 40 px (kit §10b şerit 40 px).
