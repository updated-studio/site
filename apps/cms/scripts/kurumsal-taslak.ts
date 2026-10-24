// Eksik kurumsal sayfaları (Google News ve güven sinyalleri için) TASLAK olarak ekler; yayına almak ekibin kararı
// (Stüdyo → Site → Ayarlar → Sayfalar). Var olan sayfaya dokunmaz. Metinler sitedeki gerçek kurallardan (kontrol listesi, etiketler,
// düzeltme notu, puan kutusu, reklam kuralları) çıkarıldı; şirkete özgü sözler (süre, sorumlu kişi) ekip tarafından kontrol edilmeli.
// Kullanım: npx payload run scripts/kurumsal-taslak.ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'

const SAYFALAR: { slug: string; title: string; spot: string; md: string }[] = [
  {
    slug: 'yayin-ilkeleri', title: 'Yayın ilkeleri', spot: 'Haberlerimizi nasıl hazırladığımız, neyi neden yayınladığımız.',
    md: `UPDATED teknolojiyi önce bilgiyle anlatmak için var. Bu sayfa, her yazıda uyduğumuz kuralları anlatır.

## Doğruluk ve kaynak
- Her haberde en az bir birincil kaynak (üreticinin açıklaması, resmî belge, ilk yayınlayan kaynak) bulunur ve yazının sonunda adıyla, bağlantısıyla gösterilir.
- Yayından önce her yazı bir kontrol listesinden geçer: bilgi doğrulandı mı, başlık abartısız mı, görselin kaynağı belli mi.
- Yazıyı hazırlayan editör kendi yazısını yayına alamaz; yayın onayını yayın yönetmeni verir.

## Sızıntı ve iddialar
- Resmî olarak doğrulanmamış bilgiler "Sızıntı" etiketiyle yayınlanır ve başlıkta "sızıntı" ya da "iddia" sözcüğü geçer.
- Sızıntı haberlerinde bilinenleri ve bilinmeyenleri ayrı ayrı yazar, bilginin kesinliğini dört basamaklı bir ölçekle (söylenti, sızıntı, test/takvim, resmî) gösteririz.

## Başlıklar
Başlıklarımızda ünlem, "şok", "inanılmaz" gibi abartılı sözcükler kullanmayız; başlık yazıda olmayan bir şeyi vaat etmez.

## Yapay zekâ kullanımı
Haber kaynaklarını taramak ve ilk taslağı hazırlamak için yapay zekâ destekli araçlardan yararlanabiliriz. Hiçbir yazı bu araçların çıktısıyla doğrudan yayınlanmaz: her yazıyı bir editör kontrol eder, düzenler ve yayın yönetmeni onaylar. Yazının sorumluluğu adı geçen yazara ve UPDATED'a aittir.

## Bağımsızlık, reklam ve sponsorluk
Reklam ve sponsorlu içerik editoryal içerikten açıkça ayrılır; ayrıntılar [Reklam ve sponsorluk](/reklam) sayfasında. Üreticiler yazılarımızı yayından önce görmez ve değiştiremez.

## Düzeltmeler
Hata yaparsak düzeltir ve bunu açıkça belirtiriz: [Düzeltme politikası](/duzeltme-politikasi).

## Yorumlar
Okur yorumları [topluluk kurallarına](/topluluk-kurallari) göre denetlenir.

## İletişim
Bir yazımızla ilgili itirazın ya da bilgin varsa [iletisim@updated.com.tr](mailto:iletisim@updated.com.tr) adresine yaz.`,
  },
  {
    slug: 'duzeltme-politikasi', title: 'Düzeltme politikası', spot: 'Hata silinmez; tarih ve saatli düzeltme notu eklenir.',
    md: `Doğru bilgi her şeyden önce gelir. Yayınladığımız bir yazıda hata bulduğumuzda ya da bize bildirildiğinde şöyle davranırız:

## Nasıl düzeltiriz
- Hatalı bilgiyi yazıda düzeltiriz ve yazının sonuna **tarih ve saatli bir düzeltme notu** ekleriz: neyin yanlış olduğunu ve doğrusunu yazarız.
- Hatayı sessizce silmeyiz; düzeltme notu yazıda kalır.
- Yazı önemli ölçüde değiştiyse yazının künye satırında "Güncellendi" saati görünür.
- Yazım hatası gibi anlamı değiştirmeyen küçük düzeltmeler için not eklemeyebiliriz.

## Ciddi hatalar
Bir yazının ana iddiası yanlış çıkarsa yazıyı başlığı ve girişiyle birlikte düzeltir, gerekirse yazının en üstüne açıklama ekleriz.

## Hata bildirmek
Bir hata gördüysen [iletisim@updated.com.tr](mailto:iletisim@updated.com.tr) adresine yazının bağlantısıyla birlikte yaz. Her bildirimi inceler, en kısa sürede yanıtlarız.`,
  },
  {
    slug: 'test-yontemimiz', title: 'Test yöntemimiz', spot: 'Cihazları nasıl, ne kadar süre ve hangi koşulda test ediyoruz.',
    md: `İncelemelerimizin amacı tek: "Bu ürünü almalı mıyım?" sorusuna kullanarak verilmiş, dürüst bir cevap.

## Gerçek kullanım
- Cihazı günlük hayatta, kendi işimizde kullanarak test ederiz. Her incelemede **ne kadar süre kullandığımızı** yazarız.
- **Cihazın kaynağını** her incelemede belirtiriz: üretici ya da distribütör test için verdiyse, kendimiz satın aldıysak bunu açıkça yazarız.
- Cihazı veren firma incelemeyi yayından önce görmez ve içeriğine karışamaz.

## Puan
- İncelemeleri **20 üzerinden tam sayı** puanla değerlendiririz; puan kutusu yazının sonundadır.
- Puan kutusunda en fazla üçer artı ve eksi, ürünün kime uygun olup olmadığı yer alır.
- Türkiye fiyatı ve satış koşulları değerlendirmenin parçasıdır: aynı ürün başka bir ülkede iyi bir alım olsa bile burada olmayabilir.

## Karşılaştırmalar
Karşılaştırmalarda ürünleri aynı koşulda (aynı sahne, aynı ayarlar, aynı süre) deneriz ve bu koşulları yazıda belirtiriz.

## Güncellemeler
Yazılım güncellemesi ya da fiyat değişikliği değerlendirmeyi değiştirirse incelemeyi güncelleriz; bu durumda [düzeltme politikamız](/duzeltme-politikasi) geçerlidir.`,
  },
  {
    slug: 'reklam', title: 'Reklam ve sponsorluk', spot: 'Reklam ve sponsorlu içerik editoryal içerikten açıkça ayrılır.',
    md: `UPDATED reklam ve sponsorlukla ayakta duran bağımsız bir yayın. Okurun neyin reklam olduğunu her zaman bilmesi için şu kurallara uyarız:

## Reklamlar
- Her reklam alanında **"Reklam"** yazar.
- Yazının ilk paragrafından önce reklam yoktur; bir yazıda en fazla iki reklam alanı bulunur.
- Açılır pencere ya da kendiliğinden sesli başlayan reklam kullanmayız. Video reklamlar sessizdir ve 5 saniye sonra geçilebilir.

## Sponsorlu içerik
- Bir firmanın ücret karşılığı hazırlattığı içerik **"Sponsorlu"** etiketiyle yayınlanır ve haberlerden, incelemelerden ayrı tutulur.
- İnceleme ve karşılaştırmalar sponsorlu olamaz; puanlar satın alınamaz.
- Reklam veren firmalar haber ve incelemelerimizin içeriğine karışamaz.

## Reklam vermek
Reklam ve iş birliği için [iletisim@updated.com.tr](mailto:iletisim@updated.com.tr) adresine yaz.`,
  },
]

const p = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({ config: p.config })
for (const s of SAYFALAR) {
  const var_ = await p.find({ collection: 'pages', where: { slug: { equals: s.slug } }, limit: 1, depth: 0, draft: true, overrideAccess: true })
  if (var_.docs[0]) { console.log(`${s.slug}: zaten var, dokunulmadı`); continue }
  await p.create({ collection: 'pages', draft: true, overrideAccess: true, data: { title: s.title, spot: s.spot, slug: s.slug, _status: 'draft', body: convertMarkdownToLexical({ editorConfig, markdown: s.md }) } as never })
  console.log(`${s.slug}: taslak olarak eklendi`)
}
process.exit(0)
