/**
 * Örnek içerik — CMS_URL boşken site bu verilerle açılır (tasarım önizlemesi, yerel geliştirme).
 * Canlıda tüm içerik Payload'dan gelir; bu dosya hiçbir zaman yayın verisi değildir.
 */
import type { Author, Cat, Comparison, News, Product, ProductRef, Reel, Review, Spec, Video } from './types'

const img = (k: string, alt = '', credit = 'Temsili görsel · UPDATED') => ({ url: `/ornek/${k}.webp`, alt, credit, w: 1200, h: 800 })
const tr = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[çğıöşüâî]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i' })[c]!).replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 7).join('-')

export const CATS: Cat[] = [
  ['Mobil', 'mobil'], ['Oyun', 'oyun'], ['Yapay Zekâ', 'yapay-zeka'], ['Ses', 'ses'], ['Ekran', 'ekran'], ['Gadget', 'gadget'],
  ['Bilgisayar', 'bilgisayar'], ['Otomobil', 'otomobil'], ['Kamera & Dron', 'kamera-dron'],
].map(([name, slug]) => ({ name, slug }))
const cat = (n: string) => CATS.find((c) => c.name === n)!
const AU: Record<string, Author> = Object.fromEntries(['Yağmur', 'Deniz', 'Nehir Yalçın', 'UPDATED'].map((n) => [n, { name: n, slug: tr(n), title: n === 'UPDATED' ? 'Yayın ekibi' : 'Editör' }]))

const S = (key: string, value: string | null, source = 'uretici', group?: string, num?: number): Spec => ({ key, value, source: value ? source : undefined, group, num, higherIsBetter: !/Ağırlık/.test(key), searchWeight: /video|Su geçirmezlik/.test(key) ? 5 : 3 })
type P = Omit<ProductRef, 'slug'> & { parts?: [string, string][]; rivals?: string[]; releaseWhen?: string; onRadar?: boolean }
const PR: Record<string, P> = {
  'dji-neo': { name: 'DJI Neo', brand: 'DJI', type: 'drone', status: 'satista', certainty: 4, score: 18, image: img('drone', 'DJI Neo'), blurb: 'Avuç içinden kalkan, korumalı pervaneli küçük vlog drone’u.',
    specs: [S('Ağırlık', '135 g', 'uretici', 'Gövde', 135), S('Video', '4K / 30 fps', 'uretici', 'Video'), S('Sensör', '1/2″ · 12 MP', 'uretici', 'Görüntü'), S('Uçuş süresi', '~18 dk', 'uretici', 'Güç', 18), S('Dahili hafıza', '22 GB', 'uretici', 'Güç', 22)],
    parts: [['Pervane koruması', 'Kapalı pervaneler'], ['Üst kabuk', '135 g toplam'], ['Kamera', '1/2″ · 12 MP · 4K/30'], ['Pil', '~18 dk uçuş'], ['Ana kart', '22 GB dahili hafıza']], rivals: ['dji-avata360'] },
  'dji-avata360': { name: 'DJI Avata360', brand: 'DJI', type: 'drone', status: 'satista', certainty: 4, score: 18, image: img('fpv', 'DJI Avata360'), blurb: '360° çekim yapan FPV drone.', specs: [], rivals: ['dji-neo'] },
  'dji-osmo-360': { name: 'DJI Osmo 360', brand: 'DJI', type: 'cam360', status: 'satista', certainty: 4, image: img('cam360', 'DJI Osmo 360'), blurb: 'DJI’ın 360° aksiyon kamerası.',
    specs: [S('Maks. 360° video', '8K / 50 fps', 'uretici', 'Video', 50), S('Sensör', '2× 1 inç', 'uretici', 'Görüntü'), S('Ağırlık', '183 g', 'uretici', 'Gövde', 183), S('Su geçirmezlik (kasasız)', '10 m', 'uretici', 'Gövde', 10), S('Pil', '1950 mAh', 'uretici', 'Güç', 1950), S('Dahili hafıza', '105 GB', 'uretici', 'Güç'), S('Değiştirilebilir lens', 'Yok', 'uretici', 'Gövde')],
    parts: [['Lensler', 'Çift lens · 8K/50'], ['Gövde', '183 g · 10 m'], ['Ekran', 'Dokunmatik'], ['Pil', '1950 mAh'], ['Ana kart', '105 GB dahili']], rivals: ['insta360-x5'] },
  'insta360-x5': { name: 'Insta360 X5', brand: 'Insta360', type: 'cam360', status: 'satista', certainty: 4, image: img('luna', 'Insta360 X5'), blurb: 'Değiştirilebilir lensli 360° kamera.',
    specs: [S('Maks. 360° video', '8K / 30 fps', 'uretici', 'Video', 30), S('Sensör', '2× 1/1.28 inç', 'uretici', 'Görüntü'), S('Ağırlık', '200 g', 'uretici', 'Gövde', 200), S('Su geçirmezlik (kasasız)', '15 m', 'uretici', 'Gövde', 15), S('Pil', '2400 mAh', 'uretici', 'Güç', 2400), S('Dahili hafıza', 'Yok (microSD)', 'uretici', 'Güç'), S('Değiştirilebilir lens', 'Var', 'uretici', 'Gövde')],
    parts: [['Lensler', 'Değiştirilebilir · 8K/30'], ['Gövde', '200 g · 15 m'], ['Ekran', 'Dokunmatik'], ['Pil', '2400 mAh'], ['Ana kart', 'microSD']], rivals: ['dji-osmo-360'] },
  'galaxy-z-slide': { name: 'Galaxy Z Slide', brand: 'Samsung', type: 'phone', status: 'sizinti', certainty: 2, image: img('trifold', 'Galaxy Z Slide temsili'), blurb: 'Samsung’un kayan ekranlı olduğu iddia edilen katlanabilir modeli.',
    specs: [S('Ekran', 'Kayan ekran (iddia)', 'sizinti'), S('Tanıtım', null), S('Fiyat', null), S('İşlemci', null)], releaseWhen: '2027', onRadar: true, rivals: ['galaxy-z-trifold'] },
  'galaxy-z-trifold': { name: 'Galaxy Z TriFold', brand: 'Samsung', type: 'phone', status: 'sizinti', certainty: 2, blurb: 'Üç katlanan ekranlı olduğu iddia edilen model.', specs: [S('Ekran', 'Üç katlanan (iddia)', 'sizinti'), S('Tanıtım', null), S('Fiyat', null)], rivals: ['galaxy-z-slide'] },
  'motorola-razr-flex': { name: 'Motorola Razr Flex', brand: 'Motorola', type: 'phone', status: 'test', certainty: 3, image: img('flip', 'Motorola Razr Flex temsili'), blurb: 'Tanıtımından önce Geekbench’te görülen katlanabilir Razr.', specs: [S('İşlemci', 'Snapdragon 8 Gen 5', 'test'), S('Tanıtım', null), S('Fiyat', null)], releaseWhen: 'Açıklanmadı', onRadar: true },
  'xbox-nano': { name: 'Xbox Nano', brand: 'Microsoft', type: 'pad', status: 'duyuruldu', certainty: 4, image: img('pad', 'Xbox Nano'), blurb: 'Microsoft’un cep boyu oyun kumandası.', specs: [S('Tür', 'Cep boyu kumanda'), S('Fiyat', null), S('Pil', null)] },
  'elgato-wave-go': { name: 'Elgato Wave Go', brand: 'Elgato', type: 'audio', status: 'duyuruldu', certainty: 4, image: img('mic', 'Elgato Wave Go'), blurb: 'Yaka ve el tipi kullanımı tek gövdede birleştiren mikrofon.', specs: [S('Kullanım', 'Yaka ve el tipi'), S('Fiyat', null)] },
  'final-porta': { name: 'Final Porta', brand: 'Final', type: 'audio', status: 'duyuruldu', certainty: 4, image: img('phones', 'Final Porta'), blurb: '40 gramlık kablosuz kulaklık.', specs: [S('Ağırlık', '40 g'), S('Fiyat', null)] },
  'sony-fx5': { name: 'Sony FX5', brand: 'Sony', type: 'camera', status: 'takvim', certainty: 3, blurb: 'Çıkış takvimi ekim ortasına güncellenen sinema kamerası.', specs: [S('Çıkış', 'Ekim ortası', 'takvim'), S('Fiyat', null)], releaseWhen: 'Ekim ortası', onRadar: true },
}
export const ref = (slug: string): ProductRef => { const p = PR[slug]; return { slug, name: p.name, brand: p.brand, type: p.type, status: p.status, certainty: p.certainty, image: p.image, score: p.score, specs: p.specs, blurb: p.blurb } }

const BASE = Date.parse('2026-10-22T15:05:00+03:00')
const at = (hoursAgo: number) => new Date(BASE - hoursAgo * 3600e3).toISOString()
type Row = [string, string, string, string, number, string, string, Partial<News>?]
const ROWS: Row[] = [
  ['n1', 'Ses', 'Elgato Wave Go tanıtıldı: hem yaka hem el tipi kullanım', 'Yaka ve el tipi kullanımı tek cihazda topluyor; röportaj ve vlog için ikinci mikrofon taşımaya gerek kalmıyor.', 0.2, 'Yağmur', 'mic', { label: 'son-dakika', products: [ref('elgato-wave-go')] }],
  ['n2', 'Mobil', "Motorola Razr Flex Geekbench'te görüldü: Snapdragon 8 Gen 5 ile geliyor", 'Katlanabilir Razr serisinin işlemci tarafı tanıtımdan önce netleşmeye başladı.', 1, 'Deniz', 'flip', { label: 'son-dakika', products: [ref('motorola-razr-flex')] }],
  ['n3', 'Mobil', "Vivo X500 Ultra sızıntısı: Ultra seri 2027'de sürüyor", 'Kamera odaklı Ultra modellerin 2027 takviminde de yer alacağına işaret eden bir sızıntı.', 1.6, 'Deniz', 'ultra', { label: 'sizinti' }],
  ['n4', 'Mobil', "Samsung'un 2027 katlanabilir ailesi sızdı: Galaxy Z Slide ve TriFold", 'Sızıntıya göre ailede kayan ekranlı Z Slide ve üç katlanan TriFold yer alıyor; Samsung henüz açıklama yapmadı.', 3, 'Deniz', 'trifold', { label: 'sizinti', products: [ref('galaxy-z-slide'), ref('galaxy-z-trifold')], knowns: ['İki yeni model adı: Z Slide ve TriFold', 'Z Slide kayan ekranlı olarak anılıyor', 'Sızıntı 2027 ailesine işaret ediyor'], unknowns: ['Tanıtım tarihi', 'Fiyat ve pazarlar', 'Teknik özellikler'] }],
  ['n5', 'Yapay Zekâ', 'KillSwitch tanıtıldı: yapay zekânın kafasını karıştıran programlama dili', 'Yapay zekâ araçlarının kodu okumasını zorlaştırmayı hedefleyen sıra dışı bir deneme.', 3.8, 'Yağmur', 'ai'],
  ['n6', 'Ses', 'Final Porta tanıtıldı: 40 gramlık kablosuz kulaklık', '40 gramlık ağırlığıyla uzun kullanımda konfor arayanların radarına giriyor.', 5, 'Nehir Yalçın', 'phones', { products: [ref('final-porta')] }],
  ['n7', 'Ekran', 'LG Display FLiPP OLED teknolojisini duyurdu: daha ucuz ve verimli', 'OLED panellerin maliyetini düşürme hedefi, ileride daha uygun fiyatlı OLED cihaz demek olabilir.', 21.4, 'Yağmur', 'oled'],
  ['n8', 'Ses', 'Sony altın kaplama yeni Walkman ailesini tanıttı', 'Telefon çağında ayrı müzik çalar kategorisinin hâlâ yaşadığını gösteriyor.', 23, 'Nehir Yalçın', 'walkman'],
  ['n9', 'Gadget', 'Vaonis Atlas tanıtıldı: modüler akıllı teleskop', 'Akıllı teleskoplarda parçaları değiştirilebilen ilk tasarım olarak tanıtılıyor.', 23.8, 'Yağmur', 'scope'],
  ['n10', 'Oyun', "Microsoft'tan cep boyu oyun kumandası: Xbox Nano tanıtıldı", 'Bulut ve mobil oyun için cebe sığan bir kumanda seçeneği.', 25, 'Deniz', 'pad', { products: [ref('xbox-nano')] }],
  ['n11', 'Oyun', 'Epic Games Launcher yapay zekâ desteğiyle baştan yazıldı', 'PC oyun mağazaları arasındaki hız rekabetine yeni bir hamle.', 26.6, 'Deniz', 'launcher'],
  ['n12', 'Bilgisayar', 'ASUS ExpertBook A7 serisi 3K OLED ekranla geliyor', 'İş dizüstülerinde OLED ekran artık üst segmente özel değil.', 28, 'Yağmur', 'laptop'],
  ['n13', 'Otomobil', 'Yeni nesil Tesla Roadster sahneye çıkıyor', 'Yıllardır ertelenen modelin sahneye çıkması elektrikli spor otomobil gündemini değiştirebilir.', 28.4, 'Yağmur', 'car'],
  ['n14', 'Oyun', "GTA 6'nın PC sürümü için 2027 iddiası", 'PC oyuncuları için bekleme süresine dair ilk somut işaret; resmî doğrulama yok.', 44.8, 'Deniz', 'city', { label: 'sizinti' }],
]
const BODY = (n: News) => `<p>${n.spot}</p><p>Bilgi editör masasında doğrulandı; ayrıntılar netleştikçe bu haber güncellenecek.</p><h2>Bu ne anlama geliyor?</h2><p>Gelişme, kategorideki rekabeti ve fiyatlandırmayı doğrudan etkileyebilir. Resmî bilgi geldiğinde etiket ve metin güncellenir.</p><p>Ürünle ilgili tüm haber, inceleme ve teknik veriye künyeden ulaşabilirsiniz.</p>`
export const NEWS: News[] = ROWS.map(([id, c, title, spot, h, au, im, extra = {}]) => {
  const category = cat(c), slug = tr(title.split(':')[0])
  const n: News = { id, kind: 'news', title, spot, path: `/${category.slug}/${slug}`, category, label: 'yok', cover: img(im, title), author: AU[au], publishedAt: at(h), readingTime: 2, products: [], seo: { title, description: spot }, ...extra }
  n.html = BODY(n)
  n.sources = [{ name: '[Birincil kaynak · editör ekler]', primary: true }]
  if (id === 'n4') n.shortAnswer = "Sızıntıya göre Samsung'un 2027 katlanabilir ailesinde iki yeni model var: kayan ekranlı Galaxy Z Slide ve üç katlanan Galaxy Z TriFold. Samsung henüz resmî açıklama yapmadı."
  return n
})

const R = (id: string, slug: string, title: string, score: number, au: string, h: number, im: string, extra: Partial<Review> = {}): Review => ({
  id, kind: 'review', title, spot: PR[slug]?.blurb || '', path: `/inceleme/${tr(title.split(':')[0])}`, product: PR[slug] ? ref(slug) : ({ slug, name: title.split(':')[0], brand: '', type: 'other', status: 'satista', certainty: 4 } as ProductRef),
  score, pros: [], cons: [], cover: img(im, title), author: AU[au], publishedAt: at(h), readingTime: 6, products: [], seo: { title, description: PR[slug]?.blurb || title }, ...extra,
})
export const REVIEWS: Review[] = [
  R('r3', 'dji-neo', 'DJI Neo incelemesi: bütçe dostu, dayanıklı drone', 18, 'Nehir Yalçın', 1000, 'drone', {
    spot: 'Elden kalkıp seni takip eden, korumalı pervaneli küçük bir uçan kamera; ilk drone için en kolay başlangıçlardan biri.',
    shortAnswer: "İlk drone'unu arayan, vlog'una havadan açı eklemek isteyen için. Uzun uçuş ve rüzgârlı koşullarda profesyonel çekim yapacaksanız bir üst sınıfa bakın.",
    html: '<p>135 gramlık gövdesiyle DJI Neo avuç içinden kalkıp yine avuca inebiliyor. Pervanelerin kapalı olması yeni başlayanlara güven veriyor.</p><p>4K/30 video ve 1/2 inç 12 MP sensör sosyal medya çekimleri için yeterli. Yaklaşık 18 dakikalık uçuş süresi ise uzun çekim günlerinde yedek pil gerektiriyor.</p><blockquote class="quote">"Avuçtan kalkıp avuca inmesi, ilk uçuş korkusunu siliyor."</blockquote>',
    pros: ['Avuçtan kalkış ve iniş', 'Korumalı pervaneler', '135 g, cebe sığar'], cons: ['Rüzgârda zorlanıyor', '18 dk uçuş kısa'], usageDays: 21, deviceSource: 'Kendi satın alımımız',
    who: { for: ["İlk drone'unu arayan", "Vlog'una havadan açı isteyen"], notFor: ['Uzun uçuş isteyen', 'Rüzgârda profesyonel çekim yapan'] },
    methodHtml: '<p>[Test yöntemi: hangi koşulda, kaç uçuş, hangi ayarlarla. Editör ekler.]</p>', video: { title: 'DJI Neo: bütçe dostu, dayanıklı drone', youtubeId: '', kind: 'İnceleme', thumb: img('drone') },
  }),
  R('r1', 'insta360-luna-ultra', 'Insta360 Luna Ultra: 360 kamerada yeni çıta', 19, 'UPDATED', 980, 'luna'),
  R('r2', 'dji-avata360', 'DJI Avata360: 360° FPV deneyimi', 18, 'Nehir Yalçın', 3200, 'fpv'),
  R('r4', 'honor-magic-8-pro', 'Honor Magic 8 Pro: fiyat/performans amiral gemisi', 18, 'Nehir Yalçın', 1200, 'honor'),
  R('r5', 'dji-osmo-360-ii', 'DJI Osmo 360 II incelemesi', 18, 'Nehir Yalçın', 700, 'cam360'),
  R('r6', 'insta360-x4-air', 'Insta360 X4 Air incelemesi', 17, 'UPDATED', 5400, 'luna'),
]

export const COMPARISONS: Comparison[] = [{
  id: 'c1', kind: 'comparison', title: 'Osmo 360 mı Insta360 X5 mi? Hangisi kime uygun', spot: 'İki 360° kamerayı aynı koşulda karşılaştırdık.', path: '/karsilastirma/dji-osmo-360-vs-insta360-x5',
  a: ref('dji-osmo-360'), b: ref('insta360-x5'), author: AU['Nehir Yalçın'], publishedAt: at(400), cover: img('cam360'),
  shortAnswer: "Gece çekimi ve 8K'da akıcı hareket istiyorsanız Osmo 360; kasasız su altı, daha büyük pil ve değiştirilebilir lens istiyorsanız Insta360 X5.",
  keyDiffs: [{ big: '%67', label: 'daha yüksek kare hızı (8K)', winner: 'a' }, { big: '1″', label: 'daha büyük sensör', winner: 'a' }, { big: '+5 m', label: 'kasasız daha derin', winner: 'b' }],
  whoFor: { a: 'Gece çekimi ve 8K akıcılık önemliyse', b: 'Su altı, pil ve lens değişimi önemliyse' }, method: 'Aynı gün, aynı rota, aynı ayarlarla çekim.',
  seo: { title: 'DJI Osmo 360 vs Insta360 X5: hangisi kime uygun?', description: 'Kare hızı, sensör, su geçirmezlik ve pil: iki 360° kamera aynı koşulda.' },
}]

export const PRODUCTS: Record<string, Product> = Object.fromEntries(Object.keys(PR).map((slug) => {
  const p = PR[slug]
  const prod: Product = {
    ...ref(slug), path: `/urun/${slug}`, releaseWhen: p.releaseWhen, parts: p.parts?.map(([name, value]) => ({ name, value })),
    rivals: (p.rivals || []).map(ref), news: NEWS.filter((n) => n.products.some((x) => x.slug === slug)), reviews: REVIEWS.filter((r) => r.product.slug === slug),
    seo: { title: `${p.name} künyesi: özellikler ve haberler`, description: p.blurb || '' },
  }
  return [slug, prod]
}))
export const RADAR = Object.entries(PR).filter(([, p]) => p.onRadar).map(([slug]) => PRODUCTS[slug])

export const VIDEOS: Video[] = [
  ['Insta360 Luna Ultra incelemesi', 'İnceleme', 'luna'], ['Osmo 360 vs Insta360 X5: en detaylı kıyas', 'Karşılaştırma', 'cam360'], ['DJI Neo: bütçe dostu, dayanıklı drone', 'İnceleme', 'drone'],
  ['Honor Magic 8 Pro: fiyat/performans', 'İnceleme', 'honor'], ['Hangi aksiyon kamerası alınmalı?', 'Rehber', 'fpv'], ['Xbox Nano elimizde: ilk bakış', 'Haber', 'pad'],
].map(([title, kind, k]) => ({ title, kind, youtubeId: '', thumb: img(k) }))
export const REELS: Reel[] = [
  ['Xbox Nano cebe sığıyor', 'pad'], ['Razr Flex test sonucu', 'flip'], ['Z Slide sızıntısı', 'trifold'], ['Neo elden kalkıyor', 'drone'], ['Wave Go: yaka mı?', 'mic'], ['Atlas teleskop', 'scope'], ['OLED ucuzluyor', 'oled'],
].map(([caption, k]) => ({ caption, url: 'https://www.instagram.com/updated.tr/', cover: img(k) }))
export const AUTHORS = Object.values(AU)
