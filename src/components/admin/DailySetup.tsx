import { useEffect, useState } from 'react'
import { supabase, todayISO, formatDate } from '../../lib/supabase'
import { logError } from '../../lib/errorLog'
import { ProductPicker } from '../ProductPicker'
import { usePermanentSetup } from '../../hooks/usePermanentSetup'
import type { Product, DailySetup as DailySetupType } from '../../types'

interface Props {
  products: Product[]
}

const MODES = ['Permanente', 'Día puntual'] as const
type Mode = typeof MODES[number]

export function DailySetup({ products }: Props) {
  const permanent = usePermanentSetup()
  const [mode, setMode] = useState<Mode>('Permanente')
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [override, setOverride] = useState<DailySetupType | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode !== 'Día puntual') return
    setLoading(true)
    supabase
      .from('daily_setup')
      .select('*')
      .eq('setup_date', selectedDate)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) logError('Cargar configuración del día', error)
        setOverride(data as DailySetupType | null)
        setLoading(false)
      })
  }, [selectedDate, mode])

  async function saveOverride(product_ids: string[]) {
    const { data, error } = await supabase
      .from('daily_setup')
      .upsert({ setup_date: selectedDate, product_ids }, { onConflict: 'setup_date' })
      .select()
      .single()

    if (error) { logError('Guardar configuración del día', error); return }
    if (data) setOverride(data as DailySetupType)
  }

  async function removeOverride() {
    const { error } = await supabase.from('daily_setup').delete().eq('setup_date', selectedDate)
    if (error) { logError('Quitar excepción del día', error); return }
    setOverride(null)
  }

  function toggleOverrideProduct(id: string) {
    const current = new Set(override?.product_ids ?? [])
    if (current.has(id)) current.delete(id); else current.add(id)
    saveOverride([...current])
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 bg-gray-900/60 p-1 rounded-xl">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
              mode === m ? 'bg-gray-700 text-orange-400' : 'text-gray-500'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'Permanente' ? (
        <>
          <p className="text-xs text-gray-500">
            Lo que se muestra todos los días, salvo que una fecha tenga excepción.
          </p>
          {permanent.loading ? (
            <p className="text-xs text-gray-600 text-center py-4">Cargando...</p>
          ) : (
            <ProductPicker products={products} selected={permanent.productIds} onToggle={permanent.toggle} />
          )}
        </>
      ) : (
        <>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Fecha con configuración distinta</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 border-2 border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-orange-500 w-full"
            />
          </div>

          {loading ? (
            <p className="text-xs text-gray-600 text-center py-4">Cargando...</p>
          ) : !override ? (
            <>
              <p className="text-xs text-gray-500 bg-gray-900/50 border border-gray-700 rounded-xl px-3 py-2">
                El {formatDate(selectedDate)} usa el permanente. Creá una excepción solo si ese día
                se vende algo distinto.
              </p>
              <button
                onClick={() => saveOverride(permanent.productIds)}
                className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-sm active:scale-95 transition-all duration-100"
              >
                Crear excepción para el {formatDate(selectedDate)}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-orange-400/80 bg-orange-950/30 border border-orange-900/50 rounded-xl px-3 py-2">
                Excepción activa para el {formatDate(selectedDate)} — no afecta a los demás días
              </p>
              <ProductPicker
                products={products}
                selected={override.product_ids ?? []}
                onToggle={toggleOverrideProduct}
              />
              <button
                onClick={removeOverride}
                className="w-full py-2.5 rounded-xl border-2 border-gray-600 text-gray-400 font-semibold text-xs active:scale-95 transition-all duration-100"
              >
                Quitar excepción y volver al permanente
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
