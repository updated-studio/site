import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import { tr } from '@payloadcms/translations/languages/tr'
import { en } from '@payloadcms/translations/languages/en'

import { Users } from './collections/Users'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { Reviews } from './collections/Reviews'
import { Comparisons } from './collections/Comparisons'
import { Products } from './collections/Products'
import { Videos, Reels, Ads } from './collections/Social'
import { KulupTracks, KulupQuizzes } from './collections/Kulup'
import { Yarismalar } from './collections/Yarismalar'
import { Gorevler, GorevFotolari, GorevGorselleri } from './collections/Gorev'
import { gorevZamanlayici } from './lib/gorev'
import { Pages } from './collections/Pages'
import { Uyeler, Yorumlar, UyeGiris } from './collections/Topluluk'
import { Site, Home } from './globals'
import { triyajDurum, triyajImport, triyajKapak, triyajTemizle } from './endpoints/triyajImport'
import { previewEndpoint } from './endpoints/preview'
import { studyoAlanlar, studyoDurum, studyoGiris, studyoOnizleme, studyoSema, studyoZamanla, studyoZamanlaEkle, studyoZamanlaSil } from './endpoints/studyo'
import { canliEndpoint } from './endpoints/canli'
import { okunmaEndpoints, okunmaInit } from './endpoints/okunma'
import { uyeEndpoints } from './endpoints/uye'
import { yarismaOneri } from './endpoints/yarisma'
import { toplulukTemizligi, yarismaZamanlayici } from './lib/uye'
import { icerikGelenKancasi } from './lib/icerikGelen'
import { zamanlamaTemizligi } from './hooks/zamanlamaTemizle'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Site (Natro), hazırlık (GitHub Pages) ve Stüdyo adresleri; EXTRA_ORIGINS virgülle ayrılır.
const origins = [process.env.WEB_URL, process.env.STUDIO_URL, ...(process.env.EXTRA_ORIGINS || '').split(',')].map((x) => x?.trim()).filter(Boolean) as string[]

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · UPDATED Panel', icons: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
    components: { graphics: { Logo: '/components/Logo#Logo', Icon: '/components/Logo#Icon' }, afterLogin: ['/components/StudyoGiris#StudyoGiris'] },
    dateFormat: 'dd.MM.yyyy HH.mm',
  },
  // Panel dili Türkçe (isteyen kullanıcı hesap ayarından İngilizceye geçebilir)
  i18n: { supportedLanguages: { tr, en }, fallbackLanguage: 'tr' },
  collections: [News, Reviews, Comparisons, Products, Categories, Authors, Media, Videos, Reels, Ads, KulupTracks, KulupQuizzes, Pages, Uyeler, Yorumlar, Yarismalar, Gorevler, GorevFotolari, GorevGorselleri, Users].map(zamanlamaTemizligi).map(toplulukTemizligi).map(icerikGelenKancasi),
  globals: [Home, Site, UyeGiris],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Supabase Postgres: Payload tabloları "payload" şemasında; Stüdyo'nun tablolarıyla karışmaz.
  // push: false — şema yalnız göç dosyalarıyla değişir (geliştirmede bile otomatik eşitleme yok; Supabase'deki diğer şemalara dokunulmaz)
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI }, schemaName: 'payload', push: false }),
  sharp,
  cors: origins,
  csrf: origins,
  // Zamanlanmış yayın (schedulePublish) için iş kuyruğu dakikada bir çalışır. Panel kalıcı Node sunucusunda çalışmalı.
  jobs: { autoRun: [{ cron: '* * * * *', queue: 'default', limit: 20 }], tasks: [] },
  endpoints: [triyajImport, triyajDurum, triyajKapak, triyajTemizle, previewEndpoint, canliEndpoint, studyoSema, studyoOnizleme, studyoAlanlar, studyoDurum, studyoGiris, studyoZamanla, studyoZamanlaEkle, studyoZamanlaSil, ...okunmaEndpoints, ...uyeEndpoints, yarismaOneri],
  onInit: async (p) => { await okunmaInit(p); yarismaZamanlayici(p); gorevZamanlayici(p) },
  plugins: [
    s3Storage({
      enabled: !!process.env.S3_BUCKET,
      collections: {
        media: { prefix: 'media', disablePayloadAccessControl: true, generateFileURL: ({ filename, prefix }) => `${process.env.MEDIA_PUBLIC_URL}/${prefix}/${filename}` },
        'gorev-gorselleri': { prefix: 'gorev', disablePayloadAccessControl: true, generateFileURL: ({ filename, prefix }) => `${process.env.MEDIA_PUBLIC_URL}/${prefix}/${filename}` },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        forcePathStyle: true,
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
        credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || '', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' },
      },
    }),
  ],
})
