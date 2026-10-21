import type { APIRoute } from 'astro'
import { env } from '../../lib/env'

/**
 * Bülten kaydı. Sağlayıcı (ör. Resend, Brevo, Mailchimp) seçilince BULTEN_WEBHOOK'a iletilir.
 * Tanımlı değilse kaydı saklamaz ve bunu açıkça söyler.
 */
export const prerender = false
export const POST: APIRoute = async ({ request }) => {
  const ct = request.headers.get('content-type') || ''
  const email = String(ct.includes('json') ? (await request.json()).email : (await request.formData()).get('email') || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ ok: false, msg: 'Geçerli bir e-posta yazın, ör. ad@alanadi.com' }, { status: 400 })
  const hook = env('BULTEN_WEBHOOK')
  if (!hook) return Response.json({ ok: false, msg: 'Bülten kaydı henüz açılmadı.' }, { status: 503 })
  const r = await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'updated.com.tr', at: new Date().toISOString() }) })
  return r.ok ? Response.json({ ok: true, msg: 'Kaydınız alındı. Onay e-postasını kontrol edin.' }) : Response.json({ ok: false, msg: 'Şu an kaydedemedik, birazdan tekrar deneyin.' }, { status: 502 })
}
