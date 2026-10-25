/**
 * Güneş konumu ve olay saatleri (SunCalc yöntemi, V. Agafonkin, BSD; NOAA/Meeus yaklaşık formüller, ±1 dk).
 * Altın saat: güneş ufkun 4° altı ile 6° üstü arası; mavi saat: 6° altı ile 4° altı arası; gün doğumu/batımı: −0,833°.
 */
const rad = Math.PI / 180, gunMs = 864e5, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397
const toJulian = (d: Date) => d.valueOf() / gunMs - 0.5 + J1970
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * gunMs)
const toDays = (d: Date) => toJulian(d) - J2000
const declination = (l: number) => Math.asin(Math.sin(0) * Math.cos(e) + Math.cos(0) * Math.sin(e) * Math.sin(l))
const solarMeanAnomaly = (d: number) => rad * (357.5291 + 0.98560028 * d)
const eclipticLongitude = (M: number) => M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI
const J0 = 0.0009
const julianCycle = (d: number, lw: number) => Math.round(d - J0 - lw / (2 * Math.PI))
const approxTransit = (Ht: number, lw: number, n: number) => J0 + (Ht + lw) / (2 * Math.PI) + n
const solarTransitJ = (ds: number, M: number, L: number) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L)
const hourAngle = (h: number, phi: number, d: number) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)))

export type GunesSaatleri = { ogle: Date; dogus: Date; batis: Date; olaylar: Record<string, [Date, Date]> }

/** Verilen gün ve konum için açıya göre sabah/akşam saatleri. Kutup günlerinde NaN tarih döner (Türkiye'de olmaz). */
export function gunesSaatleri(tarih: Date, lat: number, lng: number): GunesSaatleri {
  const lw = rad * -lng, phi = rad * lat, d = toDays(tarih), n = julianCycle(d, lw), ds = approxTransit(0, lw, n)
  const M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L), Jnoon = solarTransitJ(ds, M, L)
  const zaman = (aci: number): [Date, Date] => {
    const w = hourAngle(aci * rad, phi, dec), a = approxTransit(w, lw, n), Jset = solarTransitJ(a, M, L)
    return [fromJulian(Jnoon - (Jset - Jnoon)), fromJulian(Jset)]
  }
  const [dogus, batis] = zaman(-0.833)
  return { ogle: fromJulian(Jnoon), dogus, batis, olaylar: { '-6': zaman(-6), '-4': zaman(-4), '6': zaman(6) } }
}

/** 81 il merkezi (plaka sırası): [ad, enlem, boylam] */
export const ILLER: [string, number, number][] = [
  ['Adana', 37.00, 35.32], ['Adıyaman', 37.76, 38.28], ['Afyonkarahisar', 38.76, 30.54], ['Ağrı', 39.72, 43.05], ['Amasya', 40.65, 35.83],
  ['Ankara', 39.93, 32.86], ['Antalya', 36.89, 30.71], ['Artvin', 41.18, 41.82], ['Aydın', 37.85, 27.85], ['Balıkesir', 39.65, 27.88],
  ['Bilecik', 40.14, 29.98], ['Bingöl', 38.88, 40.50], ['Bitlis', 38.40, 42.11], ['Bolu', 40.74, 31.61], ['Burdur', 37.72, 30.29],
  ['Bursa', 40.19, 29.06], ['Çanakkale', 40.15, 26.41], ['Çankırı', 40.60, 33.62], ['Çorum', 40.55, 34.95], ['Denizli', 37.78, 29.09],
  ['Diyarbakır', 37.91, 40.24], ['Edirne', 41.68, 26.56], ['Elazığ', 38.68, 39.22], ['Erzincan', 39.75, 39.49], ['Erzurum', 39.90, 41.27],
  ['Eskişehir', 39.78, 30.52], ['Gaziantep', 37.07, 37.38], ['Giresun', 40.91, 38.39], ['Gümüşhane', 40.46, 39.48], ['Hakkari', 37.58, 43.74],
  ['Hatay', 36.20, 36.16], ['Isparta', 37.76, 30.55], ['Mersin', 36.81, 34.64], ['İstanbul', 41.01, 28.98], ['İzmir', 38.42, 27.14],
  ['Kars', 40.60, 43.10], ['Kastamonu', 41.38, 33.78], ['Kayseri', 38.73, 35.49], ['Kırklareli', 41.73, 27.22], ['Kırşehir', 39.15, 34.17],
  ['Kocaeli', 40.77, 29.92], ['Konya', 37.87, 32.48], ['Kütahya', 39.42, 29.98], ['Malatya', 38.35, 38.31], ['Manisa', 38.61, 27.43],
  ['Kahramanmaraş', 37.58, 36.94], ['Mardin', 37.31, 40.74], ['Muğla', 37.22, 28.36], ['Muş', 38.74, 41.49], ['Nevşehir', 38.62, 34.71],
  ['Niğde', 37.97, 34.68], ['Ordu', 40.98, 37.88], ['Rize', 41.02, 40.52], ['Sakarya', 40.78, 30.40], ['Samsun', 41.29, 36.33],
  ['Siirt', 37.93, 41.94], ['Sinop', 42.03, 35.15], ['Sivas', 39.75, 37.02], ['Tekirdağ', 40.98, 27.51], ['Tokat', 40.31, 36.55],
  ['Trabzon', 41.00, 39.72], ['Tunceli', 39.11, 39.55], ['Şanlıurfa', 37.16, 38.79], ['Uşak', 38.68, 29.41], ['Van', 38.49, 43.38],
  ['Yozgat', 39.82, 34.81], ['Zonguldak', 41.45, 31.79], ['Aksaray', 38.37, 34.03], ['Bayburt', 40.26, 40.23], ['Karaman', 37.18, 33.22],
  ['Kırıkkale', 39.85, 33.51], ['Batman', 37.88, 41.13], ['Şırnak', 37.52, 42.46], ['Bartın', 41.63, 32.34], ['Ardahan', 41.11, 42.70],
  ['Iğdır', 39.92, 44.04], ['Yalova', 40.65, 29.27], ['Karabük', 41.20, 32.62], ['Kilis', 36.72, 37.12], ['Osmaniye', 37.07, 36.25],
  ['Düzce', 40.84, 31.16],
]
