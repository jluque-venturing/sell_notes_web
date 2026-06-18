import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Product, ProductOption } from '../types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])

  async function load() {
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .order('label')
    const { data: opts } = await supabase
      .from('product_options')
      .select('*')
      .order('value')

    if (prods) {
      const optsByProduct = (opts ?? []).reduce<Record<string, ProductOption[]>>((acc, o) => {
        ;(acc[o.product_id] ??= []).push(o as ProductOption)
        return acc
      }, {})
      setProducts(
        (prods as Omit<Product, 'options'>[]).map((p) => ({
          ...p,
          options: optsByProduct[p.id] ?? [],
        }))
      )
    }
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_options' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function addProduct(label: string) {
    const { data } = await supabase
      .from('products')
      .insert({ label })
      .select()
      .single()
    if (data) setProducts((prev) => [...prev, { ...(data as Omit<Product, 'options'>), options: [] }])
  }

  async function updateProduct(id: string, updates: Partial<Pick<Product, 'label' | 'is_active'>>) {
    await supabase.from('products').update(updates).eq('id', id)
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  async function deleteProduct(id: string) {
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  async function addOption(productId: string, label: string, value: number, price: number) {
    const { data } = await supabase
      .from('product_options')
      .insert({ product_id: productId, label, value, price })
      .select()
      .single()
    if (data) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, options: [...p.options, data as ProductOption].sort((a, b) => a.value - b.value) }
            : p
        )
      )
    }
  }

  async function updateOption(optionId: string, productId: string, updates: Partial<Pick<ProductOption, 'label' | 'value' | 'price' | 'is_active'>>) {
    await supabase.from('product_options').update(updates).eq('id', optionId)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, options: p.options.map((o) => (o.id === optionId ? { ...o, ...updates } : o)) }
          : p
      )
    )
  }

  async function deleteOption(optionId: string, productId: string) {
    await supabase.from('product_options').delete().eq('id', optionId)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, options: p.options.filter((o) => o.id !== optionId) }
          : p
      )
    )
  }

  return { products, addProduct, updateProduct, deleteProduct, addOption, updateOption, deleteOption, reload: load }
}
