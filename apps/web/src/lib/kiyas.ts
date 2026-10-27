/**
 * Kıyas motoru (27 Ekim 2026; taslak claude.ai/artifact/Srix9YbYSzotLEQu9USZh5, Fatih onayı).
 * Hem derlemede (ilk görünüm, SEO) hem tarayıcıda (ürün ekle/çıkar) aynı HTML'i üretir; DOM'a ya da Astro'ya bağlı değildir.
 * - Teknik puan: künyedeki sayısal değerlerden, otomatik. Her özellik aynı türdeki ürünlerin katalogdaki en düşük–en yüksek
 *   değerine göre 0–1'e çevrilir (yön ve ağırlık panel şablonundan: apps/cms/src/lib/urunSablon.ts), ağırlıklı ortalama × 100.
 *   Ağırlığın %35'inden azı biliniyorsa puan verilmez ("veri bekleniyor"). Ürün eklemek başka ürünün puanını değiştirmez.
 * - UPscore: editörün notu (panelde künye → UPscore), incelemeye bağlanır.
 * - Fiyat: Amazon bağlantısı (ASIN ya da adres; yoksa ürün adıyla arama), ortaklık kodu Site ayarlarında.
 */
import { URUN_SABLONLARI } from '../../../cms/src/lib/urunSablon'
import { esc } from './format'
import { glyph } from './ui'

/** Tarayıcıya giden sade künye: [özellik, değer, sayı, birim, grup] */
export type KOz = [string, string | null, number | null, string, string]
export type K = { s: string; n: string; b: string; t: string; g?: string; up?: number; upr?: string; a?: string; sp: KOz[] }
export type Araliklar = Record<string, Record<string, [number, number]>>

const sablon = (t: string) => URUN_SABLONLARI[t] ?? URUN_SABLONLARI.other
/** Özelliğin yönü (true: büyük iyi, false: küçük iyi, null: kıyaslanmaz) ve ağırlığı */
function olcu(t: string, key: string): [boolean | null, number] {
  const r = sablon(t).find((x) => x[0] === key)
  return r ? [r[3], r[4]] : [null, 0]
}
const sayi = (k: K, key: string) => k.sp.find((o) => o[0] === key)?.[2] ?? null
const deger = (k: K, key: string) => k.sp.find((o) => o[0] === key)?.[1] ?? null
const tr = (n: number, ond = 0) => n.toLocaleString('tr-TR', { maximumFractionDigits: ond })

/** Katalogdaki aralıklar: tür → özellik → [en düşük, en yüksek] */
export function araliklar(hepsi: K[]): Araliklar {
  const a: Araliklar = {}
  for (const k of hepsi) for (const [key, , num] of k.sp) {
    if (num == null || olcu(k.t, key)[0] == null) continue
    const t = (a[k.t] ??= {}), r = t[key]
    t[key] = r ? [Math.min(r[0], num), Math.max(r[1], num)] : [num, num]
  }
  return a
}

export type Puan = { toplam: number | null; gruplar: { ad: string; puan: number }[]; kapsama: number }
export function teknik(k: K, ar: Araliklar): Puan {
  let t = 0, w = 0, tum = 0
  const g: Record<string, [number, number]> = {}
  for (const [key, grup, , yon, agirlik] of sablon(k.t)) {
    if (yon == null) continue
    tum += agirlik
    const v = sayi(k, key), r = ar[k.t]?.[key]
    if (v == null || !r) continue
    let x = r[1] === r[0] ? 1 : (v - r[0]) / (r[1] - r[0])
    if (!yon) x = 1 - x
    t += agirlik * x; w += agirlik
    const gg = (g[grup] ??= [0, 0]); gg[0] += agirlik * x; gg[1] += agirlik
  }
  const kapsama = tum ? w / tum : 0
  return {
    toplam: kapsama >= 0.35 && w ? Math.round((t / w) * 100) : null,
    gruplar: Object.entries(g).filter(([ad, [, gw]]) => gw > 0 && ad !== 'Fiyat').sort((a, b) => b[1][1] - a[1][1]).slice(0, 3).map(([ad, [gt, gw]]) => ({ ad, puan: Math.round((gt / gw) * 100) })),
    kapsama,
  }
}

/** Önde olan(lar): sayısal, kıyaslanabilir ve en az iki üründe bilinen özelliklerde */
function onde(ks: K[], key: string): string[] {
  const [yon] = olcu(ks[0].t, key)
  if (yon == null) return []
  const v = ks.map((k) => sayi(k, key)).filter((x): x is number => x != null)
  if (v.length < 2 || new Set(v).size === 1) return []
  const en = yon ? Math.max(...v) : Math.min(...v)
  return ks.filter((k) => sayi(k, key) === en).map((k) => k.s)
}

export function amazon(k: K, tag = '') {
  const t = tag ? `tag=${encodeURIComponent(tag)}` : ''
  const a = (k.a || '').trim()
  if (/^[A-Z0-9]{10}$/.test(a)) return `https://www.amazon.com.tr/dp/${a}${t ? '?' + t : ''}`
  if (/^https:\/\/(www\.)?amazon\.com\.tr\//.test(a)) return t ? a + (a.includes('?') ? '&' : '?') + t : a
  return `https://www.amazon.com.tr/s?k=${encodeURIComponent(`${k.b} ${k.n}`)}${t ? '&' + t : ''}`
}

/** Ürün kartları (görsel, iki puan, alt puanlar, fiyat) */
export function kartlarHtml(ks: K[], ar: Araliklar, tag = '', enCok = 4) {
  const kart = (k: K) => {
    const p = teknik(k, ar), cent = p.toplam == null ? 0 : Math.round(p.toplam / 5)
    return `<article class="kk" data-k="${esc(k.s)}">
  ${ks.length > 2 ? `<button class="kk-sil" type="button" data-sil="${esc(k.s)}" aria-label="${esc(k.b)} ${esc(k.n)} kıyastan çıkar">✕</button>` : ''}
  <a class="kk-gorsel" href="/urun/${esc(k.s)}" tabindex="-1" aria-hidden="true">${k.g ? `<img src="${esc(k.g)}" alt="" loading="lazy" decoding="async" width="800" height="450">` : glyph(k.t, 120)}</a>
  <div class="kk-ad"><span class="eyebrow" translate="no" lang="en">${esc(k.b)}</span><h2><a href="/urun/${esc(k.s)}" translate="no">${esc(k.n)}</a></h2></div>
  <div class="kk-puan">
    <div class="kk-tp"><span class="eyebrow">Teknik puan</span>${p.toplam == null ? `<div class="kk-rk bos">Veri bekleniyor<small>künyenin %${Math.round(p.kapsama * 100)}'i dolu</small></div>` : `<div class="kk-rk">${p.toplam}<small>/100</small></div>`}
      <div class="kk-olcek" role="img" aria-label="Teknik puan ${p.toplam ?? 'yok'}">${Array.from({ length: 20 }, (_, i) => `<i${i < cent ? ' class="on"' : ''}></i>`).join('')}</div></div>
    ${k.up != null ? `<a class="kk-ups" href="${esc(k.upr || `/urun/${k.s}`)}" aria-label="UPscore ${tr(k.up, 1)} / 10"><b>${tr(k.up, 1)}</b><span>UPSCORE</span></a>` : '<div class="kk-ups bos" title="Editör incelemesi bekleniyor"><b>–</b><span>UPSCORE</span></div>'}
  </div>
  ${p.gruplar.length ? `<div class="kk-alt">${p.gruplar.map((g) => `<div><span>${esc(g.ad)}</span><i><b style="width:${g.puan}%"></b></i><span class="s">${g.puan}</span></div>`).join('')}</div>` : ''}
  <div class="kk-fiyat"><a href="${esc(amazon(k, tag))}" target="_blank" rel="sponsored nofollow noopener"><span>Amazon'da gör</span><span class="m">amazon.com.tr ↗</span></a>${tag ? '<small>Ortaklık bağlantısı: alışverişte UPDATED komisyon alabilir, fiyat değişmez.</small>' : ''}</div>
</article>`
  }
  return ks.map(kart).join('') + (ks.length < enCok ? `<button class="kk-ekle" type="button" data-ekle-ac><span aria-hidden="true">+</span><span class="eyebrow">Ürün ekle</span></button>` : '')
}

/** "Neden daha iyi?": her ürünün tek başına önde olduğu en önemli 5 özellik */
export function nedenHtml(ks: K[]) {
  const t = ks[0].t
  return ks.map((k) => {
    const l: { p: number; h: string }[] = []
    for (const [key, , birim, yon, w] of sablon(t)) {
      if (yon == null) continue
      const o = onde(ks, key)
      if (o.length !== 1 || o[0] !== k.s) continue
      const ben = sayi(k, key)!, dig = ks.filter((x) => x.s !== k.s && sayi(x, key) != null), yakin = (yon ? Math.max : Math.min)(...dig.map((x) => sayi(x, key)!))
      const rakip = dig.find((x) => sayi(x, key) === yakin)!
      const oran = yon ? (yakin ? (ben - yakin) / Math.abs(yakin) : 1) : (yakin - ben) / Math.abs(yakin || 1)
      const fark = yon ? (yakin ? `+%${tr(oran * 100)}` : 'var') : `−${tr(yakin - ben, 1)}${birim ? ' ' + birim : ''}`
      l.push({ p: w * Math.min(oran, 3), h: `<li><span class="fk">${esc(fark)}</span><span>${esc(key)}: <b>${esc(deger(k, key))}</b><small>en yakın: ${esc(deger(rakip, key))} (<span translate="no">${esc(rakip.n)}</span>)</small></span></li>` })
    }
    l.sort((a, b) => b.p - a.p)
    return `<div class="kn"><h3><span translate="no">${esc(k.n)}</span> neden daha iyi</h3>${l.length ? `<ul>${l.slice(0, 5).map((x) => x.h).join('')}</ul>` : '<p class="pc-unk">Bilinen sayısal özelliklerin hiçbirinde tek başına önde değil.</p>'}</div>`
  }).join('')
}

/** Tüm özellikler tablosu: grup başlıkları, önde olan hücre vurgulu, aynı satırlar "Sadece farklar"da gizlenir */
export function tabloHtml(ks: K[]) {
  const sira = [...sablon(ks[0].t).map((r) => r[0]), ...ks.flatMap((k) => k.sp.map((o) => o[0]))]
  const anahtar = [...new Set(sira)].filter((key) => ks.some((k) => k.sp.some((o) => o[0] === key)))
  const grup = (key: string) => sablon(ks[0].t).find((r) => r[0] === key)?.[1] ?? ks.map((k) => k.sp.find((o) => o[0] === key)?.[4]).find(Boolean) ?? 'Genel'
  let son = '', h = `<thead><tr><th scope="col">Özellik</th>${ks.map((k) => `<th scope="col" translate="no">${esc(k.n)}</th>`).join('')}</tr></thead><tbody>`
  const gruplar = [...new Set(anahtar.map(grup))]
  for (const key of [...anahtar].sort((a, b) => gruplar.indexOf(grup(a)) - gruplar.indexOf(grup(b)))) {
    const g = grup(key)
    if (g !== son) { son = g; h += `<tr class="grp"><th colspan="${ks.length + 1}" scope="colgroup">${esc(g)}</th></tr>` }
    const o = onde(ks, key), d = ks.map((k) => deger(k, key))
    h += `<tr${new Set(d).size === 1 ? ' data-same="1"' : ''}><th scope="row">${esc(key)}</th>${ks.map((k, i) => `<td class="${o.includes(k.s) ? 'w' : ''}${d[i] ? '' : ' unk'}">${esc(d[i] || 'Bilinmiyor')}</td>`).join('')}</tr>`
  }
  return h + '</tbody>'
}

/** Yapışkan çubuk: adlar ve iki puan */
export function cubukHtml(ks: K[], ar: Araliklar) {
  return ks.map((k) => { const p = teknik(k, ar).toplam; return `<div><b translate="no">${esc(k.n)}</b><span>${p ?? '–'} · UP ${k.up != null ? tr(k.up, 1) : '–'}</span></div>` }).join('')
}

export const baslik = (ks: K[]) => ks.length === 2 ? `${ks[0].b} ${ks[0].n} mi, ${ks[1].b} ${ks[1].n} mi?` : ks.slice(0, -1).map((k) => `${k.b} ${k.n}`).join(', ') + ' ve ' + `${ks.at(-1)!.b} ${ks.at(-1)!.n}`
