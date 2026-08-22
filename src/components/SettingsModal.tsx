import { ProductPicker } from './ProductPicker'
import { usePermanentSetup } from '../hooks/usePermanentSetup'
import type { Product } from '../types'

interface Props {
  products: Product[]
  todaySource: 'permanent' | 'date'
  onClose: () => void
}

export function SettingsModal({ products, todaySource, onClose }: Props) {
  const { productIds, loading, toggle } = usePermanentSetup()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
      <div className="bg-gray-800 border-t border-gray-700 rounded-t-3xl w-full max-w-sm shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-700">
          <h2 className="font-bold text-gray-100">Ajustes</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl active:scale-90 transition-all duration-100 hover:text-gray-300">×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm text-gray-200">Permanente para mostrar</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Estos productos aparecen todos los días, sin tener que configurar nada.
            </p>
          </div>

          {todaySource === 'date' && (
            <p className="text-xs text-amber-400/90 bg-amber-950/30 border border-amber-900/50 rounded-xl px-3 py-2">
              Hoy hay una configuración puntual que reemplaza al permanente. Se cambia desde el
              Panel Admin → Día.
            </p>
          )}

          {loading ? (
            <p className="text-xs text-gray-600 text-center py-4">Cargando...</p>
          ) : (
            <ProductPicker products={products} selected={productIds} onToggle={toggle} />
          )}
        </div>
      </div>
    </div>
  )
}
