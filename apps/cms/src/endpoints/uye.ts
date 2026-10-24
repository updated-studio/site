import { headersWithCors, type Endpoint, type Payload, type PayloadRequest } from 'payload'
import {
  PUAN, SEVIYELER, anahtarCoz, bildirimEkle, ekibeHaberVer, ekipMi, girisYonetim, havuz, hedefBul, hizSiniri, ipOzet, onayNedeni,
  puanEkle, SAYFA_ON, sayfaTemizle, seviye, yanitBildir, type Kimlik,
} from '../lib/uye'

/**
 * Sitenin okur uçları (/api/uye/*). Okur isteğe "Authorization: Uper <giriş servisinin anahtarı>" ekler (scripts/uye.ts).
 * Payload'un kendi kullanıcı sistemi kullanılmaz: koleksiyonlara overrideAccess ile yalnız burada, kurallarıyla yazılır.
 */
type Uye = {
  id: number; authId: string; email: string; kullaniciAdi: string; ad: string; bio?: string | null; renk?: string | null; durum: string
  guvenilir?: boolean | null; ekip?: boolean | null; puan?: number | null; bildirimEposta?: boolean | null; giris?: string | null
  ekipman?: { tur?: string | null; ad: string; urun?: number | { id: number; title?: string; slug?: string } | null }[] | null
  unvan?: string | null; createdAt: string; sonGiris?: string | null; onaylar?: { sozlesme?: string | null; kvkk?: string | null } | null
}
type Ctx = { req: PayloadRequest; p: Payload; kimlik: Kimlik | null; uye: Uye | null }

const yanit = (req: PayloadRequest, govde: unknown, status = 200) =>
  new Response(JSON.stringify(govde), { status, headers: headersWithCors({ headers: new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }), req }) })
const hata = (req: PayloadRequest, mesaj: string, status = 400) => yanit(req, { hata: mesaj }, status)
const govde = async (req: PayloadRequest): Promise<Record<string, any>> => {
  try { const t = await req.text?.(); if (!t || t.length > 60_000) return {}; const o = JSON.parse(t); return o && typeof o === 'object' ? o : {} } catch { return {} }
}

async function baglam(req: PayloadRequest): Promise<Ctx> {
  const m = /^Uper\s+([A-Za-z0-9._-]+)$/.exec(req.headers.get('authorization') || '')
  const kimlik = m ? anahtarCoz(m[1]) : null
  let uye: Uye | null = null
  if (kimlik) {
    const r = await req.payload.find({ collection: 'uyeler', where: { authId: { equals: kimlik.sub } }, limit: 1, depth: 0, overrideAccess: true })
    uye = (r.docs[0] as unknown as Uye) ?? null
    if (uye && (!uye.sonGiris || Date.now() - +new Date(uye.sonGiris) > 3600_000)) {
      havuz(req.payload).query('update payload.uyeler set son_giris = now() where id=$1', [uye.id]).catch(() => {})
    }
  }
  return { req, p: req.payload, kimlik, uye }
}

type Isleyici = (c: Ctx) => Promise<Response>
/** gerek: 'kimlik' = giriş yapmış (profil şart değil), 'uye' = profili olan, 'yazabilir' = susturulmamış */
const uc = (path: string, method: Endpoint['method'], gerek: 'yok' | 'kimlik' | 'uye' | 'yazabilir', f: Isleyici): Endpoint => ({
  path, method,
  handler: async (req) => {
    try {
      const c = await baglam(req)
      if (gerek !== 'yok' && !c.kimlik) return hata(req, 'Oturumun kapanmış. Yeniden giriş yap.', 401)
      if (c.uye?.durum === 'engelli') return hata(req, 'Hesabın engellendi.', 403)
      if ((gerek === 'uye' || gerek === 'yazabilir') && !c.uye) return hata(req, 'Önce profilini tamamla.', 409)
      if (gerek === 'yazabilir' && c.uye!.durum === 'susturuldu') return hata(req, 'Hesabın şimdilik yorum ve tepki veremiyor (topluluk kuralları).', 403)
      return await f(c)
    } catch (e) {
      req.payload.logger.error(`uye ${path}: ${e}`)
      return hata(req, 'Bir sorun oldu, birazdan yeniden dene.', 500)
    }
  },
})

/* ---------------- yardımcılar ---------------- */
const ADI = /^[a-z0-9_.]{3,20}$/
const AYRILMIS = new Set(['admin', 'yonetici', 'updated', 'editor', 'editör', 'ekip', 'moderator', 'mod', 'destek', 'uper', 'upers', 'root', 'sistem', 'kulup', 'hesap', 'yardim'])
const temizMetin = (s: unknown, n: number) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, n)
/** Ekip üyesinin güncel rolü Stüdyo'dan (onay işareti: yönetici altın, diğer ekip mavi); 10 dk bellekte */
type EkipRol = 'yonetici' | 'ekip' | false
const ROL_ON = new Map<string, { r: EkipRol; t: number }>()
async function ekipRol(p: Payload, u: Pick<Uye, 'email' | 'ekip'>): Promise<EkipRol> {
  if (!u.email) return false
  const o = ROL_ON.get(u.email)
  if (o && Date.now() - o.t < 600_000) return o.r
  const q = await havuz(p).query('select site_rol from public.site_uyesi($1)', [u.email]).catch(() => null)
  const r: EkipRol = !q ? (u.ekip ? 'ekip' : false) : !q.rows.length ? false : q.rows[0].site_rol === 'admin' ? 'yonetici' : 'ekip'
  if (ROL_ON.size > 2000) ROL_ON.clear()
  ROL_ON.set(u.email, { r, t: Date.now() })
  return r
}
const herkeseAcik = (u: Pick<Uye, 'kullaniciAdi' | 'ad' | 'renk' | 'puan' | 'unvan'>, rol: EkipRol) => ({ kullaniciAdi: u.kullaniciAdi, ad: u.ad, renk: u.renk || 'turuncu', seviye: seviye(Number(u.puan) || 0), ekip: rol, unvan: u.unvan || null })

async function adOner(p: Payload, email: string) {
  let kok = email.split('@')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9_.]/g, '').slice(0, 16)
  if (kok.length < 3) kok = 'uper'
  for (let i = 0; i < 20; i++) {
    const ad = i === 0 && !AYRILMIS.has(kok) ? kok : `${kok}${Math.floor(100 + Math.random() * 9900)}`
    const r = await p.count({ collection: 'uyeler', where: { kullaniciAdi: { equals: ad } }, overrideAccess: true })
    if (!r.totalDocs) return ad
  }
  return `uper${Date.now().toString(36)}`
}
async function adUygunMu(p: Payload, ad: string, haric?: number) {
  if (!ADI.test(ad)) return 'Kullanıcı adı 3-20 karakter olmalı; küçük harf, rakam, alt çizgi ve nokta kullanılabilir.'
  if (AYRILMIS.has(ad)) return 'Bu kullanıcı adı ayrılmış, başka bir ad seç.'
  const r = await p.find({ collection: 'uyeler', where: { kullaniciAdi: { equals: ad } }, limit: 1, depth: 0, overrideAccess: true })
  if (r.docs[0] && r.docs[0].id !== haric) return 'Bu kullanıcı adı alınmış.'
  return null
}

function rozetler(u: Uye, s: { yorum: number; begeni: number; kulup: number }) {
  const r: { kod: string; ad: string }[] = []
  if (u.unvan) r.push({ kod: 'kurucu', ad: u.unvan === 'kurucu' ? 'Kurucu' : 'Kurucu ortak' })
  if (u.ekip) r.push({ kod: 'ekip', ad: 'Updated ekibi' })
  if (+new Date(u.createdAt) < +new Date('2027-01-01')) r.push({ kod: 'ilk', ad: "İlk Uper'lerden" })
  if (s.yorum >= 1) r.push({ kod: 'ilk-yorum', ad: 'İlk yorum' })
  if (s.yorum >= 25) r.push({ kod: 'sohbet', ad: 'Sohbetin içinde (25 yorum)' })
  if (s.begeni >= 50) r.push({ kod: 'begenilen', ad: 'Beğenilen (50 beğeni)' })
  if (s.kulup >= 5) r.push({ kod: 'kulup', ad: 'Kulüp öğrencisi (5 adım)' })
  return r
}
async function istatistik(p: Payload, uyeId: number) {
  const db = havuz(p)
  const [y, b, k] = await Promise.all([
    p.count({ collection: 'yorumlar', where: { and: [{ uye: { equals: uyeId } }, { durum: { equals: 'yayinda' } }] }, overrideAccess: true }),
    db.query(`select coalesce(sum(begeni),0)::int as t from payload.yorumlar where uye_id = $1 and durum = 'yayinda'`, [uyeId]),
    db.query(`select count(*)::int as t from payload.uye_puan where uye_id=$1 and tur='kulup'`, [uyeId]),
  ])
  return { yorum: y.totalDocs, begeni: b.rows[0].t, kulup: k.rows[0].t }
}
const benimProfil = async (p: Payload, u: Uye) => {
  const s = await istatistik(p, u.id), rol = await ekipRol(p, u)
  return {
    kayitli: true, id: u.id, kullaniciAdi: u.kullaniciAdi, ad: u.ad, bio: u.bio || '', renk: u.renk || 'turuncu', email: u.email, giris: u.giris,
    ekipman: (u.ekipman || []).map((e) => ({ tur: e.tur, ad: e.ad, urun: typeof e.urun === 'object' ? e.urun?.id : e.urun })),
    bildirimEposta: u.bildirimEposta !== false, durum: u.durum, ekip: rol, unvan: u.unvan || null, seviye: seviye(Number(u.puan) || 0), istatistik: s, rozetler: rozetler(u, s), uyelik: u.createdAt,
  }
}
const yorumSahibi = (y: any) => (typeof y.uye === 'object' ? y.uye?.id : y.uye) as number | undefined
const hedefDegeri = (y: any) => (typeof y.hedef?.value === 'object' ? y.hedef.value.id : y.hedef?.value) as number

/* ---------------- uçlar ---------------- */
export const uyeEndpoints: Endpoint[] = [
  // Sitenin giriş ekranı ayarı: hangi giriş yolları açık, puan kuralları, seviyeler
  uc('/uye/ayar', 'get', 'yok', async ({ req }) => yanit(req, {
    google: process.env.UYE_GOOGLE === '1', turnstile: process.env.UYE_TURNSTILE_SITE || null, auth: `${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://panel.updated.com.tr'}/uye/v1`,
    puan: Object.entries(PUAN).map(([k, v]) => ({ kod: k, ad: v.ad, puan: v.puan, gunluk: v.gunluk })), seviyeler: SEVIYELER,
  })),

  uc('/uye/ben', 'get', 'kimlik', async ({ req, p, kimlik, uye }) => {
    if (uye) return yanit(req, await benimProfil(p, uye))
    const m = kimlik!.meta as Record<string, unknown>
    return yanit(req, { kayitli: false, email: kimlik!.email, oneri: { kullaniciAdi: await adOner(p, kimlik!.email), ad: String(m.ad || m.full_name || m.name || '').slice(0, 40) } })
  }),

  // Profil oluşturma: kullanıcı adı + iki onay (üyelik sözleşmesi, aydınlatma metni)
  uc('/uye/ben', 'post', 'kimlik', async ({ req, p, kimlik, uye }) => {
    if (uye) return yanit(req, await benimProfil(p, uye))
    const b = await govde(req)
    if (b.sozlesme !== true || b.kvkk !== true) return hata(req, 'Üyelik sözleşmesini ve aydınlatma metnini onaylaman gerekiyor.')
    const ad = temizMetin(b.ad, 40), kAdi = String(b.kullaniciAdi || '').trim().toLowerCase()
    if (ad.length < 2) return hata(req, 'Görünen adın en az 2 karakter olmalı.')
    const sorun = await adUygunMu(p, kAdi)
    if (sorun) return hata(req, sorun)
    const simdi = new Date().toISOString()
    const yeni = await p.create({
      collection: 'uyeler', overrideAccess: true, context: { uyeIslemi: true },
      data: { authId: kimlik!.sub, email: kimlik!.email, kullaniciAdi: kAdi, ad, giris: kimlik!.provider === 'google' ? 'google' : 'email', ekip: await ekipMi(p, kimlik!.email), onaylar: { sozlesme: simdi, kvkk: simdi }, sonGiris: simdi } as never,
    }).catch(async (e) => {
      const tekrar = await p.find({ collection: 'uyeler', where: { authId: { equals: kimlik!.sub } }, limit: 1, depth: 0, overrideAccess: true })
      if (tekrar.docs[0]) return tekrar.docs[0]
      throw e
    }) as unknown as Uye
    await puanEkle(p, yeni.id, 'hosgeldin', 'hosgeldin')
    await bildirimEkle(p, yeni.id, 'hosgeldin', "UPDATED'a hoş geldin! Yorum yaptıkça ve okudukça puan kazanıp seviye atlarsın.", '/hesap#puan')
    const tazesi = await p.findByID({ collection: 'uyeler', id: yeni.id, depth: 0, overrideAccess: true }) as unknown as Uye
    return yanit(req, await benimProfil(p, tazesi), 201)
  }),

  uc('/uye/ben', 'patch', 'uye', async ({ req, p, uye }) => {
    const b = await govde(req), data: Record<string, unknown> = {}
    if (b.ad !== undefined) { const ad = temizMetin(b.ad, 40); if (ad.length < 2) return hata(req, 'Görünen adın en az 2 karakter olmalı.'); data.ad = ad }
    if (b.kullaniciAdi !== undefined) {
      const k = String(b.kullaniciAdi).trim().toLowerCase()
      if (k !== uye!.kullaniciAdi) { const s = await adUygunMu(p, k, uye!.id); if (s) return hata(req, s); data.kullaniciAdi = k }
    }
    if (b.bio !== undefined) data.bio = temizMetin(b.bio, 160)
    if (b.renk !== undefined && ['turuncu', 'mavi', 'siyah', 'gri'].includes(b.renk)) data.renk = b.renk
    if (b.bildirimEposta !== undefined) data.bildirimEposta = !!b.bildirimEposta
    if (Array.isArray(b.ekipman)) {
      const TUR = ['Kamera', 'Lens', 'Gimbal', 'Dron', 'Işık', 'Ses', 'Telefon', 'Bilgisayar', 'Diğer']
      data.ekipman = b.ekipman.slice(0, 12).map((e: any) => ({ tur: TUR.includes(e?.tur) ? e.tur : 'Diğer', ad: temizMetin(e?.ad, 60), urun: Number.isInteger(e?.urun) ? e.urun : null })).filter((e: any) => e.ad)
    }
    const k = onayNedeni(`${data.ad ?? ''} ${data.bio ?? ''} ${data.kullaniciAdi ?? ''}`, true)
    if (k === 'Uygunsuz kelime') return hata(req, 'Profilinde topluluk kurallarına uymayan bir ifade var.')
    const u = await p.update({ collection: 'uyeler', id: uye!.id, data: data as never, overrideAccess: true, context: { uyeIslemi: true } }).catch((e) => { throw e }) as unknown as Uye
    if (u.bio && (u.ekipman || []).length) await puanEkle(p, u.id, 'profil', 'profil')
    const tazesi = await p.findByID({ collection: 'uyeler', id: u.id, depth: 0, overrideAccess: true }) as unknown as Uye
    return yanit(req, await benimProfil(p, tazesi))
  }),

  // Hesabı silme (KVKK): yanıt almış yorumlar "silindi" olarak kalır (konuşma bozulmasın), diğerleri silinir; hesap giriş servisinden de silinir.
  uc('/uye/ben', 'delete', 'kimlik', async ({ req, p, kimlik, uye }) => {
    const b = await govde(req)
    if (b.onay !== 'SİL') return hata(req, 'Onay için SİL yaz.')
    if (uye) {
      const db = havuz(p)
      const yorumlar = await p.find({ collection: 'yorumlar', where: { uye: { equals: uye.id } }, limit: 5000, depth: 0, overrideAccess: true })
      for (const y of yorumlar.docs as { id: number }[]) {
        const yanitVar = await p.count({ collection: 'yorumlar', where: { or: [{ ust: { equals: y.id } }, { yanitlanan: { equals: y.id } }] }, overrideAccess: true })
        if (yanitVar.totalDocs) await p.update({ collection: 'yorumlar', id: y.id, data: { metin: 'Bu yorum silindi.', durum: 'silindi', uye: null } as never, overrideAccess: true, context: { uyeIslemi: true } })
        else await p.delete({ collection: 'yorumlar', id: y.id, overrideAccess: true, context: { uyeIslemi: true } })
      }
      const begendikleri = await db.query('select yorum_id from payload.yorum_begeni where uye_id=$1', [uye.id])
      await p.delete({ collection: 'uyeler', id: uye.id, overrideAccess: true, context: { uyeIslemi: true } })
      const idler = begendikleri.rows.map((r) => r.yorum_id)
      if (idler.length) await db.query('update payload.yorumlar y set begeni = (select count(*) from payload.yorum_begeni b where b.yorum_id = y.id) where y.id = any($1::int[])', [idler])
    }
    await girisYonetim(`/admin/users/${encodeURIComponent(kimlik!.sub)}`, 'DELETE')
    SAYFA_ON.clear()
    return yanit(req, { silindi: true })
  }),

  // Verilerimi indir (KVKK): profil, yorumlar, tepkiler, kayıtlar, bildirimler, puan geçmişi, Kulüp ilerlemesi
  uc('/uye/ben/veri', 'get', 'uye', async ({ req, p, uye }) => {
    const db = havuz(p), id = uye!.id
    const [y, t, k, bl, pu, ku] = await Promise.all([
      p.find({ collection: 'yorumlar', where: { uye: { equals: id } }, limit: 5000, depth: 0, overrideAccess: true }),
      db.query('select hedef, tur, at from payload.uye_tepki where uye_id=$1', [id]),
      db.query('select hedef, at from payload.uye_kayit where uye_id=$1', [id]),
      db.query('select tur, metin, yol, okundu, at from payload.uye_bildirim where uye_id=$1 order by at desc', [id]),
      db.query('select tur, puan, ref, at from payload.uye_puan where uye_id=$1 order by at', [id]),
      db.query('select durum, at from payload.uye_kulup where uye_id=$1', [id]),
    ])
    const { authId: _a, ...profil } = uye as Uye & Record<string, unknown>
    return yanit(req, {
      aciklama: 'UPDATED hesabındaki bütün veriler (KVKK md. 11).', tarih: new Date().toISOString(), profil,
      yorumlar: y.docs.map((x: any) => ({ metin: x.metin, durum: x.durum, yol: x.yol, at: x.createdAt })), tepkiler: t.rows, kaydedilenler: k.rows, bildirimler: bl.rows, puan: pu.rows, kulup: ku.rows[0] ?? null,
    })
  }),

  uc('/uye/kullanici-adi', 'get', 'kimlik', async ({ req, p, uye }) => {
    const ad = String(new URL(req.url || '', 'http://x').searchParams.get('ad') || '').trim().toLowerCase()
    const s = ad === uye?.kullaniciAdi ? null : await adUygunMu(p, ad, uye?.id)
    return yanit(req, { uygun: !s, mesaj: s })
  }),

  // Herkese açık profil
  uc('/uye/profil', 'get', 'yok', async ({ req, p }) => {
    const ad = String(new URL(req.url || '', 'http://x').searchParams.get('ad') || '').trim().toLowerCase()
    if (!ADI.test(ad)) return hata(req, 'Uper bulunamadı.', 404)
    const r = await p.find({ collection: 'uyeler', where: { kullaniciAdi: { equals: ad } }, limit: 1, depth: 1, overrideAccess: true })
    const u = r.docs[0] as unknown as Uye | undefined
    if (!u || u.durum === 'engelli') return hata(req, 'Uper bulunamadı.', 404)
    const s = await istatistik(p, u.id)
    const son = await p.find({ collection: 'yorumlar', where: { and: [{ uye: { equals: u.id } }, { durum: { equals: 'yayinda' } }] }, sort: '-createdAt', limit: 10, depth: 0, overrideAccess: true })
    const basliklar = await Promise.all(son.docs.map((y: any) => hedefBul(p, `${y.hedef?.relationTo}:${hedefDegeri(y)}`)))
    return yanit(req, {
      ...herkeseAcik(u, await ekipRol(p, u)), bio: u.bio || '', uyelik: u.createdAt, istatistik: s, rozetler: rozetler(u, s),
      ekipman: (u.ekipman || []).map((e) => ({ tur: e.tur, ad: e.ad, urun: typeof e.urun === 'object' && e.urun ? { ad: e.urun.title, yol: e.urun.slug ? `/urun/${e.urun.slug}` : null } : null })),
      yorumlar: son.docs.map((y: any, i) => ({ id: y.id, metin: y.metin.slice(0, 280), at: y.createdAt, yol: y.yol, baslik: basliklar[i]?.baslik || '' })),
    })
  }),

  // Bir yazının topluluk bölümü: tepki sayıları, benim tepkim/kaydım, yorumlar (konu başı + yanıtlar)
  uc('/uye/sayfa', 'get', 'yok', async ({ req, p, uye }) => {
    const q = new URL(req.url || '', 'http://x').searchParams
    const h = await hedefBul(p, q.get('hedef') || '')
    if (!h) return hata(req, 'Yazı bulunamadı.', 404)
    const onKey = `${h.anahtar}|${q.get('sira') === 'begeni' ? 'b' : 'y'}`
    if (!uye) { const o = SAYFA_ON.get(onKey); if (o && Date.now() - o.t < 30_000) return yanit(req, { ...(o.govde as object), profilYok: !!req.headers.get('authorization') }) }
    const db = havuz(p)
    const [tep, yr] = await Promise.all([
      db.query('select tur, count(*)::int as n from payload.uye_tepki where hedef=$1 group by tur', [h.anahtar]),
      p.find({ collection: 'yorumlar', where: { and: [{ 'hedef.relationTo': { equals: h.tur } }, { 'hedef.value': { equals: h.id } }, { durum: { in: ['yayinda', 'onay-bekliyor', 'silindi'] } }] }, limit: 1000, depth: 0, sort: 'createdAt', overrideAccess: true }),
    ])
    const tum = (yr.docs as any[]).filter((y) => y.durum !== 'onay-bekliyor' || (uye && yorumSahibi(y) === uye.id))
    const uyeIdler = [...new Set(tum.map(yorumSahibi).filter(Boolean))] as number[]
    const uyeler = uyeIdler.length ? (await p.find({ collection: 'uyeler', where: { id: { in: uyeIdler } }, limit: uyeIdler.length, depth: 0, overrideAccess: true })).docs as unknown as Uye[] : []
    const uyeMap = new Map(uyeler.map((u) => [u.id, u]))
    const rolMap = new Map(await Promise.all(uyeler.map(async (u) => [u.id, await ekipRol(p, u)] as const)))
    let begendiklerim = new Set<number>(), benim: { tepki: string | null; kayitli: boolean } = { tepki: null, kayitli: false }
    if (uye) {
      const [b, t, k] = await Promise.all([
        tum.length ? db.query('select yorum_id from payload.yorum_begeni where uye_id=$1 and yorum_id = any($2::int[])', [uye.id, tum.map((y) => y.id)]) : Promise.resolve({ rows: [] }),
        db.query('select tur from payload.uye_tepki where uye_id=$1 and hedef=$2', [uye.id, h.anahtar]),
        db.query('select 1 from payload.uye_kayit where uye_id=$1 and hedef=$2', [uye.id, h.anahtar]),
      ])
      begendiklerim = new Set(b.rows.map((r: any) => r.yorum_id))
      benim = { tepki: t.rows[0]?.tur ?? null, kayitli: k.rows.length > 0 }
    }
    const bicim = (y: any) => {
      const u = uyeMap.get(yorumSahibi(y)!)
      const silindi = y.durum === 'silindi' || !u || u.durum === 'engelli'
      return {
        id: y.id, metin: silindi ? 'Bu yorum silindi.' : y.metin, at: y.createdAt, duzenlendi: y.duzenlendi || null, begeni: y.begeni || 0,
        begendim: begendiklerim.has(y.id), benim: !!(uye && u && u.id === uye.id), onayda: y.durum === 'onay-bekliyor', silindi,
        uye: silindi ? null : herkeseAcik(u!, rolMap.get(u!.id) ?? false), yanitlanan: typeof y.yanitlanan === 'object' ? y.yanitlanan?.id : y.yanitlanan ?? null,
      }
    }
    const ustId = (y: any) => (typeof y.ust === 'object' ? y.ust?.id : y.ust) as number | null
    const yanitlar = new Map<number, any[]>()
    for (const y of tum) { const u = ustId(y); if (u) yanitlar.set(u, [...(yanitlar.get(u) || []), y]) }
    const ad = new Map(tum.map((y) => [y.id, uyeMap.get(yorumSahibi(y)!)?.ad || null]))
    let konular = tum.filter((y) => !ustId(y)).map((y) => {
      const alt = (yanitlar.get(y.id) || []).filter((z) => z.durum !== 'silindi').map((z) => ({ ...bicim(z), yanitlananAd: z.yanitlanan && z.yanitlanan !== y.id ? ad.get(typeof z.yanitlanan === 'object' ? z.yanitlanan.id : z.yanitlanan) : null }))
      return { ...bicim(y), yanitlar: alt }
    }).filter((k) => !k.silindi || k.yanitlar.length)
    if (q.get('sira') === 'begeni') konular = konular.sort((a, b) => b.begeni - a.begeni || +new Date(b.at) - +new Date(a.at))
    else konular = konular.reverse()
    const sayi = konular.reduce((t, k) => t + (k.silindi ? 0 : 1) + k.yanitlar.length, 0)
    const govdeS = { hedef: h.anahtar, yol: h.yol, tepkiler: Object.fromEntries(tep.rows.map((r: any) => [r.tur, r.n])), benim, yorumSayisi: sayi, yorumlar: konular, girisli: !!uye }
    if (!uye) { if (SAYFA_ON.size > 3000) SAYFA_ON.clear(); SAYFA_ON.set(onKey, { t: Date.now(), govde: govdeS }) }
    return yanit(req, { ...govdeS, profilYok: !uye && !!req.headers.get('authorization') })
  }),

  // Yorum yaz
  uc('/uye/yorum', 'post', 'yazabilir', async ({ req, p, uye }) => {
    const b = await govde(req)
    const h = await hedefBul(p, String(b.hedef || ''))
    if (!h) return hata(req, 'Yazı bulunamadı.', 404)
    const metin = temizMetin(b.metin, 2000)
    if (metin.length < 2) return hata(req, 'Yorum boş olamaz.')
    if (!hizSiniri(`yorum:${uye!.id}`, 1, 15_000)) return hata(req, 'Biraz yavaş: iki yorum arasında 15 saniye beklemelisin.', 429)
    if (!hizSiniri(`yorum-gun:${uye!.id}`, 40, 86_400_000) || !hizSiniri(`yorum-ip:${ipOzet(req)}`, 60, 3_600_000)) return hata(req, 'Bugün için yorum sınırına ulaştın.', 429)
    let ust: any = null, yanitlanan: any = null
    if (b.ust) {
      yanitlanan = await p.findByID({ collection: 'yorumlar', id: Number(b.ust), depth: 0, overrideAccess: true, disableErrors: true }).catch(() => null)
      if (!yanitlanan || hedefDegeri(yanitlanan) !== h.id || yanitlanan.hedef?.relationTo !== h.tur || !['yayinda', 'silindi'].includes(yanitlanan.durum)) return hata(req, 'Yanıt verdiğin yorum bulunamadı.', 404)
      const kok = typeof yanitlanan.ust === 'object' ? yanitlanan.ust?.id : yanitlanan.ust
      ust = kok || yanitlanan.id
    }
    const son = await p.find({ collection: 'yorumlar', where: { and: [{ uye: { equals: uye!.id } }, { metin: { equals: metin } }] }, limit: 1, depth: 0, overrideAccess: true })
    if (son.docs[0]) return hata(req, 'Bu yorumu zaten yazdın.')
    const neden = onayNedeni(metin, !!uye!.guvenilir)
    const y = await p.create({
      collection: 'yorumlar', overrideAccess: true, context: { uyeIslemi: true },
      data: { metin, durum: neden ? 'onay-bekliyor' : 'yayinda', neden: neden || undefined, hedef: { relationTo: h.tur, value: h.id }, uye: uye!.id, ust: ust || undefined, yanitlanan: yanitlanan?.id || undefined, yol: h.yol } as never,
    }) as any
    sayfaTemizle(h.anahtar)
    if (neden) await ekibeHaberVer(p, `${uye!.ad}: ${metin}`)
    else { await puanEkle(p, uye!.id, 'yorum', `yorum:${y.id}`); await yanitBildir(p, y, uye!.id) }
    return yanit(req, { id: y.id, onayda: !!neden, mesaj: neden ? 'Yorumun ekibin onayından sonra yayında olacak.' : null }, 201)
  }),

  // Kendi yorumunu düzenle (yazdıktan sonra 15 dakika içinde)
  uc('/uye/yorum/:id', 'patch', 'yazabilir', async ({ req, p, uye }) => {
    const y = await p.findByID({ collection: 'yorumlar', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true, disableErrors: true }).catch(() => null) as any
    if (!y || yorumSahibi(y) !== uye!.id || y.durum === 'silindi' || y.durum === 'gizli') return hata(req, 'Yorum bulunamadı.', 404)
    if (Date.now() - +new Date(y.createdAt) > 15 * 60_000) return hata(req, 'Yorumlar yalnız ilk 15 dakika içinde düzenlenebilir.')
    const metin = temizMetin((await govde(req)).metin, 2000)
    if (metin.length < 2) return hata(req, 'Yorum boş olamaz.')
    const neden = onayNedeni(metin, true)
    const durum = neden ? 'onay-bekliyor' : y.durum
    await p.update({ collection: 'yorumlar', id: y.id, data: { metin, durum, neden: neden || y.neden, duzenlendi: new Date().toISOString() } as never, overrideAccess: true, context: { uyeIslemi: true } })
    if (neden && y.durum === 'yayinda') await ekibeHaberVer(p, `${uye!.ad}: ${metin}`)
    return yanit(req, { id: y.id, onayda: durum === 'onay-bekliyor' })
  }),

  uc('/uye/yorum/:id', 'delete', 'uye', async ({ req, p, uye }) => {
    const y = await p.findByID({ collection: 'yorumlar', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true, disableErrors: true }).catch(() => null) as any
    if (!y || yorumSahibi(y) !== uye!.id || y.durum === 'silindi') return hata(req, 'Yorum bulunamadı.', 404)
    const yanitVar = await p.count({ collection: 'yorumlar', where: { or: [{ ust: { equals: y.id } }, { yanitlanan: { equals: y.id } }] }, overrideAccess: true })
    if (yanitVar.totalDocs) await p.update({ collection: 'yorumlar', id: y.id, data: { durum: 'silindi', metin: 'Bu yorum silindi.' } as never, overrideAccess: true, context: { uyeIslemi: true } })
    else await p.delete({ collection: 'yorumlar', id: y.id, overrideAccess: true, context: { uyeIslemi: true } })
    sayfaTemizle(`${y.hedef?.relationTo}:${hedefDegeri(y)}`)
    return yanit(req, { silindi: true })
  }),

  // Yorumu beğen / beğeniyi geri al
  uc('/uye/yorum/:id/begen', 'post', 'yazabilir', async ({ req, p, uye }) => {
    if (!hizSiniri(`begen:${uye!.id}`, 60, 60_000)) return hata(req, 'Biraz yavaş.', 429)
    const y = await p.findByID({ collection: 'yorumlar', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true, disableErrors: true }).catch(() => null) as any
    if (!y || y.durum !== 'yayinda') return hata(req, 'Yorum bulunamadı.', 404)
    const sahip = yorumSahibi(y)
    if (sahip === uye!.id) return hata(req, 'Kendi yorumunu beğenemezsin.')
    const db = havuz(p)
    const ekle = await db.query('insert into payload.yorum_begeni (uye_id, yorum_id) values ($1,$2) on conflict do nothing', [uye!.id, y.id])
    if (!ekle.rowCount) await db.query('delete from payload.yorum_begeni where uye_id=$1 and yorum_id=$2', [uye!.id, y.id])
    sayfaTemizle(`${y.hedef?.relationTo}:${hedefDegeri(y)}`)
    const n = await db.query('update payload.yorumlar set begeni = (select count(*) from payload.yorum_begeni where yorum_id=$1) where id=$1 returning begeni::int as begeni', [y.id])
    if (ekle.rowCount && sahip) {
      await puanEkle(p, sahip, 'begeni', `${y.id}:${uye!.id}`)
      const var_ = await db.query(`select 1 from payload.uye_bildirim where uye_id=$1 and tur='begeni' and yol=$2 and at > now() - interval '1 day'`, [sahip, `${y.yol}#yorum-${y.id}`])
      if (!var_.rows.length) await bildirimEkle(p, sahip, 'begeni', `${uye!.ad} yorumunu beğendi.`, `${y.yol}#yorum-${y.id}`)
    }
    return yanit(req, { begendim: !!ekle.rowCount, begeni: n.rows[0]?.begeni ?? 0 })
  }),

  // Şikâyet: 3 farklı Uper şikâyet ederse yorum gizlenir ve ekip onayına düşer
  uc('/uye/yorum/:id/sikayet', 'post', 'yazabilir', async ({ req, p, uye }) => {
    if (!hizSiniri(`sikayet:${uye!.id}`, 20, 3_600_000)) return hata(req, 'Biraz yavaş.', 429)
    const y = await p.findByID({ collection: 'yorumlar', id: Number(req.routeParams?.id), depth: 0, overrideAccess: true, disableErrors: true }).catch(() => null) as any
    if (!y || y.durum !== 'yayinda') return hata(req, 'Yorum bulunamadı.', 404)
    if (yorumSahibi(y) === uye!.id) return hata(req, 'Kendi yorumunu şikâyet edemezsin.')
    const NEDEN = ['Hakaret / nefret', 'Spam / reklam', 'Yanlış bilgi', 'Kişisel bilgi', 'Diğer']
    const gelen = (await govde(req)).neden
    const neden = NEDEN.includes(gelen) ? gelen : 'Diğer'
    const db = havuz(p)
    await db.query('insert into payload.yorum_sikayet (uye_id, yorum_id, neden) values ($1,$2,$3) on conflict do nothing', [uye!.id, y.id, neden])
    const n = (await db.query('update payload.yorumlar set sikayet = (select count(*) from payload.yorum_sikayet where yorum_id=$1) where id=$1 returning sikayet::int as sikayet', [y.id])).rows[0]?.sikayet ?? 0
    if (n >= 3) {
      await p.update({ collection: 'yorumlar', id: y.id, data: { durum: 'onay-bekliyor', neden: `Şikâyet (${n})` } as never, overrideAccess: true, context: { uyeIslemi: true } })
      await ekibeHaberVer(p, `Şikâyet edilen yorum: ${y.metin}`)
    }
    return yanit(req, { tamam: true })
  }),

  // Yazıya tepki (bir Uper bir yazıya bir tepki; aynısına basınca kalkar)
  uc('/uye/tepki', 'post', 'yazabilir', async ({ req, p, uye }) => {
    if (!hizSiniri(`tepki:${uye!.id}`, 60, 60_000)) return hata(req, 'Biraz yavaş.', 429)
    const b = await govde(req)
    const h = await hedefBul(p, String(b.hedef || ''))
    if (!h) return hata(req, 'Yazı bulunamadı.', 404)
    const TUR = ['begendim', 'ilginc', 'sasirtici', 'katilmiyorum']
    const db = havuz(p)
    const once = (await db.query('select tur from payload.uye_tepki where uye_id=$1 and hedef=$2', [uye!.id, h.anahtar])).rows[0]?.tur
    let tur: string | null = TUR.includes(b.tur) ? b.tur : null
    if (tur && once === tur) tur = null
    if (tur) await db.query('insert into payload.uye_tepki (uye_id, hedef, tur) values ($1,$2,$3) on conflict (uye_id, hedef) do update set tur = excluded.tur, at = now()', [uye!.id, h.anahtar, tur])
    else await db.query('delete from payload.uye_tepki where uye_id=$1 and hedef=$2', [uye!.id, h.anahtar])
    sayfaTemizle(h.anahtar)
    if (tur) await puanEkle(p, uye!.id, 'tepki', h.anahtar)
    const t = await db.query('select tur, count(*)::int as n from payload.uye_tepki where hedef=$1 group by tur', [h.anahtar])
    return yanit(req, { tepki: tur, tepkiler: Object.fromEntries(t.rows.map((r: any) => [r.tur, r.n])) })
  }),

  // Kaydet / kaydı kaldır
  uc('/uye/kaydet', 'post', 'uye', async ({ req, p, uye }) => {
    const h = await hedefBul(p, String((await govde(req)).hedef || ''))
    if (!h) return hata(req, 'Yazı bulunamadı.', 404)
    const db = havuz(p)
    const e = await db.query('insert into payload.uye_kayit (uye_id, hedef) values ($1,$2) on conflict do nothing', [uye!.id, h.anahtar])
    if (!e.rowCount) await db.query('delete from payload.uye_kayit where uye_id=$1 and hedef=$2', [uye!.id, h.anahtar])
    return yanit(req, { kayitli: !!e.rowCount })
  }),
  uc('/uye/kaydedilenler', 'get', 'uye', async ({ req, p, uye }) => {
    const r = await havuz(p).query('select hedef, at from payload.uye_kayit where uye_id=$1 order by at desc limit 200', [uye!.id])
    const l = await Promise.all(r.rows.map(async (x: any) => { const h = await hedefBul(p, x.hedef); return h ? { hedef: x.hedef, yol: h.yol, baslik: h.baslik, at: x.at } : null }))
    return yanit(req, l.filter(Boolean))
  }),

  // Kendi yorumlarım (onaydakiler dahil)
  uc('/uye/yorumlarim', 'get', 'uye', async ({ req, p, uye }) => {
    const r = await p.find({ collection: 'yorumlar', where: { and: [{ uye: { equals: uye!.id } }, { durum: { not_equals: 'silindi' } }] }, sort: '-createdAt', limit: 50, depth: 0, overrideAccess: true })
    const b = await Promise.all(r.docs.map((y: any) => hedefBul(p, `${y.hedef?.relationTo}:${hedefDegeri(y)}`)))
    return yanit(req, r.docs.map((y: any, i) => ({ id: y.id, metin: y.metin, durum: y.durum, begeni: y.begeni || 0, at: y.createdAt, yol: y.yol, baslik: b[i]?.baslik || '' })))
  }),

  uc('/uye/bildirimler', 'get', 'uye', async ({ req, p, uye }) => {
    const r = await havuz(p).query('select id, tur, metin, yol, okundu, at from payload.uye_bildirim where uye_id=$1 order by at desc limit 40', [uye!.id])
    return yanit(req, { okunmamis: r.rows.filter((x: any) => !x.okundu).length, liste: r.rows })
  }),
  uc('/uye/bildirimler/okundu', 'post', 'uye', async ({ req, p, uye }) => {
    await havuz(p).query('update payload.uye_bildirim set okundu = true where uye_id=$1 and not okundu', [uye!.id])
    return yanit(req, { tamam: true })
  }),

  // Yazıyı sonuna kadar okudu (sitedeki betik: sayfanın sonuna inince ve en az 20 sn sonra)
  uc('/uye/okudum', 'post', 'uye', async ({ req, p, uye }) => {
    const h = await hedefBul(p, String((await govde(req)).hedef || ''))
    if (h) await puanEkle(p, uye!.id, 'okuma', h.anahtar)
    return yanit(req, { tamam: true })
  }),

  // Kulüp ilerlemesi hesapta (cihazlar arası); yeni biten her adım puan getirir (günlük sınırla)
  uc('/uye/kulup', 'get', 'uye', async ({ req, p, uye }) => {
    const r = await havuz(p).query('select durum from payload.uye_kulup where uye_id=$1', [uye!.id])
    return yanit(req, { durum: r.rows[0]?.durum ?? null })
  }),
  uc('/uye/kulup', 'put', 'uye', async ({ req, p, uye }) => {
    const b = await govde(req)
    const d = b.durum
    if (!d || typeof d !== 'object' || JSON.stringify(d).length > 50_000) return hata(req, 'İlerleme okunamadı.')
    const db = havuz(p)
    const once = (await db.query('select durum from payload.uye_kulup where uye_id=$1', [uye!.id])).rows[0]?.durum || {}
    const birles = (a: any, b: any) => ({ ...(a && typeof a === 'object' ? a : {}), ...(b && typeof b === 'object' ? b : {}) })
    const yeni = { ...once, ...d, xp: Math.max(Number(once.xp) || 0, Math.min(100_000, Number(d.xp) || 0)), done: birles(once.done, d.done), badges: birles(once.badges, d.badges), quiz: birles(once.quiz, d.quiz) }
    await db.query('insert into payload.uye_kulup (uye_id, durum, at) values ($1,$2,now()) on conflict (uye_id) do update set durum = excluded.durum, at = now()', [uye!.id, JSON.stringify(yeni)])
    // Puanı alınmamış adımlar (günlük sınır dolunca kalanlar sonraki eşitlemede)
    const alinan = new Set((await db.query(`select ref from payload.uye_puan where uye_id=$1 and tur='kulup'`, [uye!.id])).rows.map((r: any) => r.ref))
    for (const k of Object.keys(yeni.done || {}).slice(0, 500)) {
      const ref = `kulup:${k.slice(0, 80)}`
      if (!alinan.has(ref) && !(await puanEkle(p, uye!.id, 'kulup', ref))) break
    }
    return yanit(req, { durum: yeni })
  }),
]
