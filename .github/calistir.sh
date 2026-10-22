#!/usr/bin/env bash
# Komutu çalıştırır; hata olursa çıktının sonunu GitHub "error" notu olarak basar (kayıtlar Actions sayfası açmadan okunabilsin).
# Kullanım: .github/calistir.sh "Başlık" komut argümanlar…
title="$1"; shift
set -o pipefail
log=$(mktemp /tmp/calistir-XXXX.log)
"$@" 2>&1 | tee "$log"
code=${PIPESTATUS[0]}
if [ "$code" -ne 0 ]; then
  node -e "const t=require('fs').readFileSync(process.argv[1],'utf8').slice(-3500);console.log('::error title='+process.argv[2]+'::'+t.replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'))" "$log" "$title"
fi
exit "$code"
