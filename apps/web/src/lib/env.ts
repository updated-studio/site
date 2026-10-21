/** Ortam değişkeni: Astro (import.meta.env) → Node (process.env) sırasıyla; testte ve sunucuda aynı çalışır. */
export const env = (k: string, d = ''): string => ((import.meta as any).env?.[k] ?? (typeof process !== 'undefined' ? process.env[k] : undefined) ?? d) as string
/** Reklam yer tutucuları: CMS yokken ya da SHOW_AD_SLOTS=1 iken (hazırlık sitesinde yerleşimi görmek için). */
export const showAdSlots = () => !env('CMS_URL') || env('SHOW_AD_SLOTS') === '1'
