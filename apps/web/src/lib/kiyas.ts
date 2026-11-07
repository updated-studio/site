/**
 * Kıyas motoru (27 Ekim 2026; taslak claude.ai/artifact/Srix9YbYSzotLEQu9USZh5, Fatih onayı).
 * Hem derlemede (ilk görünüm, SEO) hem tarayıcıda (ürün ekle/çıkar) aynı HTML'i üretir; DOM'a ya da Astro'ya bağlı değildir.
 * - Teknik puan: künyedeki sayısal değerlerden, otomatik. Her özellik aynı türdeki ürünlerin katalogdaki en düşük–en yüksek
 *   değerine göre 0–1'e çevrilir (yön ve ağırlık panel şablonundan: apps/cms/src/lib/urunSablon.ts), ağırlıklı ortalama × 100.
 *   Ağırlığın %35'inden azı biliniyorsa puan verilmez ("veri bekleniyor"). Ürün eklemek başka ürünün puanını değiştirmez.
 * - UPscore: editörün notu (panelde künye → UPscore), incelemeye bağlanır.
 * - Fiyat: künyedeki "Türkiye fiyatı" (girilmişse) + Amazon bağlantısı (ASIN ya da adres; yoksa ürün adıyla arama), ortaklık kodu Site ayarlarında.
 * - 6 Kasım 2026 (taslak claude.ai/artifact/KoA2HF8uQSgMoPcSx2T1A8, onaylı): karar, kim nerede kazanıyor, özellik haritası, en büyük farklar,
 *   numaralı grup tablosu, alternatifler, sahipleri, sınıfının en iyileri, "karar net". "Neden daha iyi?" bölümü bunlara yerini bıraktı.
 */
import { URUN_SABLONLARI } from '../../../cms/src/lib/urunSablon'
import { esc } from './format'
import { glyph } from './ui'

/** Tarayıcıya giden sade künye: [özellik, değer, sayı, birim, grup] */
export type KOz = [string, string | null, number | null, string, string]
export type K = { s: string; n: string; b: string; t: string; g?: string; up?: number; upr?: string; a?: string; i?: number; sp: KOz[] }
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

/** Künyedeki Türkiye fiyatı (girilmişse) */
const fiyat = (k: K) => deger(k, 'Türkiye fiyatı')

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
  <div class="kk-fiyat">${fiyat(k) ? `<p class="kk-tl"><span class="eyebrow">Türkiye fiyatı</span><b>${esc(fiyat(k))}</b></p>` : ''}<a href="${esc(amazon(k, tag))}" target="_blank" rel="sponsored nofollow noopener"><span>Amazon'da gör</span><span class="m">amazon.com.tr ↗</span></a>${tag ? '<small>Ortaklık bağlantısı: alışverişte UPDATED komisyon alabilir, fiyat değişmez.</small>' : ''}</div>
</article>`
  }
  return ks.map(kart).join('') + (ks.length < enCok ? `<button class="kk-ekle" type="button" data-ekle-ac><span aria-hidden="true">+</span><span class="eyebrow">Ürün ekle</span></button>` : '')
}

/* ---------- Görünen gruplar (6 Kasım 2026, kıyas sayfasının yeni düzeni; taslak claude.ai/artifact/KoA2HF8uQSgMoPcSx2T1A8) ----------
 * Tabloda ve "Kim nerede kazanıyor"da ürün türüne göre uyarlanmış gruplar kullanılır; uyarlaması olmayan türde panel şablonundaki grup.
 * Lens (kullanıcı: "1 genel bilgi, 2 optik, 3 açıklık (diyafram), 4 odaklama"): yuva, sensör kapsama ve gövde Genel'de; diyafram ayrı grup. */
const GORUNUM: Record<string, { sira: string[]; grup: Record<string, string>; ozel: Record<string, string> }> = {
  lens: {
    sira: ['Genel', 'Optik', 'Diyafram', 'Odaklama'],
    grup: { Uyumluluk: 'Genel', Gövde: 'Genel', Fiyat: 'Genel', Odak: 'Odaklama' },
    ozel: { 'Maks. diyafram': 'Diyafram', 'Min. diyafram': 'Diyafram', 'Diyafram bıçağı': 'Diyafram' },
  },
}
const GRUP_ADI: Record<string, string> = { Diyafram: 'Açıklık (diyafram)' }
const grupAdi = (g: string) => GRUP_ADI[g] ?? g
const grupId = (g: string) => 'kg-' + g.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
function gorunenGrup(t: string, key: string, veriGrubu?: string): string {
  const g = sablon(t).find((r) => r[0] === key)?.[1] ?? veriGrubu ?? 'Genel'
  const u = GORUNUM[t]
  return u ? u.ozel[key] ?? u.grup[g] ?? g : g
}
/** Tablodaki özellikler, görünen gruba göre sıralı: [grup, [özellik…]] */
function tabloGruplari(ks: K[]): [string, string[]][] {
  const t = ks[0].t
  const sira = [...sablon(t).map((r) => r[0]), ...ks.flatMap((k) => k.sp.map((o) => o[0]))]
  const anahtar = [...new Set(sira)].filter((key) => ks.some((k) => k.sp.some((o) => o[0] === key)))
  const grup = (key: string) => gorunenGrup(t, key, ks.map((k) => k.sp.find((o) => o[0] === key)?.[4]).find(Boolean) || undefined)
  const gruplar = [...new Set([...(GORUNUM[t]?.sira ?? []), ...anahtar.map(grup)])]
  return gruplar.map((g) => [g, anahtar.filter((key) => grup(key) === g)] as [string, string[]]).filter(([, l]) => l.length)
}

/** Tüm teknik veriler tablosu: numaralı grup başlıkları (çapa: #kg-…), önde olan hücre vurgulu, aynı satırlar "Sadece farklar"da gizlenir */
export function tabloHtml(ks: K[]) {
  let h = `<thead><tr><th scope="col">Özellik</th>${ks.map((k) => `<th scope="col" translate="no">${esc(k.n)}</th>`).join('')}</tr></thead>`
  tabloGruplari(ks).forEach(([g, l], i) => {
    h += `<tbody id="${grupId(g)}"><tr class="grp"><th colspan="${ks.length + 1}" scope="colgroup"><span class="grp-no">${i + 1}</span>${esc(grupAdi(g))}</th></tr>`
    for (const key of l) {
      const o = onde(ks, key), d = ks.map((k) => deger(k, key))
      h += `<tr${new Set(d).size === 1 ? ' data-same="1"' : ''}><th scope="row">${esc(key)}</th>${ks.map((k, n) => `<td class="${o.includes(k.s) ? 'w' : ''}${d[n] ? '' : ' unk'}">${esc(d[n] || 'Bilinmiyor')}</td>`).join('')}</tr>`
    }
    h += '</tbody>'
  })
  return h
}
/** Tablonun üstündeki grup kısayolları */
export const grupNavHtml = (ks: K[]) => tabloGruplari(ks).map(([g], i) => `<a href="#${grupId(g)}">${i + 1} ${esc(grupAdi(g))}</a>`).join('')

/** Yapışkan çubuk: adlar ve iki puan */
export function cubukHtml(ks: K[], ar: Araliklar) {
  return ks.map((k) => { const p = teknik(k, ar).toplam; return `<div><b translate="no">${esc(k.n)}</b><span>${p ?? '–'} · UP ${k.up != null ? tr(k.up, 1) : '–'}</span></div>` }).join('')
}

export const baslik = (ks: K[]) => ks.length === 2 ? `${ks[0].b} ${ks[0].n} mi, ${ks[1].b} ${ks[1].n} mi?` : ks.slice(0, -1).map((k) => `${k.b} ${k.n}`).join(', ') + ' ve ' + `${ks.at(-1)!.b} ${ks.at(-1)!.n}`

/* ---------- Yeni bölümler (6 Kasım 2026): karar, kim nerede kazanıyor, özellik haritası, en büyük farklar, raflar ---------- */
const tamAd = (k: K) => `${k.b} ${k.n}`
/** Dar yerlerdeki kısa ad: markalar birbirinden farklıysa marka, değilse model adı */
const kisa = (ks: K[]) => (new Set(ks.map((k) => k.b)).size === ks.length ? ks.map((k) => k.b) : ks.map((k) => k.n))
/** Özelliğin 0–1 değeri (yön uygulanmış: 1 daha iyi); bilinmiyorsa null */
function oran(k: K, key: string, ar: Araliklar): number | null {
  const [yon] = olcu(k.t, key), v = sayi(k, key), r = ar[k.t]?.[key]
  if (yon == null || v == null || !r) return null
  const x = r[1] === r[0] ? 1 : (v - r[0]) / (r[1] - r[0])
  return yon ? x : 1 - x
}
/** Kıyaslanabilir özellikler: yönü olan, en az iki üründe bilinen (fiyat hariç), ağırlığa göre sıralı */
function olculer(ks: K[], ar: Araliklar) {
  return sablon(ks[0].t).filter(([key, , , yon]) => yon != null && key !== 'Türkiye fiyatı' && ks.filter((k) => oran(k, key, ar) != null).length >= 2)
    .map(([key, , birim, yon, w]) => ({ key, birim, yon: yon as boolean, w, x: ks.map((k) => oran(k, key, ar)) }))
    .sort((a, b) => b.w - a.w)
}
/** Sayısal değerin kısa yazımı: "735 g", "f/2,8" */
function olcuYazi(k: K, key: string, birim: string) {
  const v = sayi(k, key)
  return v == null ? '' : birim === 'f/' ? `f/${tr(v, 2)}` : `${tr(v, 2)}${birim ? ' ' + birim : ''}`
}
/** Tek başına önde olan ürünün sırası; yoksa (eşitlik, tek veri) null */
function lider(d: (number | null)[]): number | null {
  const b = d.filter((x): x is number => x != null)
  if (b.length < 2) return null
  const en = Math.max(...b)
  return d.filter((x) => x === en).length === 1 ? d.indexOf(en) : null
}

export type Alan = { ad: string; id: string; puan: (number | null)[]; kazanan: number | null; puanli: boolean }
/** Her görünen grubun ürün başına puanı (teknik puanla aynı ölçek) ve o alanın tek başına birincisi */
export function alanlar(ks: K[], ar: Araliklar): Alan[] {
  const t = ks[0].t, m = new Map<string, [number, number][]>()
  for (const o of olculer(ks, ar)) {
    const g = gorunenGrup(t, o.key), l = m.get(g) ?? ks.map(() => [0, 0] as [number, number])
    m.set(g, l)
    o.x.forEach((x, i) => { if (x != null) { l[i][0] += o.w * x; l[i][1] += o.w } })
  }
  return tabloGruplari(ks).map(([g]) => {
    const puan = (m.get(g) ?? []).map(([a, b]) => (b ? Math.round((a / b) * 100) : null))
    return { ad: grupAdi(g), id: grupId(g), puan: puan.length ? puan : ks.map(() => null), kazanan: lider(puan), puanli: puan.filter((x) => x != null).length >= 2 }
  })
}

/** Karar: tek cümle + puanlar + her ürünün öne çıktığı özellikler; yanında "Kim nerede kazanıyor" (alana dokununca tabloda o gruba iner) */
export function kararHtml(ks: K[], ar: Araliklar) {
  const p = ks.map((k) => teknik(k, ar)), top = p.map((x) => x.toplam), birinci = lider(top)
  const al = alanlar(ks, ar), puanli = al.filter((a) => a.puanli), n = puanli.length
  const m = birinci == null ? 0 : puanli.filter((a) => a.kazanan === birinci).length
  const ad2 = kisa(ks), ad = birinci == null ? '' : esc(ad2[birinci])
  const baslik = birinci == null ? (top.filter((x) => x != null).length < 2 ? 'Karar için künyeler henüz yeterince dolu değil.' : 'Teknik puanda başa baş.')
    : n === 0 ? `<span translate="no">${ad}</span> teknik puanda önde.`
    : m === n ? (n === 1 ? `<span translate="no">${ad}</span> puanlanan tek alanda önde.` : `Puanlanan ${n} alanın hepsinde <span translate="no">${ad}</span> önde.`)
    : m === 0 ? `<span translate="no">${ad}</span> toplam puanda önde, ama hiçbir alanda tek başına birinci değil.`
    : `<span translate="no">${ad}</span>, puanlanan ${n} alandan ${m} tanesinde önde.`
  const puanlar = ks.map((_, i) => `<span translate="no">${esc(ad2[i])}</span> ${top[i] ?? 'veri bekliyor'}`).join(' · ')
  const eksik = ks.map((_, i) => (top[i] != null && p[i].kapsama < 0.6 ? `<span translate="no">${esc(ad2[i])}</span>` : '')).filter(Boolean)
  const guc = ks.map((k) => {
    const l = olculer(ks, ar).filter((o) => lider(o.x) === ks.indexOf(k)).slice(0, 3).map((o) => esc(o.key))
    return `<li><span translate="no">${esc(tamAd(k))}</span><b>${l.length ? l.join(', ') : 'Tek başına önde olduğu özellik yok'}</b></li>`
  }).join('')
  const alan = al.map((a) => {
    const kim = !a.puanli ? '<span class="kim yok">Sayısal veri yok</span>' : a.kazanan == null ? '<span class="kim">Başa baş</span>'
      : `<span class="kim"><span translate="no">${esc(ad2[a.kazanan])}</span> · ${a.puan[a.kazanan]}</span>`
    const diger = a.puanli ? ks.map((_, i) => (i === a.kazanan ? '' : `<span translate="no">${esc(ad2[i])}</span> ${a.puan[i] ?? 'veri yok'}`)).filter(Boolean).join(' · ') : 'Bu gruptaki özellikler sayıyla karşılaştırılmıyor'
    return `<a class="kz-alan" href="#${a.id}"><b>${esc(a.ad)}</b>${kim}<small>${diger}</small></a>`
  }).join('')
  return `<div class="kz-m"><span class="eyebrow">Karar</span><h2>${baslik}</h2><p>Teknik puan: ${puanlar}.${eksik.length ? ` ${eksik.join(', ')} künyesi eksik; değerler girildikçe puanı değişir.` : ''}</p><span class="eyebrow">Kim neyde önde</span><ul>${guc}</ul></div>
<div class="kz-alanlar"><span class="eyebrow">Kim nerede kazanıyor · ayrıntı için bir alana dokun</span>${alan}</div>`
}

const SERI = ['s1', 's2', 's3', 's4']
/** Özellik haritası (radar): en önemli 3–6 kıyaslanabilir özellik eksen olur; değer katalogdaki aralığa göre 0–1. Üçten az eksen varsa boş döner. */
export function haritaHtml(ks: K[], ar: Araliklar) {
  const ek = olculer(ks, ar).slice(0, 6)
  if (ek.length < 3) return ''
  const N = ek.length, CX = 190, CY = 170, R = 118
  const nokta = (i: number, v: number) => { const a = ((-90 + (i * 360) / N) * Math.PI) / 180; return [CX + Math.cos(a) * R * v, CY + Math.sin(a) * R * v] }
  const cokgen = (d: (number | null)[]) => d.map((v, i) => nokta(i, v == null ? 0 : Math.max(0.04, v)).map((x) => x.toFixed(1)).join(',')).join(' ')
  const ag = [0.25, 0.5, 0.75, 1].map((s) => `<polygon points="${cokgen(ek.map(() => s))}" class="ag"/>`).join('') + ek.map((_, i) => { const [x, y] = nokta(i, 1); return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="ag"/>` }).join('')
  // Uzun eksen adı ortadaki boşluktan ikiye bölünür (yanlara taşmasın)
  const bol = (s: string) => { if (s.length <= 13 || !s.includes(' ')) return [s]; const b = s.split(' '); let i = 1; for (let j = 1; j < b.length; j++) if (Math.abs(b.slice(0, j).join(' ').length - s.length / 2) < Math.abs(b.slice(0, i).join(' ').length - s.length / 2)) i = j; return [b.slice(0, i).join(' '), b.slice(i).join(' ')] }
  const etiket = ek.map((o, i) => {
    const [x, y] = nokta(i, 1.14), l = bol(o.key), y0 = y + 4 - (y < CY - 4 ? (l.length - 1) * 14 : y > CY + 4 ? 0 : (l.length - 1) * 7)
    return `<text y="${y0.toFixed(1)}" text-anchor="${Math.abs(x - CX) < 14 ? 'middle' : x > CX ? 'start' : 'end'}" class="ek">${l.map((s, n) => `<tspan x="${x.toFixed(1)}"${n ? ' dy="14"' : ''}>${esc(s)}</tspan>`).join('')}</text>`
  }).join('')
  const seri = ks.map((_, n) => { const d = ek.map((o) => o.x[n]); return `<polygon points="${cokgen(d)}" class="s ${SERI[n]}"/>` + d.map((v, i) => { const [x, y] = nokta(i, v == null ? 0 : Math.max(0.04, v)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" class="n ${SERI[n]}${v == null ? ' bos' : ''}"/>` }).join('') }).join('')
  const ozet = ks.map((k, n) => { const l = ek.filter((o) => lider(o.x) === n).map((o) => o.key); return `${tamAd(k)}: ${l.length ? l.join(', ') + ' ekseninde önde' : 'hiçbir eksende tek başına önde değil'}` }).join('; ')
  const lejant = ks.map((k, n) => { const l = ek.filter((o) => lider(o.x) === n).map((o) => esc(o.key)); return `<li class="${SERI[n]}"><i></i><span><b translate="no">${esc(tamAd(k))}</b><small>${l.length ? l.join(', ') + ' ekseninde önde' : 'Tek başına önde olduğu eksen yok'}</small></span></li>` }).join('')
  const tablo = `<table class="kh-eksen"><thead><tr><th scope="col">Eksen</th>${kisa(ks).map((a) => `<th scope="col" translate="no">${esc(a)}</th>`).join('')}</tr></thead><tbody>${ek.map((o) => `<tr><th scope="row">${esc(o.key)}</th>${ks.map((k, n) => `<td class="${lider(o.x) === n ? 'w' : ''}${o.x[n] == null ? ' unk' : ''}">${o.x[n] == null ? '—' : esc(olcuYazi(k, o.key, o.birim))}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  return `<svg viewBox="-34 -6 448 352" role="img" aria-label="${esc(ozet)}">${ag}${seri}${etiket}</svg><div class="kh-yan"><ul class="kh-lejant">${lejant}</ul>${tablo}</div>`
}

/** En büyük farklar: ürünler arasındaki açıklığı (önem ağırlıklı) en büyük beş özellik; çubuk uzadıkça daha iyi */
export function farkHtml(ks: K[], ar: Araliklar) {
  const l = olculer(ks, ar).map((o) => { const b = o.x.filter((x): x is number => x != null); return { ...o, fark: (Math.max(...b) - Math.min(...b)) * o.w } }).filter((o) => o.fark > 0).sort((a, b) => b.fark - a.fark).slice(0, 5)
  return l.map((o) => {
    const on = lider(o.x), g = gorunenGrup(ks[0].t, o.key), ad = kisa(ks)
    return `<li><div class="kf-b"><b>${esc(o.key)}</b><a href="#${grupId(g)}">${on == null ? 'Önde olan birden çok ürün var' : `<span translate="no">${esc(ad[on])}</span> önde`}</a></div><div class="kf-c">${ks.map((k, n) => `<div class="kf-cub ${SERI[n]}${o.x[n] == null ? ' yok' : ''}"><span translate="no">${esc(ad[n])}</span><i style="--o:${o.x[n] == null ? 0 : Math.max(0.05, o.x[n]!).toFixed(2)}"></i><em>${esc(olcuYazi(k, o.key, o.birim) || 'Bilinmiyor')}</em></div>`).join('')}</div></li>`
  }).join('')
}

const miniHtml = (k: K, puan: number | null, ek = '') => `<a class="km-mini" href="/urun/${esc(k.s)}"><span class="km-mini-g">${k.g ? `<img src="${esc(k.g)}" alt="" loading="lazy" decoding="async" width="400" height="225">` : glyph(k.t, 46)}</span><span class="eyebrow" translate="no" lang="en">${esc(k.b)}</span><b translate="no">${esc(k.n)}</b>${ek}<span class="km-mini-alt">${puan != null ? `<span class="km-mini-p">${puan}<small>/100</small></span>` : ''}${fiyat(k) ? `<span class="km-mini-f">${esc(fiyat(k))}</span>` : ''}</span></a>`
const puanli = (l: K[], ar: Araliklar) => l.map((k) => ({ k, p: teknik(k, ar).toplam })).filter((x): x is { k: K; p: number } => x.p != null).sort((a, b) => b.p - a.p)
/** Alternatifler: aynı türden, kıyasta olmayan künyeler (fiyat verisi gelene kadar teknik puana göre) */
export const alternatifHtml = (ks: K[], katalog: K[], ar: Araliklar) => puanli(katalog.filter((k) => k.t === ks[0].t && !ks.some((x) => x.s === k.s)), ar).slice(0, 4).map((x) => miniHtml(x.k, x.p)).join('')
/** Sınıfının en iyileri: aynı türün teknik puanı en yüksek dört künyesi */
export const enIyiHtml = (ks: K[], katalog: K[], ar: Araliklar) => puanli(katalog.filter((k) => k.t === ks[0].t), ar).slice(0, 4).map((x) => miniHtml(x.k, x.p, ks.some((y) => y.s === x.k.s) ? '<span class="km-mini-n">Bu kıyasta</span>' : '')).join('')
/** Karar net: teknik puanda tek başına birinci olan ürün + teklif bağlantısı; birinci yoksa boş */
export function netHtml(ks: K[], ar: Araliklar, tag = '') {
  const top = ks.map((k) => teknik(k, ar).toplam), b = lider(top)
  if (b == null) return ''
  const k = ks[b], guc = olculer(ks, ar).filter((o) => lider(o.x) === b).slice(0, 3).map((o) => esc(o.key))
  return `<a class="kn-g" href="/urun/${esc(k.s)}" tabindex="-1" aria-hidden="true">${k.g ? `<img src="${esc(k.g)}" alt="" loading="lazy" decoding="async" width="800" height="450">` : glyph(k.t, 120)}</a>
<div><span class="eyebrow">Hâlâ burada mısın? Karar net</span><h2 translate="no">${esc(tamAd(k))}</h2><p>Teknik puanı ${top[b]} ile bu kıyasın birincisi${guc.length ? `; öne çıktığı yerler: ${guc.join(', ')}` : ''}.</p><a class="btn btn-p" href="${esc(amazon(k, tag))}" target="_blank" rel="sponsored nofollow noopener">Teklifi gör</a></div>`
}
/** Sahipleri: her ürünün "Kullananlar" kutusu (Uper'ler; scripts/uye.ts doldurur) */
/** Yorumlar ürüne (künyeye) bağlıdır (6 Kasım 2026): kıyaslanan ürünlerden biri seçilir, o ürünün yorumları ve yorum kutusu gelir (uye.ts doldurur) */
export const yorumSecHtml = (ks: K[], secili?: number) => { const ad = kisa(ks); return ks.filter((k) => k.i).length < 2 ? '' : ks.map((k, i) => (k.i ? `<button type="button" data-yorum-urun="${k.i}" aria-pressed="${k.i === secili}" translate="no">${esc(ad[i])}</button>` : '')).join('') }
export const yorumHtml = (k?: K) => (k?.i ? `<p class="km-yorum-kim"><b translate="no">${esc(tamAd(k))}</b> için yazılanlar. Yorumun ürünün <a href="/urun/${esc(k.s)}">künye sayfasında</a> da görünür.</p><section class="tp" data-hedef="products:${k.i}" data-bar="yok" aria-label="${esc(tamAd(k))} yorumları"><div class="tp-ic" data-tp-ic><p class="meta">Yorumlar yükleniyor…</p></div></section>` : '')
export const sahipHtml = (ks: K[]) => ks.filter((k) => k.i).map((k) => `<div class="km-kutu ku-kullanan" data-kullananlar="${k.i}"><h3 translate="no">${esc(tamAd(k))}</h3><div class="pc-unk" data-ic>Yükleniyor…</div></div>`).join('')

/** Ana sayfa kıyas robotu, Versus düzeni (7 Kasım 2026, kullanıcı: "kıyas robotu kısmı için versus u baz al"). Puan yok (kamera ve lenste puan
 *  verilmiyor): her ürünün tek başına önde olduğu ölçü sayısı, "neden daha iyi" maddeleri (önem sırasıyla, değerleriyle) ve en büyük dört fark. */
export type Versus = { toplam: number; on: number[]; neden: { key: string; bu: string; o: string }[][]; cubuk: { key: string; x: (number | null)[]; yazi: string[]; on: number | null }[] }
export function versus(ks: K[], ar: Araliklar): Versus {
  const o = olculer(ks, ar), l = o.map((x) => lider(x.x))
  const yazi = (k: K, x: (typeof o)[number]) => olcuYazi(k, x.key, x.birim) || 'Bilinmiyor'
  const neden = ks.map((k, i) => o.filter((_, j) => l[j] === i).slice(0, 6).map((x) => ({ key: x.key, bu: yazi(k, x), o: ks.filter((_, n) => n !== i).map((d) => yazi(d, x)).join(', ') })))
  const cubuk = o.map((x, j) => { const b = x.x.filter((v): v is number => v != null); return { x, j, fark: (Math.max(...b) - Math.min(...b)) * x.w } })
    .filter((y) => y.fark > 0).sort((a, b) => b.fark - a.fark).slice(0, 4)
    .map(({ x, j }) => ({ key: x.key, x: x.x, yazi: ks.map((k) => yazi(k, x)), on: l[j] }))
  return { toplam: o.length, on: ks.map((_, i) => l.filter((x) => x === i).length), neden, cubuk }
}
