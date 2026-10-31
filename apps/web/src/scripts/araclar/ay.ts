/**
 * Ay konumu, evresi ve doğuş/batış saatleri (SunCalc yöntemi, V. Agafonkin, BSD; Meeus "Astronomical Algorithms" yaklaşık formülleri).
 * Doğuş/batış ±3 dk; yeni ay ve dolunay anı Meeus bölüm 49 ile ±1 dk. Dolunay aracı (toplantı notu 30 Ekim 2026) kullanır.
 */
const rad = Math.PI / 180, gunMs = 864e5, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397
const { sin, cos, tan, asin, atan2: atan, sqrt, abs, PI } = Math
const toDays = (d: Date) => d.valueOf() / gunMs - 0.5 + J1970 - J2000
const rightAscension = (l: number, b: number) => atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l))
const declination = (l: number, b: number) => asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l))
const azimuth = (H: number, phi: number, dec: number) => atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi))
const altitude = (H: number, phi: number, dec: number) => asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H))
const siderealTime = (d: number, lw: number) => rad * (280.16 + 360.9856235 * d) - lw
const astroRefraction = (h: number) => { if (h < 0) h = 0; return 0.0002967 / tan(h + 0.00312536 / (h + 0.08901179)) }
function moonCoords(d: number) {
  // Meeus bölüm 47'nin büyük terimleri: boylamda ~0,1°, uzaklıkta ~300 km doğruluk (SunCalc'in tek terimli hâli 1-2° şaşıyordu)
  const L = rad * (218.316 + 13.176396 * d), M = rad * (134.963 + 13.064993 * d), F = rad * (93.272 + 13.22935 * d)
  const D = rad * (297.85 + 12.190749 * d), Ms = rad * (357.529 + 0.98560028 * d)
  const l = L + rad * (6.289 * sin(M) + 1.274 * sin(2 * D - M) + 0.658 * sin(2 * D) - 0.186 * sin(Ms) - 0.059 * sin(2 * M - 2 * D)
    - 0.057 * sin(M - 2 * D + Ms) + 0.053 * sin(M + 2 * D) + 0.046 * sin(2 * D - Ms) + 0.041 * sin(M - Ms) - 0.035 * sin(D) - 0.031 * sin(M + Ms))
  const b = rad * (5.128 * sin(F) + 0.28 * sin(M + F) + 0.277 * sin(M - F) + 0.173 * sin(2 * D - F))
  const dt = 385001 - 20905 * cos(M) - 3699 * cos(2 * D - M) - 2956 * cos(2 * D)
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt }
}

/** Meeus bölüm 49: k. yeni ay (k tam sayı) ya da dolunay (k + 0,5) anı; ±1 dk */
function evreAni(k: number): Date {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T
  const JDE = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4
  const E = 1 - 0.002516 * T - 0.0000074 * T2
  const M = rad * (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3)
  const Mp = rad * (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4)
  const F = rad * (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4)
  const O = rad * (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3)
  const dolunay = Math.abs(k % 1) > 0.25
  const c = dolunay
    ? -0.40614 * sin(Mp) + 0.17302 * E * sin(M) + 0.01614 * sin(2 * Mp) + 0.01043 * sin(2 * F) + 0.00734 * E * sin(Mp - M) - 0.00515 * E * sin(Mp + M) + 0.00209 * E * E * sin(2 * M)
    : -0.4072 * sin(Mp) + 0.17241 * E * sin(M) + 0.01608 * sin(2 * Mp) + 0.01039 * sin(2 * F) + 0.00739 * E * sin(Mp - M) - 0.00514 * E * sin(Mp + M) + 0.00208 * E * E * sin(2 * M)
  const ek = -0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F) + 0.00056 * E * sin(2 * Mp + M) - 0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F) + 0.00038 * E * sin(M - 2 * F) - 0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(O)
  return new Date((JDE + c + ek - J1970 + 0.5) * gunMs - 69e3) // JDE yer zamanı (TT): ~69 sn ΔT düşülür
}
/** t anından önceki son yeni ayın k sayısı */
const sonYeniK = (t: Date) => { let k = Math.floor((t.getUTCFullYear() + t.getUTCMonth() / 12 - 2000) * 12.3685) - 1; while (+evreAni(k + 1) <= +t) k++; while (+evreAni(k) > +t) k--; return k }

/** Ayın ufka göre yüksekliği (derece), yönü (derece, kuzeyden saat yönünde) ve uzaklığı (km) */
export function ayKonumu(t: Date, lat: number, lng: number) {
  const lw = rad * -lng, phi = rad * lat, d = toDays(t), c = moonCoords(d), H = siderealTime(d, lw) - c.ra
  let h = altitude(H, phi, c.dec); h += astroRefraction(h)
  return { yukseklik: h / rad, yon: (azimuth(H, phi, c.dec) / rad + 180) % 360, uzaklik: c.dist }
}

/** Aydınlanma oranı (0-1) ve evre (0 yeni ay, 0,25 ilk dördün, 0,5 dolunay, 0,75 son dördün): iki yeni ay arasındaki yerine göre */
export function ayEvresi(t: Date) {
  const k = sonYeniK(t), a = +evreAni(k), b = +evreAni(k + 1), evre = (+t - a) / (b - a)
  return { oran: (1 - cos(2 * PI * evre)) / 2, evre, uzaklik: moonCoords(toDays(t)).dist }
}

/** Verilen yerel günün (gece yarısı → ertesi gece yarısı) içindeki ay doğuşu ve batışı; o gün olmuyorsa null */
export function ayDogusBatis(geceYarisi: Date, lat: number, lng: number): { dogus: Date | null; batis: Date | null } {
  const hc = 0.133, saatSonra = (s: number) => new Date(+geceYarisi + s * 36e5), yuk = (s: number) => ayKonumu(saatSonra(s), lat, lng).yukseklik - hc
  let h0 = yuk(0), dogus: number | null = null, batis: number | null = null
  for (let i = 1; i <= 24; i += 2) {
    const h1 = yuk(i), h2 = yuk(i + 1)
    const a = (h0 + h2) / 2 - h1, b = (h2 - h0) / 2, xe = -b / (2 * a), ye = (a * xe + b) * xe + h1, d = b * b - 4 * a * h1
    let kok = 0, x1 = 0, x2 = 0
    if (d >= 0) { const dx = sqrt(d) / (abs(a) * 2); x1 = xe - dx; x2 = xe + dx; if (abs(x1) <= 1) kok++; if (abs(x2) <= 1) kok++; if (x1 < -1) x1 = x2 }
    if (kok === 1) { if (h0 < 0) dogus = i + x1; else batis = i + x1 }
    else if (kok === 2) { dogus = i + (ye < 0 ? x2 : x1); batis = i + (ye < 0 ? x1 : x2) }
    if (dogus !== null && batis !== null) break
    h0 = h2
  }
  return { dogus: dogus === null ? null : saatSonra(dogus), batis: batis === null ? null : saatSonra(batis) }
}

/** Evrenin Türkçe adı (büyüyen / küçülen ayrımıyla) */
export function evreAdi(evre: number) {
  const p = ((evre % 1) + 1) % 1
  if (p < 0.03 || p > 0.97) return 'Yeni ay'
  if (p < 0.22) return 'Büyüyen hilal'
  if (p < 0.28) return 'İlk dördün'
  if (p < 0.47) return 'Büyüyen şişkin ay'
  if (p < 0.53) return 'Dolunay'
  if (p < 0.72) return 'Küçülen şişkin ay'
  if (p < 0.78) return 'Son dördün'
  return 'Küçülen hilal'
}

/** Verilen andan sonraki ilk yeni ay (0) ya da dolunay (0,5) anı */
export function sonrakiEvre(baslangic: Date, hedef: 0 | 0.5): Date {
  let k = sonYeniK(baslangic) + hedef
  while (+evreAni(k) <= +baslangic) k += 1
  return evreAni(k)
}

/** Ay diski için SVG yolu (100×100 kutu): aydınlık kısım. Kuzey yarımkürede büyüyen ay sağdan aydınlanır. */
export function ayYolu(evre: number) {
  const p = ((evre % 1) + 1) % 1, rx = (50 * abs(cos(2 * PI * p))).toFixed(2)
  if (p < 0.5) return `M50 0 A50 50 0 0 1 50 100 A${rx} 50 0 0 ${p < 0.25 ? 0 : 1} 50 0Z`
  return `M50 0 A50 50 0 0 0 50 100 A${rx} 50 0 0 ${p < 0.75 ? 0 : 1} 50 0Z`
}
