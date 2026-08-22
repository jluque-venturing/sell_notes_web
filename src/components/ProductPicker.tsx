import type { Product } from '../types'

interface Props {
  products: Product[]
  selected: string[]
  onToggle: (id: string) => void
}

export function ProductPicker({ products, selected, onToggle }: Props) {
  const active = new Set(selected)
  const activeProducts = products.filter((p) => p.is_active)

  if (activeProducts.length === 0) {
    return <p className="text-xs text-gray-500 text-center py-4">No hay productos activos</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {active.size === 0
          ? 'Ningún producto seleccionado'
          : `${active.size} producto${active.size !== 1 ? 's' : ''} activo${active.size !== 1 ? 's' : ''}`}
      </p>
      {activeProducts.map((p) => (
        <button
          key={p.id}
          onClick={() => onToggle(p.id)}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] ${
            active.has(p.id) ? 'border-orange-600 bg-orange-950/40' : 'border-gray-700 bg-gray-700/50'
          }`}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
            active.has(p.id) ? 'bg-orange-500 border-orange-500' : 'border-gray-600'
          }`}>
            {active.has(p.id) && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="font-semibold text-sm text-gray-100">{p.label}</span>
          <span className="text-xs text-gray-500 ml-auto">
            {p.options.filter((o) => o.is_active).length} opciones
          </span>
        </button>
      ))}
    </div>
  )
}
