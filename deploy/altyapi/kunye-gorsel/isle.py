"""Künye görseli işleme (27 Ekim 2026): arka planı siler, ürünü standart UPDATED tuvaline yerleştirir.
rembg kabının içinde çalışır: python isle.py <girdi> <çıktı.webp>. Tuval 1600×900 (16:9, panelin görsel boyutlarıyla aynı),
şeffaf zemin; ürün en çok 1360×720 alana sığdırılır, ortalanır (bütün künyeler aynı ölçekte, aynı hizada durur).
Çıktı satırı JSON: {"ok":true,"kaplama":0.42,"w":..,"h":..} ya da {"ok":false,"hata":"..."}."""
import json, sys
from PIL import Image
from rembg import remove, new_session

TW, TH, MW, MH = 1600, 900, 1360, 720

def main(girdi, cikti):
    img = Image.open(girdi)
    img.load()
    if img.width < 500 or img.height < 300:
        return {"ok": False, "hata": f"görsel çok küçük ({img.width}×{img.height})"}
    img = img.convert("RGBA")
    img.thumbnail((2400, 2400))
    kes = remove(img, session=new_session("isnet-general-use"), post_process_mask=True)
    a = kes.getchannel("A").point(lambda v: 255 if v > 24 else 0)
    kutu = a.getbbox()
    if not kutu:
        return {"ok": False, "hata": "ürün ayrılamadı"}
    kaplama = (kutu[2] - kutu[0]) * (kutu[3] - kutu[1]) / (img.width * img.height)
    if kaplama < 0.04:
        return {"ok": False, "hata": f"ürün çok küçük kaldı (%{kaplama*100:.0f})"}
    urun = kes.crop(kutu)
    o = min(MW / urun.width, MH / urun.height, 2.0)
    urun = urun.resize((max(1, round(urun.width * o)), max(1, round(urun.height * o))), Image.LANCZOS)
    tuval = Image.new("RGBA", (TW, TH), (0, 0, 0, 0))
    tuval.alpha_composite(urun, ((TW - urun.width) // 2, (TH - urun.height) // 2))
    tuval.save(cikti, "WEBP", quality=90, method=6)
    return {"ok": True, "kaplama": round(kaplama, 3), "w": urun.width, "h": urun.height}

if __name__ == "__main__":
    try:
        print(json.dumps(main(sys.argv[1], sys.argv[2])))
    except Exception as e:  # noqa: BLE001
        print(json.dumps({"ok": False, "hata": str(e)[:200]}))
