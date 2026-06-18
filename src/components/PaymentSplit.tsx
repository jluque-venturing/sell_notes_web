import { useState } from 'react'
import type { Product, PaymentType } from '../types'
import { ExceptionModal } from './ExceptionModal'

interface Props {
  product: Product
  onRegister: (params: {
    payment_type: PaymentType
    option_id: string | null
    quantity_value: number
    mp_amount?: number
    efectivo_amount?: number
  }) => void
  onCancel: () => void
}

function OptionsGrid({ options, onSelect, btnClass }: {
  options: Product['options']
  onSelect: (id: string, value: number) => void
  btnClass: string
}) {
  const cols = options.length === 1 ? 1 : 2
  const rows = Math.ceil(options.length / cols)

  return (
    <div
      className="flex-1 grid gap-2 min-h-0"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {options.map((opt, i) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id, opt.value)}
          className={`
            rounded-2xl font-semibold transition-all duration-100 active:scale-95
            flex flex-col items-center justify-center gap-0.5
            ${btnClass}
            ${cols === 2 && i === options.length - 1 && options.length % 2 !== 0 ? 'col-span-2' : ''}
          `}
        >
          <span className="text-base font-bold">{opt.label}</span>
          <span className="text-sm opacity-70">${opt.price.toFixed(0)}</span>
        </button>
      ))}
    </div>
  )
}

export function PaymentSplit({ product, onRegister, onCancel }: Props) {
  const [showException, setShowException] = useState(false)
  const activeOptions = product.options.filter((o) => o.is_active)

  return (
    <>
      <div className="flex flex-col gap-2 h-[58vh] animate-in fade-in duration-150">
        <div className="text-center text-sm font-semibold text-orange-400 flex-none">
          {product.label}
        </div>

        {/* MP / Transferencia */}
        <div className="flex-1 min-h-0 flex flex-col bg-blue-950/60 border-2 border-blue-800 rounded-3xl p-3">
          <div className="text-center text-base font-bold text-blue-400 mb-2 flex-none tracking-wide">
            TRANSFERENCIA
          </div>
          <OptionsGrid
            options={activeOptions}
            onSelect={(id, value) => onRegister({ payment_type: 'mp', option_id: id, quantity_value: value })}
            btnClass="bg-blue-900/60 border border-blue-700 active:bg-blue-800 text-blue-100"
          />
        </div>

        {/* Excepción pill */}
        <button
          onClick={() => setShowException(true)}
          className="flex-none py-3.5 rounded-2xl bg-red-700 active:bg-red-600 active:scale-95 transition-all duration-100 text-white font-bold text-base text-center shadow-lg"
        >
          EXCEPCIÓN
        </button>

        {/* Efectivo */}
        <div className="flex-1 min-h-0 flex flex-col bg-emerald-950/60 border-2 border-emerald-800 rounded-3xl p-3">
          <div className="text-center text-base font-bold text-emerald-400 mb-2 flex-none tracking-wide">
            EFECTIVO
          </div>
          <OptionsGrid
            options={activeOptions}
            onSelect={(id, value) => onRegister({ payment_type: 'efectivo', option_id: id, quantity_value: value })}
            btnClass="bg-emerald-900/60 border border-emerald-700 active:bg-emerald-800 text-emerald-100"
          />
        </div>

        <button
          onClick={onCancel}
          className="flex-none text-center text-sm text-gray-600 active:text-gray-400 transition-all duration-100 py-1"
        >
          Cancelar
        </button>
      </div>

      {showException && (
        <ExceptionModal
          product={product}
          onConfirm={(optionId, qty, mp, ef) => {
            onRegister({ payment_type: 'excepcion', option_id: optionId, quantity_value: qty, mp_amount: mp, efectivo_amount: ef })
            setShowException(false)
          }}
          onCancel={() => setShowException(false)}
        />
      )}
    </>
  )
}
