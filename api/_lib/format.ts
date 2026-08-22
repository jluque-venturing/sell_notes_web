export interface SnapshotItem {
  sale_number: number
  product_label: string
  quantity_label: string
  quantity_value: number
  amount: number
  payment_type: string
  mp_amount: number | null
  efectivo_amount: number | null
  sold_at?: string | null
  ok?: boolean
  operation_number?: string | null
  original_amount?: number
}

const AR_OFFSET_MS = 3 * 60 * 60 * 1000

export function fechaAR(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${Number(d)}/${Number(m)}/${y}`
}

export function horaAR(iso: string | null | undefined) {
  if (!iso) return '-'
  const d = new Date(new Date(iso).getTime() - AR_OFFSET_MS)
  if (Number.isNaN(d.getTime())) return '-'
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}hs`
}

export function money(n: number) {
  return '$' + Math.round(n).toLocaleString('es-AR')
}

export function mpOf(s: SnapshotItem) {
  if (s.payment_type === 'mp') return s.amount
  if (s.payment_type === 'excepcion') return s.mp_amount ?? 0
  return 0
}

export function efectivoOf(s: SnapshotItem) {
  if (s.payment_type === 'efectivo') return s.amount
  if (s.payment_type === 'excepcion') return s.efectivo_amount ?? 0
  return 0
}

export function paymentLabel(s: SnapshotItem) {
  if (s.payment_type === 'mp') return 'Naranja X'
  if (s.payment_type === 'efectivo') return 'Efectivo'
  return 'Excepción'
}

/** Matches the columns of the accounting doc: FECHA | Nº operación | MONTO | SERVICIO | HORA | ACT */
export function sheetRow(item: SnapshotItem, closeDate: string) {
  const onlyCash = efectivoOf(item) === item.amount
  return [
    fechaAR(closeDate),
    item.operation_number?.trim() || (onlyCash ? '-' : ''),
    item.amount,
    item.product_label.toLowerCase(),
    horaAR(item.sold_at),
    'C',
  ]
}
