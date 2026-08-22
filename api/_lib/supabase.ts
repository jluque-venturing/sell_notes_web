import type { SnapshotItem } from './format'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_ANON_KEY

export interface DayCloseRow {
  id: string
  close_date: string
  total_cash: number | string | null
  change_amount: number | string | null
  treasurer_amount: number | string | null
  comments: string | null
  created_at: string
  sales_snapshot: SnapshotItem[] | null
  reviewed_snapshot: SnapshotItem[] | null
  telegram_sent_at: string | null
  confirmed_at: string | null
  sheet_synced_at: string | null
  sheet_rows_added: number | null
}

function headers() {
  if (!URL || !KEY) throw new Error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY')
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function getDayClose(id: string): Promise<DayCloseRow | null> {
  const res = await fetch(`${URL}/rest/v1/day_closes?id=eq.${encodeURIComponent(id)}&select=*`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  const rows = (await res.json()) as DayCloseRow[]
  return rows[0] ?? null
}

export async function patchDayClose(id: string, patch: Record<string, unknown>) {
  const res = await fetch(`${URL}/rest/v1/day_closes?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
}
