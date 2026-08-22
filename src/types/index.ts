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

export interface PermanentSetup {
  id: number
  product_ids: string[]
  updated_at: string
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

export interface SaleSnapshotItem {
  sale_number: number
  product_label: string
  quantity_label: string
  quantity_value: number
  amount: number
  payment_type: string
  mp_amount: number | null
  efectivo_amount: number | null
  sold_at?: string | null
}

export interface ReviewedSaleItem extends SaleSnapshotItem {
  ok: boolean
  operation_number: string | null
  original_amount: number
}

export interface DayClose {
  id: string
  close_date: string
  total_cash: number | null
  change_amount: number | null
  treasurer_amount: number | null
  comments: string | null
  created_at: string
  sales_snapshot: SaleSnapshotItem[]
  telegram_sent_at: string | null
  confirmed_at: string | null
  sheet_synced_at: string | null
  sheet_rows_added: number | null
  reviewed_snapshot: ReviewedSaleItem[] | null
}
