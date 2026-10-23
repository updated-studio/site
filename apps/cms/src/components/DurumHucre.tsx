import React from 'react'
import { STATES } from '../lib/kit'

/** Listede yayın akışı durumu: kit §12 sabit beş durum (renk + ikon + metin). Stil: app/(payload)/custom.scss .kit-durum */
export const DurumHucre = ({ cellData }: { cellData?: string }) => {
  const s = STATES.find((x) => x.value === cellData)
  if (!s) return <span>—</span>
  return <span className={`kit-durum kit-durum--${s.value}`}>{s.label}</span>
}
