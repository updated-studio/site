/**
 * Kulüp ilerlemesi Uper hesabında: giriş yapmışsa tarayıcıdaki ilerleme (localStorage "kulup-v1") hesapla birleştirilir,
 * sonra her değişiklik birkaç saniye içinde hesaba yazılır (başka cihazda da aynı ilerleme; biten her adım puan getirir).
 * Kulüp uygulamasına (public/kulup) dokunmaz: yalnız onun sakladığı kaydı okur/yazar.
 */
import { api, ben, girisli } from './uye'

const K = 'kulup-v1'
const oku = () => { try { return JSON.parse(localStorage.getItem(K) || '{}') } catch { return {} } }
const birles = (a: any = {}, b: any = {}) => ({ ...(a || {}), ...(b || {}) })
;(async () => {
  if (!girisli()) return
  const u = await ben(); if (!u?.kayitli) return
  const y = await api('/uye/kulup'); if (y.s !== 200) return
  const yerel = oku(), uzak = y.j.durum || {}
  const ortak = { ...uzak, ...yerel, xp: Math.max(Number(uzak.xp) || 0, Number(yerel.xp) || 0), done: birles(uzak.done, yerel.done), badges: birles(uzak.badges, yerel.badges), quiz: birles(uzak.quiz, yerel.quiz) }
  let son = JSON.stringify(ortak)
  if (son !== JSON.stringify(yerel) && Object.keys(uzak).length) {
    try { localStorage.setItem(K, son) } catch {}
    // Kulüp uygulaması ilerlemeyi açılışta okur: hesaptaki ilerleme gelince bir kez yeniden açılır
    if (!sessionStorage.getItem('kulup-esitlendi')) { sessionStorage.setItem('kulup-esitlendi', '1'); location.reload(); return }
  }
  const yaz = async () => { const d = oku(), s = JSON.stringify(d); if (s === son) return; son = s; await api('/uye/kulup', 'PUT', { durum: d }) }
  if (son !== JSON.stringify(uzak)) { son = ''; await yaz() }
  setInterval(yaz, 5000)
  addEventListener('pagehide', () => { yaz() })
  const f = document.querySelector('.ftr .bt span:last-child'); if (f) f.textContent = `İlerlemen @${u.kullaniciAdi} hesabında saklanıyor`
})()
