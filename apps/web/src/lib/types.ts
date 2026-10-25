export type Img = { url: string; alt: string; credit?: string; w?: number; h?: number; srcset?: string }
export type Cat = { name: string; slug: string }
export type Author = { name: string; slug: string; title?: string; bio?: string }
export type ProductRef = { slug: string; name: string; brand: string; type: string; status: string; certainty: number; image?: Img; score?: number; specs?: Spec[]; blurb?: string }
export type Spec = { key: string; value?: string | null; num?: number; unit?: string; source?: string; sourceUrl?: string; at?: string; group?: string; higherIsBetter?: boolean; searchWeight?: number }
export type Label = 'yok' | 'son-dakika' | 'sizinti' | 'rehber' | 'sponsorlu'
export type News = {
  id: string; kind: 'news'; title: string; spot: string; path: string; category: Cat; label: Label; cover?: Img; author: Author
  publishedAt: string; updatedAt?: string; readingTime?: number; products: ProductRef[]; shortAnswer?: string; html?: string
  knowns?: string[]; unknowns?: string[]; sources?: { name: string; url?: string; primary?: boolean }[]; corrections?: { at: string; note: string }[]
  seo: { title: string; description: string; image?: Img; canonical?: string; noindex?: boolean; entities?: string[]; faq?: { q: string; a: string }[] }
}
export type Review = Omit<News, 'kind' | 'category' | 'label'> & { kind: 'review'; product: ProductRef; score: number; pros: string[]; cons: string[]; usageDays?: number; deviceSource?: string; who?: { for: string[]; notFor: string[] }; methodHtml?: string; video?: Video }
export type Comparison = { id: string; kind: 'comparison'; title: string; spot: string; path: string; a: ProductRef; b: ProductRef; shortAnswer?: string; keyDiffs: { big: string; label: string; winner?: 'a' | 'b' }[]; whoFor?: { a?: string; b?: string }; method?: string; cover?: Img; author: Author; publishedAt: string; seo: News['seo'] }
export type Product = ProductRef & { id?: number; path: string; releaseWhen?: string; parts?: { name: string; value?: string }[]; rivals: ProductRef[]; news: News[]; reviews: Review[]; comparisons?: Comparison[]; seo: News['seo'] }
export type Video = { title: string; youtubeId: string; kind: string; thumb?: Img }
export type Reel = { caption: string; url: string; cover?: Img }
export type Ad = { slot: 'lb' | 'mr' | 'in' | 'video' | 'sponsored'; name: string; advertiser: string; url: string; image?: Img; mobileImage?: Img; videoUrl?: string; title?: string }
export type Home = { heroLayout: 'akordeon' | 'vitrin' | 'akis'; hero: (News | Review | Comparison)[]; modules: Record<string, boolean>; mostRead: News[] }
