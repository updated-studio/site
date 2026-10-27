// Künye görsel işçisi (27 Ekim 2026). Stüdyo kunye-otomatik'in bulduğu ürün görsellerini (kunye_oneriler.gorsel_aday) işler:
// indirir → rembg kabında arka planı siler ve standart tuvale yerleştirir (isle.py) → Stüdyo'nun "kunye" kovasına yükler →
// satırı "hazir" yapar. Editör Stüdyo → Site → Künye onayı'nda görür. 15 dakikada bir (updated-kunye-gorsel.timer), her turda en çok 4.
// Gizli bilgi dosyada değil: servis anahtarı sunucudaki /opt/updated/supabase/.env'den okunur. Root çalışır (docker için).
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const ENV = Object.fromEntries(readFileSync('/opt/updated/supabase/.env', 'utf8').split('\n').map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]))
const ICI = 'http://127.0.0.1:8000', DIS = 'https://panel.updated.com.tr', KEY = ENV.SERVICE_ROLE_KEY
const IMAJ = 'danielgatis/rembg:2.0.84', KOK = '/var/lib/updated-kunye', IS = join(KOK, 'is')
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const UA = 'Mozilla/5.0 (compatible; UpdatedStudyo/1.0; +https://www.updated.com.tr; kunye gorseli)'

async function guncelle(id, alanlar) {
  const r = await fetch(`${ICI}/rest/v1/kunye_oneriler?id=eq.${id}`, { method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(alanlar) })
  if (!r.ok) throw new Error(`kayıt güncellenemedi ${r.status}`)
}

async function isle(s) {
  const url = s.gorsel_aday?.url
  if (!url) return guncelle(s.id, { gorsel_durum: 'yok' })
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'image/*' }, signal: AbortSignal.timeout(30_000) })
  if (!r.ok || !/^image\//.test(r.headers.get('content-type') ?? '')) throw new Error(`görsel indirilemedi (${r.status})`)
  const veri = Buffer.from(await r.arrayBuffer())
  if (veri.length > 25e6) throw new Error('görsel 25 MB üstü')
  mkdirSync(IS, { recursive: true })
  writeFileSync(join(IS, 'girdi'), veri); copyFileSync(new URL('./isle.py', import.meta.url), join(IS, 'isle.py'))
  const cikti = execFileSync('docker', ['run', '--rm', '--network', 'none', '--memory', '1800m', '--cpus', '1.5', '-e', 'U2NET_HOME=/model',
    '-v', `${KOK}/model:/model`, '-v', `${IS}:/w`, '--entrypoint', 'python', IMAJ, '/w/isle.py', '/w/girdi', '/w/cikti.webp'], { encoding: 'utf8', timeout: 600_000 })
  const sonuc = JSON.parse(cikti.trim().split('\n').pop())
  if (!sonuc.ok) throw new Error(sonuc.hata)
  const yol = `${s.urun_id}-${s.id}.webp`
  const y = await fetch(`${ICI}/storage/v1/object/kunye/${yol}`, { method: 'POST', headers: { ...H, 'Content-Type': 'image/webp', 'x-upsert': 'true' }, body: readFileSync(join(IS, 'cikti.webp')) })
  if (!y.ok) throw new Error(`yükleme ${y.status} ${(await y.text()).slice(0, 120)}`)
  await guncelle(s.id, { gorsel: `${DIS}/storage/v1/object/public/kunye/${yol}`, gorsel_durum: 'hazir', gorsel_hata: null })
  console.log(`${s.urun_adi}: hazır (kaplama ${sonuc.kaplama})`)
}

const l = await fetch(`${ICI}/rest/v1/kunye_oneriler?select=id,urun_id,urun_adi,gorsel_aday&gorsel_durum=eq.isleniyor&order=id&limit=4`, { headers: H })
if (!l.ok) { console.error(`liste alınamadı ${l.status}`); process.exit(l.status === 400 ? 0 : 1) } // 400: göç 0043 henüz yok
for (const s of await l.json()) {
  try { await isle(s) } catch (e) {
    console.error(`${s.urun_adi}: ${e.message}`)
    await guncelle(s.id, { gorsel_durum: 'hata', gorsel_hata: String(e.message).slice(0, 200) }).catch(() => {})
  }
}
rmSync(IS, { recursive: true, force: true })
