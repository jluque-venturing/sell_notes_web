import { useEffect, useState } from 'react'
import { supabase, todayISO } from '../lib/supabase'
import type { DailySetup } from '../types'

export function useDailySetup() {
  const [setup, setSetup] = useState<DailySetup | null>(null)

  async function load() {
    const { data } = await supabase
      .from('daily_setup')
      .select('*')
      .eq('setup_date', todayISO())
      .maybeSingle()
    setSetup(data as DailySetup | null)
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('daily-setup-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_setup' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function saveSetup(product_ids: string[]) {
    const { data } = await supabase
      .from('daily_setup')
      .upsert({ setup_date: todayISO(), product_ids }, { onConflict: 'setup_date' })
      .select()
      .single()
    if (data) setSetup(data as DailySetup)
  }

  return { setup, saveSetup, reload: load }
}
