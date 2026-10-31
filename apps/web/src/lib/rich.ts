import { esc } from './format'

/**
 * Lexical (Payload richText) → HTML. Bağımlılıksız, yalnız sitede kullanılan düğümler.
 * Reklam yerleştirme: ilk paragraftan önce yok, en fazla 2 (kit 10b) → insertAfter ile paragraf sayısına göre.
 */
const FORMAT = [[1, 'strong'], [2, 'em'], [8, 'u'], [4, 's'], [16, 'code']] as const
function text(n: any) {
  let s = esc(n.text)
  for (const [bit, tag] of FORMAT) if (n.format & bit) s = `<${tag}>${s}</${tag}>`
  return s
}
function node(n: any, media: (id: any) => any): string {
  const kids = () => (n.children || []).map((c: any) => node(c, media)).join('')
  switch (n.type) {
    case 'text': return text(n)
    case 'linebreak': return '<br>'
    case 'paragraph': return kids() ? `<p>${kids()}</p>` : ''
    case 'heading': { const t = n.tag === 'h1' ? 'h2' : n.tag; return `<${t}>${kids()}</${t}>` }
    case 'quote': return `<blockquote class="quote">${kids()}</blockquote>`
    case 'list': return `<${n.listType === 'number' ? 'ol' : 'ul'}>${kids()}</${n.listType === 'number' ? 'ol' : 'ul'}>`
    case 'listitem': return `<li>${kids()}</li>`
    case 'link': case 'autolink': { const u = n.fields?.url || n.url || '#'; const ext = /^https?:/.test(u) && !u.includes('updated.com.tr'); return `<a href="${esc(u)}"${ext ? ' rel="noopener" target="_blank"' : ''}>${kids()}</a>` }
    case 'upload': { const m = media(n.value); if (!m?.url) return ''; return `<figure class="cover"><img src="${esc(m.url)}" alt="${esc(m.alt)}" loading="lazy" width="${m.w || 1600}" height="${m.h || 900}"><figcaption>${esc(m.credit || '')}</figcaption></figure>` }
    case 'horizontalrule': return '<hr>'
    default: return kids()
  }
}
export function lexicalToHtml(data: any, media: (v: any) => any = () => null): string {
  if (!data?.root) return typeof data === 'string' ? data : ''
  return (data.root.children || []).map((c: any) => node(c, media)).join('')
}
/** n. paragraftan sonra yer tutucu ekler (reklam, künye kutusu…). */
export function insertAfterParagraph(html: string, n: number, marker: string) {
  let i = 0
  return html.replace(/<\/p>/g, (m) => (++i === n ? m + marker : m))
}

/**
 * WordPress'ten (Elementor) taşınan kurumsal sayfaların kalıntılarını temizler (31 Ekim 2026): boş paragraflar, sayaç satırları
 * ("YÜZLERCE İNCELEME 0 Organik Takipçi 0"), süs simgeleri (.svg alıntı işareti). Art arda gelen görseller tek tek tam genişlik yerine
 * ızgarada durur. İçerik panelde düzeltilince bu süzgeç bir şey bulamaz, zararsızdır.
 */
export function wpTemizle(html: string) {
  let h = html
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>|​)*<\/p>/g, '')
    .replace(/<p>[^<]*?(?:\S+[^<0-9]*\s0(?:\s|$|<)){2,}[^<]*<\/p>/g, (m) => (/\b0\b/.test(m) && (m.match(/\s0\b/g) || []).length >= 2 ? '' : m))
    .replace(/<figure class="cover"><img src="[^"]+\.svg[^"]*"[^>]*>(?:<figcaption>[^<]*<\/figcaption>)?<\/figure>/g, '')
  h = h.replace(/(?:<figure class="cover">(?:(?!<\/figure>).)*<\/figure>){2,}/gs, (grup) => `<div class="pg-galeri">${grup.replace(/<figcaption>Görsel: UPDATED arşivi<\/figcaption>/g, '')}</div>`)
  return h
}
