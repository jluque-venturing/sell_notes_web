import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logError } from '../lib/errorLog'
import type { PermanentSetup } from '../types'

export function usePermanentSetup() {
  const [productIds, setProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase
      .from('permanent_setup')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (error) logError('Cargar configuración permanente', error)
    setProductIds((data as PermanentSetup | null)?.product_ids ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('permanent-setup-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'permanent_setup' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function toggle(id: string) {
    const next = productIds.includes(id)
      ? productIds.filter((p) => p !== id)
      : [...productIds, id]

    setProductIds(next)

    const { error } = await supabase
      .from('permanent_setup')
      .update({ product_ids: next, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (error) {
      logError('Guardar configuración permanente', error)
      load()
    }
  }

  return { productIds, loading, toggle, reload: load }
}
