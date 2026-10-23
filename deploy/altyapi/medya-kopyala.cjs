// Panel görsellerini Supabase bulutundaki "media" kovasından Natro'daki Supabase'e kopyalar (S3 protokolü; var olan atlanır).
// Kullanım (sunucuda): NODE_PATH=/opt/updated/site/node_modules node medya-kopyala.cjs
// Ortam: KAYNAK_* (bulut), HEDEF_* (yerel) — panel-tasi.sh doldurur.
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')

const istemci = (p) => new S3Client({
  forcePathStyle: true, region: process.env[p + 'REGION'] || 'local', endpoint: process.env[p + 'ENDPOINT'],
  // Yeni SDK sürümleri yüklemeye varsayılan sağlama toplamı ekliyor; kendi sunucumuzdaki depolama bunu imzaya katmıyor
  requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  credentials: { accessKeyId: process.env[p + 'KEY'], secretAccessKey: process.env[p + 'SECRET'] },
})
const kaynak = istemci('KAYNAK_'), hedef = istemci('HEDEF_')
const KOVA = 'media'

async function deneme() {
  const { ListBucketsCommand } = require('@aws-sdk/client-s3')
  for (const [ad, c] of [['kaynak', kaynak], ['hedef', hedef]]) {
    try { const r = await c.send(new ListBucketsCommand({})); console.log(`${ad}: bağlandı (${(r.Buckets || []).map((b) => b.Name).join(', ')})`) }
    catch (e) { console.log(`${ad}: ${String(e.message || e).slice(0, 160)}`) }
  }
  try { await hedef.send(new PutObjectCommand({ Bucket: KOVA, Key: 'deneme/updated.txt', Body: Buffer.from('ok'), ContentType: 'text/plain' })); console.log('hedef: yazma tamam') }
  catch (e) { console.log('hedef yazma: ' + String(e.message || e).slice(0, 160)) }
}

async function main() {
  await deneme()
  let token, toplam = 0, kopya = 0, atla = 0, hata = 0, bayt = 0
  do {
    const r = await kaynak.send(new ListObjectsV2Command({ Bucket: KOVA, ContinuationToken: token, MaxKeys: 500 }))
    const liste = r.Contents || []
    for (let i = 0; i < liste.length; i += 8) {
      await Promise.all(liste.slice(i, i + 8).map(async (o) => {
        toplam++
        let asama = 'hedef-kontrol'
        try {
          const var_ = await hedef.send(new HeadObjectCommand({ Bucket: KOVA, Key: o.Key })).then((h) => h.ContentLength === o.Size).catch(() => false)
          if (var_) { atla++; return }
          asama = 'kaynak-okuma'
          const g = await kaynak.send(new GetObjectCommand({ Bucket: KOVA, Key: o.Key }))
          const govde = Buffer.from(await g.Body.transformToByteArray())
          asama = 'hedef-yazma'
          await hedef.send(new PutObjectCommand({ Bucket: KOVA, Key: o.Key, Body: govde, ContentType: g.ContentType, CacheControl: g.CacheControl || 'public, max-age=31536000' }))
          kopya++; bayt += govde.length
        } catch (e) { hata++; if (hata <= 5) console.log('hata [' + asama + ']:', o.Key, String(e.message || e).slice(0, 120)) }
      }))
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (token)
  console.log(`görseller: ${toplam} nesne · kopyalanan ${kopya} (${(bayt / 1048576).toFixed(1)} MB) · zaten var ${atla} · hata ${hata}`)
  if (hata) process.exit(1)
}
main().catch((e) => { console.log('hata:', e.message || e); process.exit(1) })
