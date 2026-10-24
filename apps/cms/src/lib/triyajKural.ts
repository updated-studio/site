import { BANNED_WORDS, LIMIT } from './kit'
import { cut } from './slug'

/**
 * Haber Masası'ndan gelen taslağı panelin yayın kurallarına uydurur (endpoints/triyajImport.ts).
 * Amaç: taslak editöre "okuyup onayla" seviyesinde gelsin, yayınlarken kural yüzünden reddedilmesin (hooks/workflow.ts).
 */

const kucuk = (s: string) => s.toLocaleLowerCase('tr-TR')
const SIZINTI = /(sızıntı|sızdı|iddia)/

/** Başlık: ünlem ve yasak kelime çıkar, sızıntıda "Sızıntı:" öneki, en fazla 70 karakter (kelime ortasından kesmeden) */
export function baslikUydur(baslik: string, etiket: string): { baslik: string; duzeltmeler: string[] } {
  const duzeltmeler: string[] = []
  let t = String(baslik || '').trim()
  if (t.includes('!')) { t = t.replace(/\s*!+/g, '').trim(); duzeltmeler.push('Başlıktaki ünlem çıkarıldı.') }
  // Yasak kelimeler (kit §7) kelime kelime: noktalama atılıp küçük harfle karşılaştırılır ("Şok", "İnanılmaz" da yakalanır)
  const kelimeler = t.split(/\s+/)
  const kalan = kelimeler.filter((x) => !BANNED_WORDS.includes(kucuk(x).replace(/[^\p{L}]/gu, '')))
  if (kalan.length !== kelimeler.length) {
    duzeltmeler.push(`Başlıktan yasak kelime çıkarıldı (${kelimeler.filter((x) => !kalan.includes(x)).join(', ')}); cümleyi kontrol et.`)
    t = kalan.join(' ').trim()
  }
  if (etiket === 'sizinti' && !SIZINTI.test(kucuk(t))) { t = `Sızıntı: ${t}`; duzeltmeler.push('Sızıntı haberi: başlığa "Sızıntı:" eklendi (yayın kuralı).') }
  if (t.length > LIMIT.title) { t = cut(t, LIMIT.title); duzeltmeler.push(`Başlık ${LIMIT.title} karaktere kısaltıldı; okunuşunu kontrol et.`) }
  return { baslik: t, duzeltmeler }
}

type Kapak = { width?: number; height?: number; alt?: string; credit?: string; aiGenerated?: boolean; representative?: boolean } | null

/**
 * Kontrol listesinin makinenin ölçebildiği maddeleri (kit CHECKLIST): uzunluk, etiket, künye, alt metin, kapak, sponsor.
 * Bilgi doğrulama, başlığın bilgi vermesi, imla ve mobil görünüm editörde kalır.
 * eksikler: editörün tamamlaması gerekenler (Stüdyo'da taslak kartında görünür).
 */
export function makineDenetimi(d: { title: string; spot: string; seoTitle?: string; category?: unknown; label: string; kapak: Kapak; shortAnswer?: string; sizinti?: { knowns?: string[]; unknowns?: string[]; certainty?: string } }) {
  const k = d.kapak
  const oran = k?.width && k?.height ? k.width / k.height : 0
  const kapakTamam = !!k && Math.abs(oran - 16 / 9) < 0.02 && (k.width ?? 0) >= 1920
  const temsili = !!k && (k.aiGenerated || k.representative)
  const checklist = {
    uzunluk: d.title.length <= LIMIT.title && d.spot.length <= LIMIT.spot && (d.seoTitle ?? '').length <= LIMIT.seoTitle,
    etiket: !!d.category && !!d.label,
    kunye: !!k?.credit?.trim() && (!temsili || /temsili/i.test(k.credit)),
    alt: !!k?.alt?.trim(),
    kapak: kapakTamam,
    // Haber Masası haberleri kaynaktan gelir, ücretli içerik değildir
    sponsor: d.label !== 'sponsorlu',
  }
  const eksikler: string[] = []
  if (!k) eksikler.push('Kapak yok')
  else if (!kapakTamam) eksikler.push(`Kapak küçük (${k.width ?? '?'} px; en az 1920)`)
  if (!d.spot.trim()) eksikler.push('Spot yok')
  if (!d.shortAnswer?.trim()) eksikler.push('Kısa cevap yok')
  if (d.label === 'sizinti' && (!d.sizinti?.knowns?.length || !d.sizinti?.unknowns?.length || !d.sizinti?.certainty)) eksikler.push('Sızıntı bilgileri eksik')
  return { checklist, eksikler }
}
