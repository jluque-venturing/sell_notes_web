import { useState } from 'react'
import type { Product } from '../types'

interface Props {
  product: Product
  onConfirm: (optionId: string | null, quantityValue: number, mpAmount: number, efectivoAmount: number) => void
  onCancel: () => void
}

export function ExceptionModal({ product, onConfirm, onCancel }: Props) {
  const activeOptions = product.options.filter((o) => o.is_active)
  const [selectedId, setSelectedId] = useState<string | null>(activeOptions[0]?.id ?? null)
  const [useCustom, setUseCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [mp, setMp] = useState('')
  const [ef, setEf] = useState('')

  const mpNum = parseFloat(mp) || 0
  const efNum = parseFloat(ef) || 0
  const finalQty = useCustom
    ? (parseInt(customValue) || 0)
    : (activeOptions.find((o) => o.id === selectedId)?.value ?? 0)
  const canConfirm = finalQty > 0 && (mpNum > 0 || efNum > 0)

  function handleConfirm() {
    if (!canConfirm) return
    onConfirm(useCustom ? null : selectedId, finalQty, mpNum, efNum)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
        <h3 className="font-bold text-lg text-red-400 mb-0.5">Excepción</h3>
        <p className="text-xs text-gray-500 mb-4">{product.label}</p>

        {/* Quick option buttons */}
        <div className="mb-1">
          <span className="text-xs text-gray-500 mb-2 block">Cantidad</span>
          <div className="flex flex-wrap gap-2">
            {activeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setSelectedId(opt.id); setUseCustom(false) }}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-100 active:scale-95 ${
                  !useCustom && selectedId === opt.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 border border-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-100 active:scale-95 ${
                useCustom ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 border border-gray-600'
              }`}
            >
              Otro
            </button>
          </div>
        </div>

        {useCustom && (
          <div className="mt-3 mb-1">
            <label className="text-xs text-gray-500 mb-1.5 block">Cantidad personalizada</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="ej: 3"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-2.5 text-base font-semibold text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-red-500"
              autoFocus
            />
          </div>
        )}

        <div className="space-y-3 mt-4">
          <div>
            <label className="text-sm font-semibold text-blue-400 block mb-1">Monto Transferencia</label>
            <input
              type="number" inputMode="decimal" placeholder="0" value={mp}
              onChange={(e) => setMp(e.target.value)}
              className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-3 text-lg font-semibold text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-emerald-400 block mb-1">Monto Efectivo</label>
            <input
              type="number" inputMode="decimal" placeholder="0" value={ef}
              onChange={(e) => setEf(e.target.value)}
              className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-3 text-lg font-semibold text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          {(mpNum > 0 || efNum > 0) && (
            <div className="text-sm text-center text-gray-400">
              Total: <span className="font-bold text-gray-100">${(mpNum + efNum).toFixed(0)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border-2 border-gray-600 text-gray-400 font-semibold active:scale-95 transition-all duration-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold active:scale-95 transition-all duration-100 disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
