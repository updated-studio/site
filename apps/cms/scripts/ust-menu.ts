// Üst menüyü sadeleştirir (25 Ekim 2026, kullanıcı: "orada her şey olmasın"): Haberler · İncelemeler · Künyeler · Araçlar (+ Kulüp sabit).
// Kategoriler telefon menüsünde ve haber sayfalarında. Stüdyo → Site → Ayarlar → Site ayarları'ndan değiştirilebilir.
import { getPayload } from 'payload'
import config from '@payload-config'
const p = await getPayload({ config })
const nav = [['Haberler', '/haberler'], ['İncelemeler', '/inceleme'], ['Künyeler', '/urun'], ['Araçlar', '/araclar']].map(([label, href]) => ({ label, href }))
await p.updateGlobal({ slug: 'site', data: { nav } as never, overrideAccess: true })
console.log('üst menü:', nav.map((n) => n.label).join(' · '))
process.exit(0)
