import { Reconciliation } from '@/lib/types'

export interface Product {
  id: string
  name: string
  quantity_on_hand: number
  selling_price: number
  variants?: { sku_variant: string }[]
}

export interface ReconProduct extends Product {
  physicalCount: string | number
  discrepancy: number
  estimatedImpact: number
  reason: string
}

export interface StockReconciliationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  reconciliationData?: Reconciliation
  loading?: boolean
}

export const discrepancyReasons = [
  'Fraud',
  'Lost',
  'Data Entry Error',
  'Expired',
  'Others',
  'Supplier Error',
  'Overstocking',
  'Understocking',
] as const

export type DiscrepancyReason = typeof discrepancyReasons[number]
