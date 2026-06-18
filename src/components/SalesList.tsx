import { useState } from 'react'
import type { Sale, Product } from '../types'
import { ConfirmModal } from './ConfirmModal'

interface Props {
  sales: Sale[]
  products: Product[]
  onDelete?: (id: string) => void
  onClear?: () => void
}

const paymentBadge: Record<string, string> = {
  mp:        'text-blue-300 bg-blue-900/50',
  efectivo:  'text-emerald-300 bg-emerald-900/50',
  excepcion: 'text-orange-300 bg-orange-900/50',
}

const paymentShort: Record<string, string> = {
  mp: 'MP', efectivo: 'EF', excepcion: 'EXC',
}

export function SalesList({ sales, products, onDelete, onClear }: Props) {
  const [confirmSale, setConfirmSale] = useState<Sale | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  function getOptionLabel(sale: Sale): string {
    if (!sale.option_id) return sale.quantity_value.toString()
    const product = products.find((p) => p.id === sale.product_id)
    const option = product?.options.find((o) => o.id === sale.option_id)
    return option?.label ?? sale.quantity_value.toString()
  }

  if (sales.length === 0) {
    return <div className="text-center py-6 text-gray-600 text-sm">Aún no hay ventas hoy</div>
  }

  return (
    <div className="flex flex-col gap-3">
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
      {/* ticket header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-2 border-b border-gray-700">
        <span className="text-xs font-bold text-gray-500 uppercase">Producto</span>
        <span className="text-xs font-bold text-gray-500 uppercase">Cant.</span>
        <span className="text-xs font-bold text-gray-500 uppercase text-right">$</span>
        <span className="text-xs font-bold text-gray-500 uppercase text-center">Pago</span>
      </div>

      {sales.map((sale, i) => (
        <div
          key={sale.id}
          className={`
            grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-4 py-2.5
            transition-all duration-200 animate-in fade-in slide-in-from-top-1
            ${i < sales.length - 1 ? 'border-b border-gray-700/50' : ''}
            ${sale._error ? 'bg-red-950/30' : ''}
            ${sale._pending ? 'opacity-50' : ''}
          `}
        >
          <span className="font-semibold text-gray-100 text-sm truncate">
            <span className="text-gray-500 font-normal text-xs mr-1">#{sales.length - i}</span>
            {sale.product_label}
          </span>
          <span className="text-gray-300 text-sm whitespace-nowrap">{getOptionLabel(sale)}</span>
          <span className="text-gray-100 text-sm font-semibold text-right whitespace-nowrap">
            {sale.payment_type === 'excepcion'
              ? `$${((sale.mp_amount ?? 0) + (sale.efectivo_amount ?? 0)).toFixed(0)}`
              : `$${sale.amount.toFixed(0)}`
            }
          </span>
          <div className="flex items-center gap-1 justify-center">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${paymentBadge[sale.payment_type]}`}>
              {paymentShort[sale.payment_type]}
            </span>
            {sale._pending && <span className="w-2.5 h-2.5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin inline-block" />}
            {onDelete && !sale._pending && (
              <button onClick={() => setConfirmSale(sale)} className="text-gray-700 hover:text-red-400 active:scale-90 transition-all duration-100 text-base leading-none ml-0.5">×</button>
            )}
          </div>
        </div>
      ))}

      {confirmSale && onDelete && (
        <ConfirmModal
          message={
            <span className="flex flex-col items-center gap-1">
              <span className="text-gray-300 font-normal text-sm">¿Borrar esta venta?</span>
              <span className="text-gray-100 font-bold text-base">{confirmSale.product_label}</span>
              <span className="text-gray-400 text-sm">
                {getOptionLabel(confirmSale)}
                {' · '}
                ${confirmSale.payment_type === 'excepcion'
                  ? ((confirmSale.mp_amount ?? 0) + (confirmSale.efectivo_amount ?? 0)).toFixed(0)
                  : confirmSale.amount.toFixed(0)}
                {' · '}
                {paymentShort[confirmSale.payment_type]}
              </span>
            </span>
          }
          onConfirm={() => { onDelete(confirmSale.id); setConfirmSale(null) }}
          onCancel={() => setConfirmSale(null)}
        />
      )}

      {confirmClear && onClear && (
        <ConfirmModal
          message={`¿Limpiar las ${sales.length} ventas de hoy?`}
          onConfirm={() => { onClear(); setConfirmClear(false) }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>

    {onClear && sales.length > 0 && (
      <button
        onClick={() => setConfirmClear(true)}
        className="w-full py-2.5 rounded-xl bg-red-700 text-white text-sm font-semibold active:scale-95 active:bg-red-600 transition-all duration-100"
      >
        Limpiar lista
      </button>
    )}
    </div>
  )
}
