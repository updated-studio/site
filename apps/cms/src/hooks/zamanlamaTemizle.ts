import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload'

/** Silinen kaydın bekleyen zamanlanmış yayınları da silinir (yoksa saat gelince iş, olmayan kayıt yüzünden hata verir). */
const temizle: CollectionAfterDeleteHook = async ({ collection, id, req }) => {
  await req.payload.delete({
    collection: 'payload-jobs', overrideAccess: true, req,
    where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }, { 'input.doc.relationTo': { equals: collection.slug } }, { 'input.doc.value': { equals: String(id) } }] } as any,
  })
}

/** Taslaklı (zamanlanabilir) koleksiyonlara silme temizliğini ekler */
export const zamanlamaTemizligi = (c: CollectionConfig): CollectionConfig =>
  typeof c.versions === 'object' && c.versions.drafts ? { ...c, hooks: { ...c.hooks, afterDelete: [...(c.hooks?.afterDelete ?? []), temizle] } } : c
