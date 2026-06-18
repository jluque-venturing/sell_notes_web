import { useState } from 'react'
import type { Product, ProductOption } from '../../types'
import { ConfirmModal } from '../ConfirmModal'

interface Props {
  products: Product[]
  onAdd: (label: string) => void
  onUpdate: (id: string, updates: Partial<Pick<Product, 'label' | 'is_active'>>) => void
  onDelete: (id: string) => void
  onAddOption: (productId: string, label: string, value: number, price: number) => void
  onUpdateOption: (optionId: string, productId: string, updates: Partial<Pick<ProductOption, 'label' | 'value' | 'price' | 'is_active'>>) => void
  onDeleteOption: (optionId: string, productId: string) => void
}

const inputClass = 'bg-gray-700 border-2 border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-orange-500'

function OptionRow({ opt, productId, onUpdate, onDelete }: {
  opt: ProductOption
  productId: string
  onUpdate: (id: string, pid: string, u: Partial<Pick<ProductOption, 'label' | 'value' | 'price' | 'is_active'>>) => void
  onDelete: (id: string, pid: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [label, setLabel] = useState(opt.label)
  const [value, setValue] = useState(opt.value.toString())
  const [price, setPrice] = useState(opt.price.toString())

  function save() {
    const v = parseInt(value), p = parseFloat(price)
    if (!label.trim() || isNaN(v) || isNaN(p)) return
    onUpdate(opt.id, productId, { label: label.trim(), value: v, price: p })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className={`flex-1 ${inputClass} border-orange-600 py-1.5 text-xs`} />
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" type="number" className={`w-16 ${inputClass} border-orange-600 py-1.5 text-xs`} />
        </div>
        <div className="flex gap-1.5">
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$" type="number" className={`flex-1 ${inputClass} border-orange-600 py-1.5 text-xs`} />
          <button onClick={save} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-sm font-bold active:scale-95">✓</button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-gray-600 text-gray-300 rounded-xl text-sm active:scale-95">✕</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdate(opt.id, productId, { is_active: !opt.is_active })}
          className={`relative w-7 h-4 rounded-full transition-all duration-200 flex-shrink-0 ${opt.is_active ? 'bg-emerald-500' : 'bg-gray-600'}`}
        >
          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all duration-200 ${opt.is_active ? 'left-[14px]' : 'left-0.5'}`} />
        </button>
        <span className="flex-1 text-xs text-gray-200 font-medium">{opt.label}</span>
        <span className="text-xs text-gray-500 bg-gray-700 rounded px-1.5 py-0.5">×{opt.value}</span>
        <span className="text-xs text-gray-300 font-semibold">${opt.price.toFixed(0)}</span>
        <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-orange-400 px-1 active:scale-90 transition-all duration-100 text-xs">✏</button>
        <button onClick={() => setConfirm(true)} className="text-gray-600 hover:text-red-400 px-1 active:scale-90 transition-all duration-100 text-sm leading-none">×</button>
      </div>
      {confirm && (
        <ConfirmModal
          message={`¿Borrar opción "${opt.label}"?`}
          onConfirm={() => { onDelete(opt.id, productId); setConfirm(false) }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </>
  )
}

function AddOptionForm({ productId, onAdd }: { productId: string; onAdd: (pid: string, label: string, value: number, price: number) => void }) {
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [price, setPrice] = useState('')

  function handleAdd() {
    const v = parseInt(value), p = parseFloat(price)
    if (!label.trim() || isNaN(v) || isNaN(p)) return
    onAdd(productId, label.trim(), v, p)
    setLabel(''); setValue(''); setPrice('')
  }

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1.5">
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-xs text-gray-500 px-1">Label</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ej: ½ doc" className={`${inputClass} py-1.5 text-xs`} />
        </div>
        <div className="w-16 flex flex-col gap-0.5">
          <span className="text-xs text-gray-500 px-1">Value</span>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="6" type="number" inputMode="numeric" className={`${inputClass} py-1.5 text-xs`} />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-xs text-gray-500 px-1">Precio</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$" type="number" inputMode="decimal" className={`${inputClass} py-1.5 text-xs`} />
        </div>
        <div className="flex flex-col justify-end">
          <button onClick={handleAdd} className="h-[34px] px-4 bg-orange-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-all duration-100">+</button>
        </div>
      </div>
    </div>
  )
}

export function ProductsManager({ products, onAdd, onUpdate, onDelete, onAddOption, onUpdateOption, onDeleteOption }: Props) {
  const [newLabel, setNewLabel] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingProd, setEditingProd] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)

  function handleAdd() {
    if (!newLabel.trim()) return
    onAdd(newLabel.trim())
    setNewLabel('')
  }

  function startEditProd(p: Product) {
    setEditingProd(p.id)
    setEditLabel(p.label)
  }

  function saveEditProd(id: string) {
    if (!editLabel.trim()) return
    onUpdate(id, { label: editLabel.trim() })
    setEditingProd(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input placeholder="Nombre del producto" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className={`flex-1 ${inputClass}`} />
        <button onClick={handleAdd} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-all duration-100">+</button>
      </div>

      {products.map((p) => (
        <div key={p.id} className="bg-gray-700 rounded-2xl overflow-hidden">
          {/* product header */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button
              onClick={() => onUpdate(p.id, { is_active: !p.is_active })}
              className={`relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${p.is_active ? 'bg-emerald-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${p.is_active ? 'left-[18px]' : 'left-0.5'}`} />
            </button>

            {editingProd === p.id ? (
              <>
                <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className={`flex-1 ${inputClass} border-orange-600 py-1`} />
                <button onClick={() => saveEditProd(p.id)} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-sm font-bold active:scale-95">✓</button>
                <button onClick={() => setEditingProd(null)} className="px-2 py-1 bg-gray-600 text-gray-300 rounded-lg text-sm active:scale-95">✕</button>
              </>
            ) : (
              <>
                <span className="flex-1 font-semibold text-sm text-gray-100">{p.label}</span>
                <span className="text-xs text-gray-500">{p.options.length} opciones</span>
                <button onClick={() => startEditProd(p)} className="text-gray-500 hover:text-orange-400 px-1.5 active:scale-90 transition-all duration-100">✏</button>
                <button onClick={() => setConfirmDelete(p)} className="text-gray-600 hover:text-red-400 px-1.5 active:scale-90 transition-all duration-100 text-lg leading-none">×</button>
                <button
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="text-gray-500 hover:text-gray-300 px-1.5 active:scale-90 transition-all duration-100 text-sm"
                >
                  {expanded === p.id ? '▲' : '▼'}
                </button>
              </>
            )}
          </div>

          {/* options */}
          {expanded === p.id && (
            <div className="border-t border-gray-600 px-3 py-2 space-y-2">
              {p.options.map((opt) => (
                <OptionRow key={opt.id} opt={opt} productId={p.id} onUpdate={onUpdateOption} onDelete={onDeleteOption} />
              ))}
              <AddOptionForm productId={p.id} onAdd={onAddOption} />
            </div>
          )}
        </div>
      ))}

      {confirmDelete && (
        <ConfirmModal
          message={`¿Borrar producto "${confirmDelete.label}"?`}
          onConfirm={() => { onDelete(confirmDelete.id); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
