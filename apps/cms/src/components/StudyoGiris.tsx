'use client'
import React, { useEffect, useState } from 'react'

/** Giriş sayfasının altında: Stüdyo hesabıyla giriş (tek giriş). Stüdyo'nun /#/panel-giris sayfası oturumu panele gönderir. */
export const StudyoGiris = () => {
  const [yetkiYok, setYetkiYok] = useState(false)
  useEffect(() => setYetkiYok(new URLSearchParams(window.location.search).get('studyo') === 'yetki-yok'), [])
  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {yetkiYok && <p style={{ color: 'var(--theme-error-500)', margin: 0 }}>Bu panel yalnız yöneticilere açık. Ekip Stüdyo'nun Site modülünü kullanır.</p>}
      <a className="btn btn--style-secondary btn--size-large" href="https://studio.updated.com.tr/#/panel-giris" style={{ textAlign: 'center' }}>Stüdyo hesabıyla gir</a>
    </div>
  )
}
