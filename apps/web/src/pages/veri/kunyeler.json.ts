/** Kıyas kataloğu (27 Ekim 2026): kıyas sayfası "Ürün ekle" dediğinde tarayıcı bunu bir kez okur. Derlemede statik dosya olur. */
import { kunyeKatalog } from '../../lib/api'
import { araliklar } from '../../lib/kiyas'

export async function GET() {
  const k = await kunyeKatalog()
  return new Response(JSON.stringify({ k, ar: araliklar(k) }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
