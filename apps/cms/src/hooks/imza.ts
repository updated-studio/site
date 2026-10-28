import type { CollectionBeforeChangeHook } from 'payload'

/**
 * İmza (28 Ekim 2026, kullanıcı onayı): otomatik hattan "Updated Stüdyo" imzasıyla gelen içerik bir editör tarafından
 * yayına alınınca imza o editörün yazar profiline geçer. Editör imzayı elle değiştirdiyse ya da içerik zaten yayındaysa dokunulmaz.
 */
let studyoId: number | string | null | undefined
export const imzaYayinlayana: CollectionBeforeChangeHook = async ({ data, originalDoc, req, operation }) => {
  if (operation !== 'update' || data._status !== 'published' || originalDoc?._status === 'published') return data
  const benim = (req.user as any)?.author
  const yazarId = benim && typeof benim === 'object' ? benim.id : benim
  if (!yazarId || (req.user as any)?.collection !== 'users') return data
  if (studyoId === undefined) {
    const r = await req.payload.find({ collection: 'authors', where: { slug: { equals: 'studyo' } }, limit: 1, depth: 0, req })
    studyoId = r.docs[0]?.id ?? null
  }
  const simdiki = data.author ?? originalDoc?.author
  const simdikiId = simdiki && typeof simdiki === 'object' ? simdiki.id : simdiki
  if (studyoId != null && String(simdikiId) === String(studyoId)) data.author = yazarId
  return data
}
