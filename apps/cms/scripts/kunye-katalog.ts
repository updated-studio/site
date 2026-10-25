// Künye başlangıç kataloğu (25 Ekim 2026, offocus yol haritası 2): sitenin konularındaki popüler ürünler.
// Ürün açılınca türünün özellik şablonu kendiliğinden dolar (lib/urunSablon.ts); değerler boş başlar, editör Stüdyo'da
// "Kaynaktan doldur" ile doldurur. 5'ten az özelliği dolu künye arama motoruna kapalıdır. Var olan ürüne dokunulmaz.
// Kullanım: npx payload run scripts/kunye-katalog.ts
import { getPayload } from 'payload'
import config from '@payload-config'

type U = [string, string, string, string] // marka, ad, tür, kategori slug
const K: U[] = [
  // Kamera
  ['Sony', 'A7 IV', 'camera', 'kamera'], ['Sony', 'A7C II', 'camera', 'kamera'], ['Sony', 'A7R V', 'camera', 'kamera'], ['Sony', 'A1 II', 'camera', 'kamera'], ['Sony', 'FX3', 'camera', 'kamera'],
  ['Sony', 'FX30', 'camera', 'kamera'], ['Sony', 'ZV-E10 II', 'camera', 'kamera'], ['Sony', 'A6700', 'camera', 'kamera'],
  ['Canon', 'EOS R5 Mark II', 'camera', 'kamera'], ['Canon', 'EOS R6 Mark II', 'camera', 'kamera'], ['Canon', 'EOS R8', 'camera', 'kamera'], ['Canon', 'EOS R50', 'camera', 'kamera'], ['Canon', 'EOS R1', 'camera', 'kamera'],
  ['Nikon', 'Z8', 'camera', 'kamera'], ['Nikon', 'Z9', 'camera', 'kamera'], ['Nikon', 'Z6III', 'camera', 'kamera'], ['Nikon', 'Zf', 'camera', 'kamera'], ['Nikon', 'Z50II', 'camera', 'kamera'],
  ['Fujifilm', 'X-T5', 'camera', 'kamera'], ['Fujifilm', 'X-S20', 'camera', 'kamera'], ['Fujifilm', 'X100VI', 'camera', 'kamera'], ['Fujifilm', 'GFX100S II', 'camera', 'kamera'],
  ['Panasonic', 'Lumix S5IIX', 'camera', 'kamera'], ['Panasonic', 'Lumix GH7', 'camera', 'kamera'], ['Blackmagic', 'Pocket Cinema Camera 6K Pro', 'camera', 'kamera'], ['Leica', 'Q3', 'camera', 'kamera'],
  // Lens
  ['Sony', 'FE 24-70mm F2.8 GM II', 'lens', 'lens'], ['Sony', 'FE 70-200mm F2.8 GM OSS II', 'lens', 'lens'], ['Sony', 'FE 50mm F1.4 GM', 'lens', 'lens'], ['Sony', 'FE 20-70mm F4 G', 'lens', 'lens'],
  ['Canon', 'RF 24-70mm F2.8L IS USM', 'lens', 'lens'], ['Canon', 'RF 50mm F1.8 STM', 'lens', 'lens'], ['Nikon', 'NIKKOR Z 24-70mm f/2.8 S', 'lens', 'lens'],
  ['Sigma', '24-70mm F2.8 DG DN II Art', 'lens', 'lens'], ['Sigma', '18-50mm F2.8 DC DN Contemporary', 'lens', 'lens'], ['Tamron', '28-75mm F/2.8 Di III VXD G2', 'lens', 'lens'],
  // Dron
  ['DJI', 'Mini 4 Pro', 'drone', 'dron'], ['DJI', 'Mini 5 Pro', 'drone', 'dron'], ['DJI', 'Air 3S', 'drone', 'dron'], ['DJI', 'Mavic 4 Pro', 'drone', 'dron'], ['DJI', 'Avata 2', 'drone', 'dron'], ['DJI', 'Neo', 'drone', 'dron'], ['DJI', 'Flip', 'drone', 'dron'],
  // Vlog & aksiyon, 360
  ['DJI', 'Osmo Action 5 Pro', 'cam360', 'v-aksiyon'], ['DJI', 'Osmo Pocket 3', 'cam360', 'v-aksiyon'], ['DJI', 'Osmo 360', 'cam360', 'v-aksiyon'], ['DJI', 'Osmo Nano', 'cam360', 'v-aksiyon'],
  ['GoPro', 'HERO13 Black', 'cam360', 'v-aksiyon'], ['Insta360', 'X5', 'cam360', 'v-aksiyon'], ['Insta360', 'Ace Pro 2', 'cam360', 'v-aksiyon'], ['Insta360', 'GO Ultra', 'cam360', 'v-aksiyon'],
  // Telefon
  ['Apple', 'iPhone 17 Pro', 'phone', 'telefon'], ['Apple', 'iPhone 17 Pro Max', 'phone', 'telefon'], ['Apple', 'iPhone 17', 'phone', 'telefon'], ['Apple', 'iPhone Air', 'phone', 'telefon'],
  ['Samsung', 'Galaxy S25 Ultra', 'phone', 'telefon'], ['Samsung', 'Galaxy Z Fold7', 'phone', 'telefon'], ['Samsung', 'Galaxy Z Flip7', 'phone', 'telefon'],
  ['Google', 'Pixel 10 Pro', 'phone', 'telefon'], ['Xiaomi', '15 Ultra', 'phone', 'telefon'],
  // Gimbal
  ['DJI', 'RS 4', 'gimbal', 'studyo-ve-ekipman'], ['DJI', 'RS 4 Mini', 'gimbal', 'studyo-ve-ekipman'], ['DJI', 'Osmo Mobile 7P', 'gimbal', 'studyo-ve-ekipman'], ['Zhiyun', 'Crane 4', 'gimbal', 'studyo-ve-ekipman'], ['Insta360', 'Flow 2 Pro', 'gimbal', 'studyo-ve-ekipman'],
  // Işık
  ['Aputure', 'STORM 80c', 'light', 'studyo-ve-ekipman'], ['Aputure', 'amaran 200x S', 'light', 'studyo-ve-ekipman'], ['Godox', 'ML100Bi', 'light', 'studyo-ve-ekipman'], ['Godox', 'SL60IIBi', 'light', 'studyo-ve-ekipman'], ['Nanlite', 'Forza 60C', 'light', 'studyo-ve-ekipman'],
  // Mikrofon
  ['DJI', 'Mic 2', 'mic', 'studyo-ve-ekipman'], ['DJI', 'Mic Mini', 'mic', 'studyo-ve-ekipman'], ['RØDE', 'Wireless GO III', 'mic', 'studyo-ve-ekipman'], ['RØDE', 'Wireless PRO', 'mic', 'studyo-ve-ekipman'],
  ['Hollyland', 'Lark M2S', 'mic', 'studyo-ve-ekipman'], ['Sennheiser', 'Profile Wireless', 'mic', 'studyo-ve-ekipman'], ['Elgato', 'Wave Go', 'mic', 'studyo-ve-ekipman'], ['Insta360', 'Mic Pro', 'mic', 'studyo-ve-ekipman'],
  // Kulaklık
  ['Apple', 'AirPods Pro 3', 'headphones', 'kulaklik'], ['Sony', 'WH-1000XM6', 'headphones', 'kulaklik'], ['Final', 'Porta', 'headphones', 'kulaklik'],
]

const slug = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/ø/g, 'o').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const p = await getPayload({ config })
// Kategori adındaki yazım hatası (slug değişmez, eski adresler aynı)
const st = await p.find({ collection: 'categories', where: { slug: { equals: 'studyo-ve-ekipman' } }, limit: 1, overrideAccess: true })
if (st.docs[0] && (st.docs[0] as any).name !== 'Stüdyo ve Ekipman') { await p.update({ collection: 'categories', id: st.docs[0].id, data: { name: 'Stüdyo ve Ekipman' } as never, overrideAccess: true }); console.log('kategori adı düzeltildi: Stüdyo ve Ekipman') }
const kat = new Map(((await p.find({ collection: 'categories', limit: 100, depth: 0, overrideAccess: true })).docs as any[]).map((c) => [c.slug, c.id]))
let eklenen = 0, var_ = 0
for (const [marka, ad, tur, k] of K) {
  const s = slug(`${marka} ${ad}`)
  const e = await p.find({ collection: 'products', where: { or: [{ slug: { equals: s } }, { name: { equals: ad } }] }, limit: 1, depth: 0, overrideAccess: true })
  if (e.docs[0]) { var_++; continue }
  await p.create({ collection: 'products', overrideAccess: true, context: { katalog: true }, data: { name: ad, brand: marka, slug: s, type: tur, category: kat.get(k), status: 'satista', certainty: 4 } as never })
  eklenen++
}
console.log(`katalog: ${eklenen} ürün eklendi, ${var_} zaten vardı`)
process.exit(0)
