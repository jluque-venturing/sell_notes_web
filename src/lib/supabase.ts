import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

/** Converts "YYYY-MM-DD" → "DD/MM/AAAA" for display */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
