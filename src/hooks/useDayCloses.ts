import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logError } from '../lib/errorLog'
import type { DayClose, ReviewedSaleItem } from '../types'

/** Closes that have not been pushed to the accounting sheet yet. */
export function useDayCloses() {
  const [closes, setCloses] = useState<DayClose[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase
      .from('day_closes')
      .select('*')
      .is('sheet_synced_at', null)
      .order('close_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) logError('Cargar cierres pendientes', error)
    setCloses((data as DayClose[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveReview(id: string, reviewed: ReviewedSaleItem[], confirm: boolean) {
    const patch: Record<string, unknown> = { reviewed_snapshot: reviewed }
    if (confirm) patch.confirmed_at = new Date().toISOString()

    const { error } = await supabase.from('day_closes').update(patch).eq('id', id)
    if (error) {
      logError('Guardar revisión', error)
      return false
    }
    setCloses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, reviewed_snapshot: reviewed } : c))
    )
    return true
  }

  return { closes, loading, reload: load, saveReview }
}
