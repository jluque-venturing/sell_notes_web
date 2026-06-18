import { useRef, useState } from 'react'
import { ProductGrid } from './components/ProductGrid'
import { PaymentSplit } from './components/PaymentSplit'
import { SalesList } from './components/SalesList'
import { EndOfDayModal } from './components/EndOfDayModal'
import { AdminGate } from './components/admin/AdminGate'
import { AdminPanel } from './components/admin/AdminPanel'
import { PinConfigModal } from './components/admin/PinConfigModal'
import { ToastContainer } from './components/ToastContainer'
import { useSales } from './hooks/useSales'
import { useProducts } from './hooks/useProducts'
import { useDailySetup } from './hooks/useDailySetup'
import { useToasts } from './hooks/useToasts'
import type { Product } from './types'

export default function App() {
  const { toasts, dismiss } = useToasts()
  const { sales, addSale, deleteSale, clearSales } = useSales()
  const { products, addProduct, updateProduct, deleteProduct, addOption, updateOption, deleteOption } = useProducts()
  const { setup, saveSetup } = useDailySetup()

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showEndOfDay, setShowEndOfDay] = useState(false)
  const [showAdminGate, setShowAdminGate] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showPinConfig, setShowPinConfig] = useState(false)

  const tapCountRef = useRef(0)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSecretTap() {
    tapCountRef.current += 1
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0 }, 1500)
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0
      setShowAdminGate(true)
    }
  }

  const todayProducts = products.filter(
    (p) => p.is_active && (setup?.product_ids ?? []).includes(p.id)
  )

  function handleRegister(params: {
    payment_type: 'mp' | 'efectivo' | 'excepcion'
    option_id: string | null
    quantity_value: number
    mp_amount?: number
    efectivo_amount?: number
  }) {
    if (!selectedProduct) return
    const isException = params.payment_type === 'excepcion'
    const amount = isException
      ? (params.mp_amount ?? 0) + (params.efectivo_amount ?? 0)
      : (selectedProduct.options.find((o) => o.id === params.option_id)?.price ?? 0)

    addSale({
      product_id: selectedProduct.id,
      product_label: selectedProduct.label,
      option_id: params.option_id,
      quantity_value: params.quantity_value,
      payment_type: params.payment_type,
      amount,
      mp_amount: params.mp_amount,
      efectivo_amount: params.efectivo_amount,
    })
    setSelectedProduct(null)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onPointerDown={handleSecretTap}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-100 select-none"
            aria-label="admin"
          >
            <span className="text-gray-700 text-xs">●</span>
          </button>
          <h1 className="font-bold text-orange-400 text-lg">Ventas</h1>
        </div>
        <button
          onClick={() => setShowEndOfDay(true)}
          className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl active:scale-95 transition-all duration-100 shadow-sm"
        >
          Fin del día
        </button>
      </header>

      <main className="flex flex-col gap-4 p-4 pb-8">
        <section>
          {selectedProduct ? (
            <PaymentSplit
              product={selectedProduct}
              onRegister={handleRegister}
              onCancel={() => setSelectedProduct(null)}
            />
          ) : (
            <ProductGrid
              products={todayProducts}
              onSelect={setSelectedProduct}
            />
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-semibold text-gray-400 text-sm">Ventas de hoy</h2>
            <span className="text-xs text-gray-600">{sales.length} registros</span>
          </div>
          <SalesList sales={sales} products={products} onDelete={deleteSale} onClear={clearSales} />
        </section>
      </main>

      {showEndOfDay && (
        <EndOfDayModal sales={sales} products={products} onClose={() => setShowEndOfDay(false)} />
      )}

      {showAdminGate && !showAdmin && (
        <AdminGate
          onSuccess={() => { setShowAdminGate(false); setShowAdmin(true) }}
          onConfigAccess={() => { setShowAdminGate(false); setShowPinConfig(true) }}
          onCancel={() => setShowAdminGate(false)}
        />
      )}

      {showPinConfig && (
        <PinConfigModal onClose={() => setShowPinConfig(false)} />
      )}

      {showAdmin && (
        <AdminPanel
          products={products}
          onAddProduct={addProduct}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
          onAddOption={addOption}
          onUpdateOption={updateOption}
          onDeleteOption={deleteOption}
          onClose={() => setShowAdmin(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
