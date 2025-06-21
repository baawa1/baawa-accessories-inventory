export type Product = {
  id: string
  name: string
  sku: string
  category_id: string
  brand_id: string
  supplier_id: string
  price: number
  stock: number
  quantity_on_hand: number
  selling_price: number
  description?: string
  created_at: string
  updated_at: string
}

export type Reconciliation = {
  id: string
  reconciliation_date: string
  status: string
  notes: string
  created_at: string
  user_id: string
  user_email: string
  data: string // JSON string containing product details
}
