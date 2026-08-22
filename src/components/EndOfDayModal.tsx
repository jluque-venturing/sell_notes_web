import { useState } from 'react'
import { supabase, todayISO, formatDate } from '../lib/supabase'
import { logError } from '../lib/errorLog'
import { notifyTelegram } from '../lib/api'
import type { Sale, Product, SaleSnapshotItem } from '../types'

interface Props {
  sales: Sale[]
  products: Product[]
  onClose: () => void
}

type TelegramState = 'idle' | 'sending' | 'sent' | 'failed'

export function EndOfDayModal({ sales, products, onClose }: Props) {
  function resolveLabel(sale: Sale): string {
    if (!sale.option_id) return `${sale.quantity_value}u`
    const product = products.find((p) => p.id === sale.product_id)
    const option = product?.options.find((o) => o.id === sale.option_id)
    return option?.label ?? `${sale.quantity_value}u`
  }
  const totalMp = sales.reduce((acc, s) => {
    if (s.payment_type === 'mp') return acc + s.amount
    if (s.payment_type === 'excepcion') return acc + (s.mp_amount ?? 0)
    return acc
  }, 0)

  const totalEf = sales.reduce((acc, s) => {
    if (s.payment_type === 'efectivo') return acc + s.amount
    if (s.payment_type === 'excepcion') return acc + (s.efectivo_amount ?? 0)
    return acc
  }, 0)

  const [cashInBox, setCashInBox] = useState('')
  const [changeLeave, setChangeLeave] = useState('')
  const [comments, setComments] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [telegram, setTelegram] = useState<TelegramState>('idle')
  const [closeId, setCloseId] = useState<string | null>(null)

  const cashNum = parseFloat(cashInBox) || 0
  const changeNum = parseFloat(changeLeave) || 0
  const treasurer = cashNum - changeNum

  async function handleSave() {
    setSaving(true)
    const snapshot: SaleSnapshotItem[] = sales.map((s, i) => ({
      sale_number: sales.length - i,
      product_label: s.product_label,
      quantity_label: resolveLabel(s),
      quantity_value: s.quantity_value,
      amount: s.payment_type === 'excepcion'
        ? (s.mp_amount ?? 0) + (s.efectivo_amount ?? 0)
        : s.amount,
      payment_type: s.payment_type,
      mp_amount: s.mp_amount ?? null,
      efectivo_amount: s.efectivo_amount ?? null,
      sold_at: s.created_at,
    }))
    const { data, error } = await supabase
      .from('day_closes')
      .insert({
        close_date: todayISO(),
        total_cash: cashNum,
        change_amount: changeNum,
        treasurer_amount: treasurer,
        comments: comments || null,
        sales_snapshot: snapshot,
      })
      .select()
      .single()
    setSaving(false)
    if (error || !data) {
      logError('Cierre del día', error ?? 'sin datos')
      return
    }
    setSaved(true)
    setCloseId(data.id)
    sendToTelegram(data.id)
  }

  async function sendToTelegram(id: string) {
    setTelegram('sending')
    try {
      await notifyTelegram(id)
      setTelegram('sent')
    } catch (err) {
      setTelegram('failed')
      logError('Enviar cierre a Telegram', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-3">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-1">Cierre del día</h2>
          <p className="text-sm text-gray-500 mb-5">{formatDate(todayISO())} — {sales.length} ventas</p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-blue-950/70 border border-blue-800 rounded-2xl p-3 text-center">
              <div className="text-xs text-blue-400 font-semibold mb-1">Total MP</div>
              <div className="text-xl font-bold text-blue-300">${totalMp.toFixed(0)}</div>
            </div>
            <div className="bg-emerald-950/70 border border-emerald-800 rounded-2xl p-3 text-center">
              <div className="text-xs text-emerald-400 font-semibold mb-1">Total Efectivo</div>
              <div className="text-xl font-bold text-emerald-300">${totalEf.toFixed(0)}</div>
            </div>
          </div>

          {!saved ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-1">Efectivo total (recaudado + cambio)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={cashInBox}
                  onChange={(e) => setCashInBox(e.target.value)}
                  className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-3 text-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-1">Cambio a dejar</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={changeLeave}
                  onChange={(e) => setChangeLeave(e.target.value)}
                  className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-3 text-lg text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-orange-500"
                />
              </div>
              {cashNum > 0 && (
                <div className="bg-amber-950/70 border border-amber-800 rounded-2xl p-3 text-center">
                  <div className="text-xs text-amber-400 font-semibold mb-1">Lleva el tesorero</div>
                  <div className="text-2xl font-bold text-amber-300">${treasurer.toFixed(0)}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-1">Comentarios</label>
                <textarea
                  rows={2}
                  placeholder="Notas del día..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-gray-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-600 text-gray-400 font-semibold active:scale-95 transition-all duration-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold active:scale-95 transition-all duration-100 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Confirmar cierre'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">✓</div>
              <p className="font-bold text-gray-100 mb-1">Día cerrado</p>
              <p className="text-sm text-gray-400 mb-4">
                Tesorero lleva: <strong className="text-amber-400">${treasurer.toFixed(0)}</strong>
              </p>

              {telegram === 'sending' && (
                <p className="text-xs text-gray-500 mb-5">Enviando la lista por Telegram...</p>
              )}
              {telegram === 'sent' && (
                <p className="text-xs text-emerald-400 mb-5">✓ Lista enviada por Telegram</p>
              )}
              {telegram === 'failed' && (
                <div className="mb-5">
                  <p className="text-xs text-amber-400 mb-2">
                    No se pudo enviar por Telegram. El cierre quedó guardado igual.
                  </p>
                  <button
                    onClick={() => closeId && sendToTelegram(closeId)}
                    className="text-xs font-semibold text-orange-400 underline active:scale-95 transition-all duration-100"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gray-700 text-gray-300 font-semibold active:scale-95 transition-all duration-100"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
