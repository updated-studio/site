/**
 * Natro'ya yalnız değişen dosyaları yükler.
 * - dist/ içindeki her dosyanın özeti (sha1) çıkarılır; sunucudaki .yayin-manifest.json (bir önceki yükleme) ile karşılaştırılır.
 * - Yeni/değişen dosyalar yüklenir. Önceki yüklemede BİZİM gönderdiğimiz ama artık olmayan dosyalar silinir
 *   (yayından kaldırılan haber sitede kalmasın). Manifestte olmayan hiçbir dosyaya dokunulmaz.
 * Ortam: NATRO_FTP_HOST/USER/PASSWORD, NATRO_DIR, NATRO_FTP_PROTOCOL (ftps|ftp), NATRO_FTP_SECURITY (loose)
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const DIST = process.argv[2] || 'apps/web/dist'
const TMP = '/tmp/natro-yukle'
const MAN = '.yayin-manifest.json'
const dir = (process.env.NATRO_DIR || '.').replace(/^\.\//, '').replace(/\/$/, '') || '.'
const ssl = process.env.NATRO_FTP_PROTOCOL === 'ftp' ? 'set ftp:ssl-allow no;' : 'set ftp:ssl-allow yes; set ftp:ssl-force yes; set ftp:ssl-protect-data yes;'
const loose = process.env.NATRO_FTP_SECURITY === 'loose' ? ' set ssl:verify-certificate no;' : ''
const pre = `${ssl}${loose} set net:max-retries 4; set net:reconnect-interval-base 5; set net:timeout 30; set ftp:passive-mode yes; cd ${dir};`
const lftp = (cmds) => execFileSync('lftp', ['-u', `${process.env.NATRO_FTP_USER},${process.env.NATRO_FTP_PASSWORD}`, process.env.NATRO_FTP_HOST, '-e', `${pre} ${cmds}; bye`], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }).toString()

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p] })
const now = {}
for (const f of walk(DIST)) now[relative(DIST, f)] = createHash('sha1').update(readFileSync(f)).digest('hex')

rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true })
let old = {}
try { lftp(`get -O ${TMP} ${MAN}`); old = JSON.parse(readFileSync(join(TMP, MAN), 'utf8')) } catch { console.log('Önceki manifest yok: ilk yükleme, her şey gönderilecek.') }
rmSync(join(TMP, MAN), { force: true })

const changed = Object.keys(now).filter((k) => old[k] !== now[k])

// Klasörde bizden önce dosya varsa (ör. ana sitede WordPress) üzerine yazmadan önce yedeği alınır: ad.wp-yedek
// Yalnız kök klasör kontrol edilir; WordPress'in kendi klasörleri (wp-*) bizim dosyalarımızla çakışmaz.
const kok = lftp('cls -1aF').split('\n').map((x) => x.trim()).filter(Boolean)
const kokDosya = new Set(kok.filter((x) => !x.endsWith('/')).map((x) => x.replace(/[*@]$/, '')))
const kokKlasor = new Set(kok.filter((x) => x.endsWith('/')).map((x) => x.slice(0, -1)))
const bizimKlasor = new Set(Object.keys(old).filter((k) => k.includes('/')).map((k) => k.split('/')[0]))
const cakisan = changed.filter((k) => !(k in old) && !k.includes('/') && kokDosya.has(k) && k !== MAN)
const yabanciKlasor = [...new Set(changed.filter((k) => k.includes('/') && !(k in old)).map((k) => k.split('/')[0]))].filter((d) => kokKlasor.has(d) && !bizimKlasor.has(d))
if (cakisan.length) console.log(`Klasörde önceden var olan ve üzerine yazılacak dosyalar (yedeği alınır): ${cakisan.join(', ')}`)
if (yabanciKlasor.length) console.log(`::warning title=Natro::Klasörde önceden var olan klasörlere dosya eklenecek: ${yabanciKlasor.join(', ')}`)
if (process.env.PROVA === '1') {
  console.log(`::notice title=Prova (hiçbir şey yüklenmedi)::Kök: ${kok.length} öğe · yüklenecek ${changed.length} dosya · yedeği alınacak: ${cakisan.join(', ') || 'yok'} · önceden var olan klasörler: ${yabanciKlasor.join(', ') || 'yok'}`)
  process.exit(0)
}
// Yedek kopyalanarak alınır (asıl dosya bizimki gelene kadar yerinde kalır; WordPress bir an bile .htaccess'siz kalmaz)
for (const k of process.env.YEDEK === '0' ? [] : cakisan) {
  if (kokDosya.has(`${k}.wp-yedek`)) continue
  const yerel = join(TMP, 'yedek-' + k.replace(/[^\w.-]/g, '_'))
  lftp(`get "${k}" -o "${yerel}"; put "${yerel}" -o "${k}.wp-yedek"`)
  console.log(`yedeklendi: ${k} → ${k}.wp-yedek`)
}
const removed = Object.keys(old).filter((k) => !(k in now) && k !== MAN)
console.log(`Toplam ${Object.keys(now).length} dosya · değişen ${changed.length} · silinecek ${removed.length}`)

const STAGE = join(TMP, 'gonder')
for (const k of changed) { mkdirSync(dirname(join(STAGE, k)), { recursive: true }); copyFileSync(join(DIST, k), join(STAGE, k)) }
// Önce görseller ve varlıklar, en son sayfalar ve .htaccess: yarım yüklemede kırık sayfa kalmasın.
if (changed.length) {
  const hasHt = changed.includes('.htaccess'); if (hasHt) rmSync(join(STAGE, '.htaccess'))
  lftp(`mirror -R --parallel=4 --no-perms ${STAGE} .`)
  if (hasHt) lftp(`put -O . ${join(DIST, '.htaccess')}`)
}
if (removed.length) {
  for (let i = 0; i < removed.length; i += 200) lftp(removed.slice(i, i + 200).map((k) => `rm -f "${k.replace(/"/g, '')}"`).join('; '))
}
writeFileSync(join(TMP, MAN), JSON.stringify(now))
lftp(`put -O . ${join(TMP, MAN)}`)
console.log('Yükleme tamam.')
