import { useEffect, useRef, useState } from 'react'
import { supabase, todayISO } from '../lib/supabase'
import { logError } from '../lib/errorLog'
import type { Sale, PaymentType } from '../types'

function sortDesc(arr: Sale[]) {
  return [...arr].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([])
  // tracks real DB ids we inserted/deleted locally, to filter out the realtime echo
  const myInserts = useRef<Set<string>>(new Set())
  const myDeletes = useRef<Set<string>>(new Set())

  useEffect(() => {
    const today = todayISO()

    supabase
      .from('sales')
      .select('*')
      .eq('sale_date', today)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSales(data as Sale[])
      })

    const channel = supabase
      .channel('sales-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales', filter: `sale_date=eq.${today}` },
        (payload) => {
          const incoming = payload.new as Sale
          if (myInserts.current.has(incoming.id)) {
            myInserts.current.delete(incoming.id)
            return
          }
          setSales((prev) => {
            if (prev.some((s) => s.id === incoming.id)) return prev
            return sortDesc([incoming, ...prev])
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'sales' },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          if (myDeletes.current.has(deletedId)) {
            myDeletes.current.delete(deletedId)
            return
          }
          setSales((prev) => prev.filter((s) => s.id !== deletedId))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function addSale(params: {
    product_id: string
    product_label: string
    option_id: string | null
    quantity_value: number
    payment_type: PaymentType
    amount: number
    mp_amount?: number
    efectivo_amount?: number
  }) {
    const optimisticId = crypto.randomUUID()

    const optimistic: Sale = {
      id: optimisticId,
      sale_date: todayISO(),
      created_at: new Date().toISOString(),
      mp_amount: params.mp_amount ?? null,
      efectivo_amount: params.efectivo_amount ?? null,
      _pending: true,
      ...params,
    }

    setSales((prev) => [optimistic, ...prev])

    const { data, error } = await supabase
      .from('sales')
      .insert({
        product_id: params.product_id,
        product_label: params.product_label,
        option_id: params.option_id,
        quantity_value: params.quantity_value,
        payment_type: params.payment_type,
        amount: params.amount,
        mp_amount: params.mp_amount ?? null,
        efectivo_amount: params.efectivo_amount ?? null,
        sale_date: todayISO(),
      })
      .select()
      .single()

    if (error || !data) {
      setSales((prev) =>
        prev.map((s) => (s.id === optimisticId ? { ...s, _pending: false, _error: true } : s))
      )
      logError('Guardar venta', error ?? 'sin datos')
      return
    }

    // register real DB id so realtime echo is ignored
    myInserts.current.add(data.id)

    setSales((prev) => {
      const mapped = prev.map((s) =>
        s.id === optimisticId ? { ...(data as Sale), _pending: false } : s
      )
      // dedup in case realtime already snuck in before the HTTP response
      const seen = new Set<string>()
      return mapped.filter((s) => {
        if (seen.has(s.id)) return false
        seen.add(s.id)
        return true
      })
    })

    // safety cleanup after 8s in case realtime never fired
    setTimeout(() => myInserts.current.delete(data.id), 8000)
  }

  async function deleteSale(id: string) {
    myDeletes.current.add(id)
    setSales((prev) => prev.filter((s) => s.id !== id))
    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) logError('Borrar venta', error)
    setTimeout(() => myDeletes.current.delete(id), 8000)
  }

  async function clearSales() {
    const ids = sales.map((s) => s.id)
    ids.forEach((id) => myDeletes.current.add(id))
    setSales([])
    const { error } = await supabase.from('sales').delete().eq('sale_date', todayISO())
    if (error) logError('Limpiar lista', error)
    setTimeout(() => ids.forEach((id) => myDeletes.current.delete(id)), 8000)
  }

  return { sales, addSale, deleteSale, clearSales }
}
