import type { SaleSnapshotItem } from '../types'

const AR_OFFSET_MS = 3 * 60 * 60 * 1000

export function mpOf(s: SaleSnapshotItem) {
  if (s.payment_type === 'mp') return s.amount
  if (s.payment_type === 'excepcion') return s.mp_amount ?? 0
  return 0
}

export function efectivoOf(s: SaleSnapshotItem) {
  if (s.payment_type === 'efectivo') return s.amount
  if (s.payment_type === 'excepcion') return s.efectivo_amount ?? 0
  return 0
}

export function paymentLabel(s: SaleSnapshotItem) {
  if (s.payment_type === 'mp') return 'Naranja X'
  if (s.payment_type === 'efectivo') return 'Efectivo'
  return 'Excepción'
}

export function paymentIcon(s: SaleSnapshotItem) {
  if (s.payment_type === 'mp') return '🟠'
  if (s.payment_type === 'efectivo') return '💵'
  return '⚠️'
}

export function money(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

export function horaAR(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(new Date(iso).getTime() - AR_OFFSET_MS)
  if (Number.isNaN(d.getTime())) return null
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}hs`
}
