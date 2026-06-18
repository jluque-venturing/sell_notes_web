import { useEffect, useState } from 'react'
import { supabase, todayISO, formatDate } from '../../lib/supabase'
import { logError } from '../../lib/errorLog'
import type { Product, DailySetup as DailySetupType } from '../../types'

interface Props {
  products: Product[]
}

export function DailySetup({ products }: Props) {
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [setup, setSetup] = useState<DailySetupType | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('daily_setup')
      .select('*')
      .eq('setup_date', selectedDate)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) logError('Cargar configuración del día', error)
        setSetup(data as DailySetupType | null)
        setLoading(false)
      })
  }, [selectedDate])

  async function toggleProduct(id: string) {
    const current = new Set(setup?.product_ids ?? [])
    if (current.has(id)) current.delete(id); else current.add(id)
    const product_ids = [...current]

    const { data, error } = await supabase
      .from('daily_setup')
      .upsert({ setup_date: selectedDate, product_ids }, { onConflict: 'setup_date' })
      .select()
      .single()

    if (error) { logError('Guardar configuración del día', error); return }
    if (data) setSetup(data as DailySetupType)
  }

  const active = new Set(setup?.product_ids ?? [])
  const activeProducts = products.filter((p) => p.is_active)
  const isToday = selectedDate === todayISO()

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Fecha a configurar</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-700 border-2 border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-orange-500 w-full"
        />
      </div>

      {!isToday && (
        <p className="text-xs text-orange-400/80 bg-orange-950/30 border border-orange-900/50 rounded-xl px-3 py-2">
          Configurando para {formatDate(selectedDate)} — los cambios solo afectan ese día
        </p>
      )}

      {loading ? (
        <p className="text-xs text-gray-600 text-center py-4">Cargando...</p>
      ) : activeProducts.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No hay productos activos</p>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            {active.size === 0 ? 'Ningún producto seleccionado' : `${active.size} producto${active.size !== 1 ? 's' : ''} activo${active.size !== 1 ? 's' : ''}`}
          </p>
          {activeProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => toggleProduct(p.id)}
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
              <span className="text-xs text-gray-500 ml-auto">{p.options.filter((o) => o.is_active).length} opciones</span>
            </button>
          ))}
        </>
      )}
    </div>
  )
}
