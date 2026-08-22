import { useState } from 'react'
import { formatDate } from '../../lib/supabase'
import { logError } from '../../lib/errorLog'
import { syncToSheet } from '../../lib/api'
import { money, mpOf, efectivoOf, paymentLabel, paymentIcon, horaAR } from '../../lib/sales'
import { ConfirmModal } from '../ConfirmModal'
import type { DayClose, ReviewedSaleItem } from '../../types'

interface Props {
  close: DayClose
  saveReview: (id: string, reviewed: ReviewedSaleItem[], confirm: boolean) => Promise<boolean>
  onBack: () => void
}

type State = 'idle' | 'saving' | 'sending' | 'done' | 'error'

function initialItems(close: DayClose): ReviewedSaleItem[] {
  if (close.reviewed_snapshot?.length) {
    return [...close.reviewed_snapshot].sort((a, b) => a.sale_number - b.sale_number)
  }
  return [...(close.sales_snapshot ?? [])]
    .sort((a, b) => a.sale_number - b.sale_number)
    .map((s) => ({ ...s, ok: true, operation_number: null, original_amount: s.amount }))
}

export function ReviewCloseDetail({ close, saveReview, onBack }: Props) {
  const [items, setItems] = useState<ReviewedSaleItem[]>(() => initialItems(close))
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')
  const [askSend, setAskSend] = useState(false)

  const busy = state === 'saving' || state === 'sending'
  const approved = items.filter((i) => i.ok)
  const total = approved.reduce((acc, i) => acc + i.amount, 0)
  const totalMp = approved.reduce((acc, i) => acc + mpOf(i), 0)
  const totalEf = approved.reduce((acc, i) => acc + efectivoOf(i), 0)
  const edited = items.filter((i) => i.amount !== i.original_amount).length

  function patchItem(saleNumber: number, patch: Partial<ReviewedSaleItem>) {
    setItems((prev) => prev.map((i) => (i.sale_number === saleNumber ? { ...i, ...patch } : i)))
  }

  function setSplit(item: ReviewedSaleItem, field: 'mp_amount' | 'efectivo_amount', value: number) {
    const mp = field === 'mp_amount' ? value : item.mp_amount ?? 0
    const ef = field === 'efectivo_amount' ? value : item.efectivo_amount ?? 0
    patchItem(item.sale_number, { mp_amount: mp, efectivo_amount: ef, amount: mp + ef })
  }

  async function saveDraft() {
    setState('saving')
    const ok = await saveReview(close.id, items, false)
    setState(ok ? 'idle' : 'error')
    setMessage(ok ? 'Borrador guardado' : 'No se pudo guardar el borrador')
  }

  async function confirmAndSend() {
    setAskSend(false)
    setState('saving')
    const ok = await saveReview(close.id, items, true)
    if (!ok) {
      setState('error')
      setMessage('No se pudo guardar la revisión')
      return
    }

    setState('sending')
    try {
      const res = await syncToSheet(close.id)
      setState('done')
      const added = Number(res.rows_added ?? 0)
      const skipped = Number(res.skipped ?? 0)
      setMessage(
        `Se cargaron ${added} fila${added !== 1 ? 's' : ''} al doc` +
        (skipped > 0 ? ` · ${skipped} sin tildar quedaron afuera` : '')
      )
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Error desconocido')
      logError('Enviar al Google Sheet', err)
    }
  }

  if (state === 'done') {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">✓</div>
        <p className="font-bold text-gray-100 mb-1">Cargado al doc</p>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl bg-gray-700 text-gray-300 font-semibold active:scale-95 transition-all duration-100"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={onBack}
        className="text-xs font-semibold text-gray-500 hover:text-gray-300 active:scale-95 transition-all duration-100"
      >
        ← Cierres pendientes
      </button>

      <div>
        <h3 className="font-bold text-gray-100">{formatDate(close.close_date)}</h3>
        <p className="text-xs text-gray-500">
          {items.length} venta{items.length !== 1 ? 's' : ''} · {approved.length} tildada{approved.length !== 1 ? 's' : ''}
          {edited > 0 && <span className="text-amber-400"> · {edited} con monto editado</span>}
        </p>
      </div>

      {close.comments && (
        <p className="text-xs text-gray-400 bg-gray-900/50 border border-gray-700 rounded-xl px-3 py-2">
          📝 {close.comments}
        </p>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const hasMp = mpOf(item) > 0
          const isException = item.payment_type === 'excepcion'
          const wasEdited = item.amount !== item.original_amount

          return (
            <div
              key={item.sale_number}
              className={`rounded-2xl border-2 p-3 transition-all duration-150 ${
                item.ok ? 'border-gray-700 bg-gray-700/40' : 'border-gray-800 bg-gray-900/40 opacity-60'
              }`}
            >
              <button
                onClick={() => patchItem(item.sale_number, { ok: !item.ok })}
                className="w-full flex items-center gap-2.5 text-left active:scale-[0.99] transition-all duration-100"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                  item.ok ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'
                }`}>
                  {item.ok && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-xs text-gray-500 font-mono">#{item.sale_number}</span>
                <span className="font-semibold text-sm text-gray-100">{item.product_label}</span>
                <span className="text-xs text-gray-500">{item.quantity_label}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {paymentIcon(item)} {paymentLabel(item)}
                  {horaAR(item.sold_at) && ` · ${horaAR(item.sold_at)}`}
                </span>
              </button>

              <div className="mt-2.5 space-y-2 pl-7">
                {isException ? (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] text-gray-500 block mb-1">Naranja X</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={item.mp_amount ?? 0}
                        onChange={(e) => setSplit(item, 'mp_amount', Number(e.target.value) || 0)}
                        className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-gray-500 block mb-1">Efectivo</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={item.efectivo_amount ?? 0}
                        onChange={(e) => setSplit(item, 'efectivo_amount', Number(e.target.value) || 0)}
                        className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-emerald-500"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="block">
                    <span className="text-[10px] text-gray-500 block mb-1">
                      Monto
                      {wasEdited && (
                        <span className="text-amber-400"> · era {money(item.original_amount)}</span>
                      )}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={item.amount}
                      onChange={(e) => patchItem(item.sale_number, { amount: Number(e.target.value) || 0 })}
                      className={`w-full bg-gray-800 border-2 rounded-lg px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500 ${
                        wasEdited ? 'border-amber-600' : 'border-gray-600'
                      }`}
                    />
                  </label>
                )}

                {hasMp && (
                  <label className="block">
                    <span className="text-[10px] text-gray-500 block mb-1">Nº de operación Naranja X</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="pegá el número acá"
                      value={item.operation_number ?? ''}
                      onChange={(e) => patchItem(item.sale_number, { operation_number: e.target.value })}
                      className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-orange-500"
                    />
                  </label>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-3 space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>🟠 Naranja X</span><strong className="text-blue-300">{money(totalMp)}</strong>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>💵 Efectivo</span><strong className="text-emerald-300">{money(totalEf)}</strong>
        </div>
        <div className="flex justify-between text-sm text-gray-200 pt-1 border-t border-gray-700">
          <span className="font-semibold">Total a cargar</span><strong className="text-orange-400">{money(total)}</strong>
        </div>
      </div>

      {message && (
        <p className={`text-xs rounded-xl px-3 py-2 border ${
          state === 'error'
            ? 'text-red-300 bg-red-950/40 border-red-900/60'
            : 'text-gray-400 bg-gray-900/50 border-gray-700'
        }`}>
          {message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={saveDraft}
          disabled={busy}
          className="flex-1 py-3 rounded-xl border-2 border-gray-600 text-gray-400 font-semibold text-xs active:scale-95 transition-all duration-100 disabled:opacity-50"
        >
          {state === 'saving' ? 'Guardando...' : 'Guardar borrador'}
        </button>
        <button
          onClick={() => setAskSend(true)}
          disabled={busy || approved.length === 0}
          className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold text-xs active:scale-95 transition-all duration-100 disabled:opacity-50"
        >
          {state === 'sending' ? 'Enviando...' : 'Confirmar y cargar al doc'}
        </button>
      </div>

      {askSend && (
        <ConfirmModal
          tone="primary"
          confirmLabel="Cargar"
          message={
            <>
              Se van a agregar <strong>{approved.length}</strong> filas al Google Sheet por{' '}
              <strong>{money(total)}</strong>. Esto no se puede deshacer desde la app.
            </>
          }
          onConfirm={confirmAndSend}
          onCancel={() => setAskSend(false)}
        />
      )}
    </div>
  )
}
