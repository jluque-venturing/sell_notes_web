import { useEffect, useState } from 'react'
import { supabase, todayISO } from '../lib/supabase'
import { logError } from '../lib/errorLog'
import type { DailySetup, PermanentSetup } from '../types'

/** A daily_setup row only exists when someone wants that one date to differ. */
export function useTodaySetup() {
  const [productIds, setProductIds] = useState<string[]>([])
  const [source, setSource] = useState<'permanent' | 'date'>('permanent')
  const [loading, setLoading] = useState(true)

  async function load() {
    const [permanent, override] = await Promise.all([
      supabase.from('permanent_setup').select('*').eq('id', 1).maybeSingle(),
      supabase.from('daily_setup').select('*').eq('setup_date', todayISO()).maybeSingle(),
    ])

    if (permanent.error) logError('Cargar configuración permanente', permanent.error)
    if (override.error) logError('Cargar configuración del día', override.error)

    const dateRow = override.data as DailySetup | null
    if (dateRow) {
      setProductIds(dateRow.product_ids ?? [])
      setSource('date')
    } else {
      setProductIds((permanent.data as PermanentSetup | null)?.product_ids ?? [])
      setSource('permanent')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('setup-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'permanent_setup' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_setup' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { productIds, source, loading, reload: load }
}
