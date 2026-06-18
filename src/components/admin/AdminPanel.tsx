import { useState } from 'react'
import { ProductsManager } from './ProductsManager'
import { DailySetup } from './DailySetup'
import type { Product, ProductOption } from '../../types'

interface Props {
  products: Product[]
  onAddProduct: (label: string) => void
  onUpdateProduct: (id: string, u: Partial<Pick<Product, 'label' | 'is_active'>>) => void
  onDeleteProduct: (id: string) => void
  onAddOption: (productId: string, label: string, value: number, price: number) => void
  onUpdateOption: (optionId: string, productId: string, u: Partial<Pick<ProductOption, 'label' | 'value' | 'price' | 'is_active'>>) => void
  onDeleteOption: (optionId: string, productId: string) => void
  onClose: () => void
}

const TABS = ['Día', 'Productos'] as const
type Tab = typeof TABS[number]

export function AdminPanel(props: Props) {
  const [tab, setTab] = useState<Tab>('Día')

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
      <div className="bg-gray-800 border-t border-gray-700 rounded-t-3xl w-full max-w-sm shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-700">
          <h2 className="font-bold text-gray-100">Panel Admin</h2>
          <button onClick={props.onClose} className="text-gray-500 text-2xl active:scale-90 transition-all duration-100 hover:text-gray-300">×</button>
        </div>

        <div className="flex border-b border-gray-700 px-4">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold transition-all duration-150 border-b-2 ${tab === t ? 'text-orange-400 border-orange-500' : 'text-gray-500 border-transparent'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {tab === 'Día' && (
            <DailySetup products={props.products} />
          )}
          {tab === 'Productos' && (
            <ProductsManager
              products={props.products}
              onAdd={props.onAddProduct}
              onUpdate={props.onUpdateProduct}
              onDelete={props.onDeleteProduct}
              onAddOption={props.onAddOption}
              onUpdateOption={props.onUpdateOption}
              onDeleteOption={props.onDeleteOption}
            />
          )}
        </div>
      </div>
    </div>
  )
}
