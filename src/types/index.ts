export interface ProductOption {
  id: string
  product_id: string
  label: string
  value: number
  price: number
  is_active: boolean
}

export interface Product {
  id: string
  label: string
  is_active: boolean
  created_at: string
  options: ProductOption[]
}

export interface DailySetup {
  id: string
  setup_date: string
  product_ids: string[]
}

export type PaymentType = 'mp' | 'efectivo' | 'excepcion'

export interface Sale {
  id: string
  product_id: string
  product_label: string
  option_id: string | null
  quantity_value: number
  payment_type: PaymentType
  amount: number
  mp_amount: number | null
  efectivo_amount: number | null
  sale_date: string
  created_at: string
  _pending?: boolean
  _error?: boolean
}

export interface DayClose {
  id: string
  close_date: string
  total_cash: number | null
  change_amount: number | null
  treasurer_amount: number | null
  comments: string | null
  created_at: string
}
