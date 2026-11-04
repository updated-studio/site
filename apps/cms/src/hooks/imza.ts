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

/** Yazar kilidi (4 Kasım 2026, kullanıcı: "başkasının adına haber girilemesin, bunu yalnız yöneticiler değiştirebilsin"):
 *  yönetici olmayan kullanıcı yazarı başka birine çeviremez. Yeni kayıtta yazar boşsa kaydedenin yazar profili olur; "Hazırlayan" da boşsa
 *  kaydeden hesap olur. Mevcut kaydın yazarı (Updated Stüdyo dışında) korunur; Stüdyo imzalı otomatik taslak kaydedene geçer. */
export const yazarKilidi: CollectionBeforeChangeHook = async ({ data, originalDoc, req, operation, context }) => {
  const u = req.user as any
  if (context?.migration || !u || u.collection !== 'users') return data
  const benim = u.author && typeof u.author === 'object' ? u.author.id : u.author
  const id = (v: any) => (v && typeof v === 'object' ? v.id : v)
  data.workflow ||= {}
  if (!data.workflow.ownerUser && !originalDoc?.workflow?.ownerUser) data.workflow.ownerUser = u.id
  if (u.role === 'admin') { if (operation === 'create' && !data.author && benim) data.author = benim; return data }
  if (studyoId === undefined) {
    const r = await req.payload.find({ collection: 'authors', where: { slug: { equals: 'studyo' } }, limit: 1, depth: 0, req })
    studyoId = r.docs[0]?.id ?? null
  }
  const onceki = id(originalDoc?.author)
  const korunur = onceki != null && String(onceki) !== String(studyoId)
  if (korunur) data.author = onceki
  else if (benim) data.author = benim
  return data
}
