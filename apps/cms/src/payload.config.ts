import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

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
import { Pages } from './collections/Pages'
import { Site, Home } from './globals'
import { triyajImport } from './endpoints/triyajImport'
import { previewEndpoint } from './endpoints/preview'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Site (Natro), hazırlık (GitHub Pages) ve Stüdyo adresleri; EXTRA_ORIGINS virgülle ayrılır.
const origins = [process.env.WEB_URL, process.env.STUDIO_URL, ...(process.env.EXTRA_ORIGINS || '').split(',')].map((x) => x?.trim()).filter(Boolean) as string[]

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · UPDATED Panel' },
    dateFormat: 'dd.MM.yyyy HH.mm',
  },
  i18n: { fallbackLanguage: 'en' },
  collections: [News, Reviews, Comparisons, Products, Categories, Authors, Media, Videos, Reels, Ads, KulupTracks, KulupQuizzes, Pages, Users],
  globals: [Home, Site],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Supabase Postgres: Payload tabloları "payload" şemasında; Stüdyo'nun tablolarıyla karışmaz.
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI }, schemaName: 'payload' }),
  sharp,
  cors: origins,
  csrf: origins,
  // Zamanlanmış yayın (schedulePublish) için iş kuyruğu dakikada bir çalışır. Panel kalıcı Node sunucusunda çalışmalı.
  jobs: { autoRun: [{ cron: '* * * * *', queue: 'default', limit: 20 }], tasks: [] },
  endpoints: [triyajImport, previewEndpoint],
  plugins: [
    s3Storage({
      enabled: !!process.env.S3_BUCKET,
      collections: { media: { prefix: 'media', generateFileURL: ({ filename, prefix }) => `${process.env.MEDIA_PUBLIC_URL}/${prefix}/${filename}` } },
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
