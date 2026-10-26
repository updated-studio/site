import type { Payload } from 'payload'
import { bildirimEkle, havuz, puanEkle } from './uye'
import { purge } from '../hooks/revalidate'

/**
 * Haftalık fotoğraf görevi (offocus yol haritası 4, 26 Ekim 2026): her pazartesi 00.00'da (İstanbul) bir tema açılır, Uper'ler hafta
 * boyunca tek fotoğraf yükler (ekip onaylar), hafta bitince 3 gün kör oylama (sahibi gizli, sıra karışık, kişi başı en çok 3 oy,
 * kendine oy yok), sonra ilk üç açıklanır: puan, rozet, bildirim. Tema girilmemişse sıradaki tema kendiliğinden açılır.
 */
export const OY_HAKKI = 3
export const OYLAMA_GUN = 3

/** İstanbul saatiyle bu haftanın pazartesi 00.00'ı (UTC Date) */
export function haftaBasi(t = new Date()) {
  const ist = new Date(t.getTime() + 3 * 3600_000) // Türkiye UTC+3 (yaz saati yok)
  const gun = (ist.getUTCDay() + 6) % 7 // pazartesi 0
  const p = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - gun)
  return new Date(p - 3 * 3600_000)
}
export const gunEkle = (d: Date | string, g: number) => new Date(+new Date(d) + g * 86_400_000)

export type Asama = 'yakinda' | 'katilim' | 'oylama' | 'bitti'
export function asama(g: { baslangic: string; bitis: string; oylamaBitis: string }, simdi = Date.now()): Asama {
  if (simdi < +new Date(g.baslangic)) return 'yakinda'
  if (simdi < +new Date(g.bitis)) return 'katilim'
  if (simdi < +new Date(g.oylamaBitis)) return 'oylama'
  return 'bitti'
}

/** Ekip tema girmezse sırayla açılanlar */
export const TEMALAR: [string, string][] = [
  ['Gölge', 'Işıktan çok gölgenin anlattığı bir kare.'], ['Kırmızı', 'Karede kırmızı başrolde olsun.'], ['Pencereden', 'Bir pencere, cam ya da çerçeve arkasından.'],
  ['Yansıma', 'Su, cam, ayna: yansımayla kurulan kare.'], ['Simetri', 'Ortadan ikiye bölünse iki yanı aynı kalan bir sahne.'], ['Öncü çizgiler', 'Bakışı konuya taşıyan çizgiler.'],
  ['Altın saat', 'Gün doğumu ya da batımından hemen önceki sıcak ışık.'], ['Mavi saat', 'Güneş battıktan sonraki mavi ışıkta şehir ya da doğa.'], ['Siyah beyaz', 'Rengi çıkar, ışık ve biçim kalsın.'],
  ['Hareket', 'Hareketi donduran ya da akıtan bir kare.'], ['Minimal', 'Az öğe, çok boşluk.'], ['Doku', 'Dokunsan hissedeceğin bir yüzey.'],
  ['Sokak', 'Sokaktan, kurgusuz bir an.'], ['Portre', 'Bir insanı anlatan kare (izin alarak).'], ['Gece', 'Karanlıkta ışığın izi.'],
  ['Makro', 'Gözün kaçırdığı küçük ayrıntı.'], ['Kalabalık', 'Çok insan, tek hikâye.'], ['Yalnız', 'Tek başına bir insan, nesne ya da ağaç.'],
  ['Desen', 'Kendini tekrar eden şekiller.'], ['Çerçeve içinde çerçeve', 'Kapı, kemer, dallar: sahnenin içinde bir çerçeve.'], ['Yemek', 'Masadan bir kare.'],
  ['Yol', 'Bir yolun, köprünün ya da merdivenin hikâyesi.'], ['Su', 'Damla, dalga, yağmur: suyun bir hâli.'], ['Eski ve yeni', 'Aynı karede geçmiş ve bugün.'],
]

/**
 * Saatlik tur: (1) bu hafta ve gelecek hafta için tema yoksa sıradakini aç; (2) oylaması biten görevin sonucunu açıkla.
 */
export async function gorevTur(p: Payload) {
  const db = havuz(p)
  for (const bas of [haftaBasi(), gunEkle(haftaBasi(), 7)]) {
    const var_ = await p.find({ collection: 'gorevler', where: { baslangic: { equals: bas.toISOString() } }, limit: 1, depth: 0, overrideAccess: true })
    if (var_.totalDocs) continue
    const kullanilan = new Set((await p.find({ collection: 'gorevler', limit: 1000, depth: 0, overrideAccess: true, select: { baslik: true } as any })).docs.map((d: any) => d.baslik))
    const [baslik, aciklama] = TEMALAR.find(([b]) => !kullanilan.has(b)) ?? TEMALAR[Math.floor(+bas / 604_800_000) % TEMALAR.length]
    await p.create({ collection: 'gorevler', overrideAccess: true, data: { baslik, aciklama, baslangic: bas.toISOString(), durum: 'yayinda' } as any })
  }
  // Sonuç: oylama bitti, henüz açıklanmadı
  const biten = await p.find({ collection: 'gorevler', where: { and: [{ oylamaBitis: { less_than: new Date().toISOString() } }, { sonucAciklandi: { not_equals: true } }] }, limit: 5, depth: 0, overrideAccess: true })
  for (const g of biten.docs as any[]) {
    const r = await db.query(`select f.id, f.uye_id, count(o.uye_id)::int as oy, f.created_at from payload.gorev_fotolari f
      left join payload.gorev_oy o on o.foto_id = f.id where f.gorev_id = $1 and f.durum = 'onaylandi' group by f.id order by oy desc, f.created_at asc`, [g.id])
    const PUANLAR: ['gorev_birinci' | 'gorev_ikinci' | 'gorev_ucuncu', string][] = [['gorev_birinci', 'birinci'], ['gorev_ikinci', 'ikinci'], ['gorev_ucuncu', 'üçüncü']]
    for (let i = 0; i < r.rows.length; i++) {
      const f = r.rows[i]
      const sira = i < 3 && f.oy > 0 ? i + 1 : null
      await db.query('update payload.gorev_fotolari set oy = $2, sira = $3 where id = $1', [f.id, f.oy, sira])
      if (sira) { await puanEkle(p, f.uye_id, PUANLAR[i][0], `gorev:${g.id}`); await bildirimEkle(p, f.uye_id, 'gorev', `"${g.baslik}" görevinde ${PUANLAR[i][1]} oldun! Tebrikler.`, `/gorev#sonuc-${g.id}`) }
      else await bildirimEkle(p, f.uye_id, 'gorev', `"${g.baslik}" görevinin sonuçları açıklandı (${f.oy} oy aldın).`, `/gorev#sonuc-${g.id}`)
    }
    await p.update({ collection: 'gorevler', id: g.id, overrideAccess: true, data: { sonucAciklandi: true } as any })
    await purge(['/gorev'], 'gorev')
  }
}

let saat: NodeJS.Timeout | null = null
export function gorevZamanlayici(p: Payload) {
  if (saat) return
  const tur = () => gorevTur(p).catch((e) => p.logger.warn(`haftalık görev turu: ${e}`))
  setTimeout(tur, 90_000); saat = setInterval(tur, 3600_000)
}
