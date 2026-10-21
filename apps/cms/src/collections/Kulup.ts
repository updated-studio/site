import type { CollectionConfig } from 'payload'
import { editorsUp } from '../access/roles'
import { slugField } from '../fields/slug'

/**
 * UPDATED KULÜP — içerik veri olarak: yol → modül → adım. Simülatörler web uygulamasında kayıtlıdır (simulatorId).
 * Kullanıcı ilerlemesi (XP, rozet, görev teslimi) Supabase tablolarında: kulup_ilerleme, kulup_rozetler, kulup_teslimler (docs/kulup.md).
 */
export const KulupTracks: CollectionConfig = {
  slug: 'kulup-tracks',
  labels: { singular: 'Kulüp yolu', plural: 'Kulüp yolları' },
  admin: { useAsTitle: 'title', group: 'Kulüp' },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  fields: [
    { name: 'title', type: 'text', label: 'Yol', required: true },
    slugField(),
    { name: 'description', type: 'textarea', label: 'Açıklama' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Görsel' },
    { name: 'order', type: 'number', defaultValue: 1 },
    {
      name: 'modules', type: 'array', label: 'Modüller',
      fields: [
        { name: 'title', type: 'text', label: 'Modül', required: true },
        {
          name: 'steps', type: 'array', label: 'Adımlar',
          fields: [
            { type: 'row', fields: [
              { name: 'title', type: 'text', label: 'Adım', required: true },
              { name: 'kind', type: 'select', label: 'Tür', defaultValue: 'okuma', options: [{ label: 'Okuma', value: 'okuma' }, { label: 'Simülatör', value: 'simulator' }, { label: 'Alıştırma', value: 'alistirma' }, { label: 'Görev', value: 'gorev' }] },
              { name: 'minutes', type: 'number', label: 'Dakika' },
              { name: 'xp', type: 'number', label: 'XP', defaultValue: 20 },
            ] },
            { name: 'simulatorId', type: 'select', label: 'Simülatör', options: [{ label: 'Pozlama', value: 'expo' }, { label: '180° kuralı', value: 'shutter' }, { label: 'Dron uçuş planı', value: 'drone' }], admin: { condition: (_, s) => s?.kind === 'simulator' } },
            { name: 'quiz', type: 'relationship', relationTo: 'kulup-quizzes', admin: { condition: (_, s) => s?.kind === 'alistirma' } },
            { name: 'body', type: 'richText', label: 'Ders metni', admin: { condition: (_, s) => s?.kind === 'okuma' || s?.kind === 'gorev' } },
          ],
        },
      ],
    },
  ],
}

export const KulupQuizzes: CollectionConfig = {
  slug: 'kulup-quizzes',
  labels: { singular: 'Alıştırma', plural: 'Alıştırmalar' },
  admin: { useAsTitle: 'title', group: 'Kulüp' },
  access: { read: () => true, create: editorsUp, update: editorsUp, delete: editorsUp },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'questions', type: 'array', label: 'Sorular',
      fields: [
        { name: 'q', type: 'text', label: 'Soru', required: true },
        { name: 'options', type: 'text', hasMany: true, label: 'Seçenekler', required: true },
        { name: 'answer', type: 'number', label: 'Doğru seçenek (0’dan başlar)', required: true },
        { name: 'why', type: 'textarea', label: 'Açıklama' },
      ],
    },
  ],
}
