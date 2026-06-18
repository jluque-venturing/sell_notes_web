import type { Product } from '../types'

interface Props {
  products: Product[]
  onSelect: (p: Product) => void
}

const COLORS = [
  'bg-violet-700 active:bg-violet-600',
  'bg-sky-700 active:bg-sky-600',
  'bg-amber-600 active:bg-amber-500',
  'bg-rose-700 active:bg-rose-600',
  'bg-teal-700 active:bg-teal-600',
  'bg-indigo-700 active:bg-indigo-600',
]

export function ProductGrid({ products, onSelect }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-[58vh] text-gray-500 text-sm px-4 text-center">
        Sin productos para hoy. Configurá el día desde el panel admin.
      </div>
    )
  }

  const cols = products.length <= 2 ? 1 : 2
  const rows = Math.ceil(products.length / cols)
  // font size scales down as more products fill the grid
  const labelSize =
    products.length === 1 ? 'text-5xl' :
    products.length === 2 ? 'text-4xl' :
    products.length <= 4 ? 'text-3xl' : 'text-2xl'
  const subSize =
    products.length <= 2 ? 'text-base' :
    products.length <= 4 ? 'text-sm' : 'text-xs'

  return (
    <div
      className="grid gap-3 h-[58vh]"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {products.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className={`
            rounded-3xl font-bold text-white shadow-lg
            transition-all duration-150 active:scale-95 select-none
            flex flex-col items-center justify-center gap-2
            ${COLORS[i % COLORS.length]}
            ${cols === 2 && i === products.length - 1 && products.length % 2 !== 0 ? 'col-span-2' : ''}
          `}
        >
          <span className={labelSize}>{p.label}</span>
          <span className={`${subSize} opacity-60 font-normal`}>
            {p.options.filter(o => o.is_active).length} opciones
          </span>
        </button>
      ))}
    </div>
  )
}
