// Stüdyo'nun dosyalarını (avatars, haber-gorsel, icerik ...) Supabase bulutundan Natro'daki Supabase'e kopyalar.
// Liste bulut veritabanından (storage.objects), içerik herkese açık adresten okunur, yerel depoya S3 ile yazılır. Var olan atlanır.
// Kullanım (sunucuda): NODE_PATH=/opt/updated/site/node_modules node studyo-dosya-kopyala.cjs
// Ortam: BULUT_DB (bağlantı metni), BULUT_URL, HEDEF_ENDPOINT/REGION/KEY/SECRET
const { Client } = require('pg')
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')

const hedef = new S3Client({
  forcePathStyle: true, region: process.env.HEDEF_REGION || 'local', endpoint: process.env.HEDEF_ENDPOINT,
  requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  credentials: { accessKeyId: process.env.HEDEF_KEY, secretAccessKey: process.env.HEDEF_SECRET },
})
const yol = (s) => s.split('/').map(encodeURIComponent).join('/')

async function main() {
  const db = new Client({ connectionString: process.env.BULUT_DB, ssl: { rejectUnauthorized: false } })
  await db.connect()
  const { rows } = await db.query(`select bucket_id, name, metadata->>'mimetype' as tur, (metadata->>'size')::bigint as boy
    from storage.objects where name not like '%/.emptyFolderPlaceholder' order by bucket_id, name`)
  await db.end()
  let kopya = 0, atla = 0, hata = 0, bayt = 0
  const ozet = {}
  for (let i = 0; i < rows.length; i += 8) {
    await Promise.all(rows.slice(i, i + 8).map(async (o) => {
      ozet[o.bucket_id] = (ozet[o.bucket_id] || 0) + 1
      try {
        const var_ = await hedef.send(new HeadObjectCommand({ Bucket: o.bucket_id, Key: o.name })).then((h) => !o.boy || h.ContentLength === Number(o.boy)).catch(() => false)
        if (var_) { atla++; return }
        const r = await fetch(`${process.env.BULUT_URL}/storage/v1/object/public/${o.bucket_id}/${yol(o.name)}`)
        if (!r.ok) throw new Error('indirilemedi ' + r.status)
        const govde = Buffer.from(await r.arrayBuffer())
        await hedef.send(new PutObjectCommand({ Bucket: o.bucket_id, Key: o.name, Body: govde, ContentType: o.tur || r.headers.get('content-type') || 'application/octet-stream', CacheControl: 'public, max-age=3600' }))
        kopya++; bayt += govde.length
      } catch (e) { hata++; if (hata <= 5) console.log('hata:', o.bucket_id + '/' + o.name, String(e.message || e).slice(0, 140)) }
    }))
  }
  console.log(`dosyalar: ${rows.length} (${Object.entries(ozet).map(([k, v]) => k + ' ' + v).join(', ')}) · kopyalanan ${kopya} (${(bayt / 1048576).toFixed(1)} MB) · zaten var ${atla} · hata ${hata}`)
  if (hata) process.exit(1)
}
main().catch((e) => { console.log('hata:', e.message || e); process.exit(1) })
