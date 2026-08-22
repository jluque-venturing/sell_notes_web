import { useState } from 'react'
import { formatDate } from '../../lib/supabase'
import { money, mpOf, efectivoOf } from '../../lib/sales'
import { useDayCloses } from '../../hooks/useDayCloses'
import { ReviewCloseDetail } from './ReviewCloseDetail'
import type { DayClose } from '../../types'

export function ReviewCloses() {
  const { closes, loading, reload, saveReview } = useDayCloses()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = closes.find((c) => c.id === selectedId) ?? null

  if (selected) {
    return (
      <ReviewCloseDetail
        close={selected}
        saveReview={saveReview}
        onBack={() => { setSelectedId(null); reload() }}
      />
    )
  }

  if (loading) {
    return <p className="text-xs text-gray-600 text-center py-6">Cargando cierres...</p>
  }

  if (closes.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">✓</div>
        <p className="text-sm font-semibold text-gray-300">Todo al día</p>
        <p className="text-xs text-gray-500 mt-1">No hay cierres pendientes de cargar al doc.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {closes.length} cierre{closes.length !== 1 ? 's' : ''} sin cargar al doc. Tocá uno para
        revisarlo.
      </p>

      {closes.map((c: DayClose) => {
        const items = c.sales_snapshot ?? []
        const total = items.reduce((acc, s) => acc + mpOf(s) + efectivoOf(s), 0)

        return (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className="w-full text-left rounded-2xl border-2 border-gray-700 bg-gray-700/40 p-3 active:scale-[0.98] transition-all duration-150"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-gray-100">{formatDate(c.close_date)}</span>
              <span className="font-bold text-sm text-orange-400">{money(total)}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">
                {items.length} venta{items.length !== 1 ? 's' : ''}
              </span>
              {items.length === 0 && (
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-800 border border-gray-600 rounded-full px-2 py-0.5">
                  vacío
                </span>
              )}
              {c.reviewed_snapshot && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-900/60 rounded-full px-2 py-0.5">
                  borrador guardado
                </span>
              )}
              {c.telegram_sent_at && (
                <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/40 border border-sky-900/60 rounded-full px-2 py-0.5">
                  ✈ enviado
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
