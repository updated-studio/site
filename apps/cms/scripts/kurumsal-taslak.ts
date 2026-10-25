// Eksik kurumsal sayfaları (Google News ve güven sinyalleri için) TASLAK olarak ekler; yayına almak ekibin kararı
// (Stüdyo → Site → Ayarlar → Sayfalar). Var olan sayfaya dokunmaz. Metinler sitedeki gerçek kurallardan (kontrol listesi, etiketler,
// düzeltme notu, puan kutusu, reklam kuralları) çıkarıldı; şirkete özgü sözler (süre, sorumlu kişi) ekip tarafından kontrol edilmeli.
// Kullanım: npx payload run scripts/kurumsal-taslak.ts  (metni yenilemek: GUNCELLE=1)
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'

const SAYFALAR: { slug: string; title: string; spot: string; md: string }[] = [
  {
    slug: 'yayin-ilkeleri', title: 'Yayın ilkeleri', spot: 'Teknolojiyi doğru, bağımsız ve anlaşılır anlatmak için uyduğumuz ilkeler.',
    md: `UPDATED, teknolojiyi doğru, bağımsız ve anlaşılır biçimde anlatmak için var. Her içeriğimizde şu ilkelere bağlıyız.

## Doğruluk
Haberlerimizi birincil kaynaklara dayandırır, kaynaklarımızı açıkça gösteririz. Her içerik yayından önce editörlerimizin kontrolünden geçer.

## Sızıntı ve iddialar
Resmî olarak doğrulanmamış bilgileri "Sızıntı" etiketiyle yayınlar, kesinleşmiş bilgiden açıkça ayırırız.

## Teknoloji ile çalışırız
Editörlerimiz, haber takibi ve araştırmada kendi geliştirdiğimiz yapay zekâ destekli araçlarla çalışır. Her içerik yayından önce editörlerimizin kontrolünden ve onayından geçer; sorumluluğu UPDATED'a aittir.

## Bağımsızlık
Haber ve incelemelerimize hiçbir firma karışamaz. Reklam ve sponsorlu içerik editoryal içerikten açıkça ayrılır: [Reklam ve sponsorluk](/reklam).

## Düzeltmeler
Hata yaparsak açıkça düzeltiriz: [Düzeltme politikası](/duzeltme-politikasi).

## İletişim
Görüş ve itirazların için: [iletisim@updated.com.tr](mailto:iletisim@updated.com.tr)`,
  },
  {
    slug: 'duzeltme-politikasi', title: 'Düzeltme politikası', spot: 'Hata yaparsak açıkça düzeltiriz.',
    md: `Doğru bilgi önceliğimizdir. Yayınladığımız bir içerikte hata tespit ettiğimizde ya da bize bildirildiğinde içeriği düzeltir, önemli düzeltmeleri içeriğin sonunda bir notla belirtiriz.

## Hata bildirmek
Bir hata gördüysen içeriğin bağlantısıyla birlikte [iletisim@updated.com.tr](mailto:iletisim@updated.com.tr) adresine yaz. Her bildirimi inceleriz.`,
  },
  {
    slug: 'test-yontemimiz', title: 'Test yöntemimiz', spot: 'Ürünleri gerçek kullanımda, bağımsız olarak değerlendiririz.',
    md: `İncelemelerimizin amacı tek: "Bu ürünü almalı mıyım?" sorusuna dürüst ve kullanarak verilmiş bir cevap.

## Gerçek kullanım
Ürünleri günlük kullanımda, gerçek koşullarda test ederiz. Değerlendirmede Türkiye'deki fiyat ve satış koşullarını da göz önünde tutarız.

## Bağımsızlık
Ürünü sağlayan firma incelemeyi yayından önce görmez ve içeriğine karışamaz. Puanlarımız satın alınamaz.

## Puan
İncelemelerimizi 20 üzerinden puanlarız; artılar, eksiler ve ürünün kime uygun olduğu yazının sonunda yer alır.`,
  },
  {
    slug: 'reklam', title: 'Reklam ve sponsorluk', spot: 'Reklam ve sponsorlu içerik editoryal içerikten açıkça ayrılır.',
    md: `UPDATED bağımsız bir yayındır. Okurun neyin reklam olduğunu her zaman bilmesini isteriz.

- Reklam alanları "Reklam" olarak işaretlenir.
- Ücret karşılığı hazırlanan içerikler "Sponsorlu" etiketiyle yayınlanır.
- Reklam veren firmalar haber ve incelemelerimizin içeriğine karışamaz.

## Reklam ve iş birliği
[iletisim@updated.com.tr](mailto:iletisim@updated.com.tr)`,
  },
]

const GUNCELLE = process.argv.includes('--guncelle') || process.env.GUNCELLE === '1' // yalnız hâlâ taslak olan sayfanın metnini yeniler

const p = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({ config: p.config })
for (const s of SAYFALAR) {
  const var_ = await p.find({ collection: 'pages', where: { slug: { equals: s.slug } }, limit: 1, depth: 0, draft: true, overrideAccess: true })
  const d = var_.docs[0] as any
  if (d && GUNCELLE && d._status === 'draft') {
    await p.update({ collection: 'pages', id: d.id, draft: true, overrideAccess: true, data: { title: s.title, spot: s.spot, body: convertMarkdownToLexical({ editorConfig, markdown: s.md }) } as never })
    console.log(`${s.slug}: taslak metni yenilendi`); continue
  }
  if (d) { console.log(`${s.slug}: zaten var, dokunulmadı`); continue }
  await p.create({ collection: 'pages', draft: true, overrideAccess: true, data: { title: s.title, spot: s.spot, slug: s.slug, _status: 'draft', body: convertMarkdownToLexical({ editorConfig, markdown: s.md }) } as never })
  console.log(`${s.slug}: taslak olarak eklendi`)
}
process.exit(0)
