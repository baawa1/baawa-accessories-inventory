import { createClient } from '@/lib/supabase/server'
import { StockAdjustmentsTable } from '@/components/inventory/stock-adjustments-table'
import {
  columns,
  StockAdjustment,
} from '@/app/(app)/inventory/adjustments/columns'

async function getStockAdjustments(): Promise<StockAdjustment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stock_adjustments')
    .select(
      `
      id,
      created_at,
      adjustment_type,
      quantity_changed,
      reason,
      products (
        model_name,
        sku
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching stock adjustments:', error)
    throw error
  }

  return data.map((item: any) => ({
    id: item.id,
    createdAt: item.created_at,
    productName: item.products?.model_name || 'N/A',
    productSku: item.products?.sku || 'N/A',
    user: 'System', // Temporarily hardcoded
    adjustmentType: item.adjustment_type,
    quantityChanged: item.quantity_changed,
    reason: item.reason,
    supplier: 'N/A', // Temporarily hardcoded
  }))
}

export default async function StockAdjustmentsPage() {
  const data = await getStockAdjustments()

  return (
    <>
      <div className='mb-4 px-6 lg:px-8'>
        <h1 className='text-2xl font-bold tracking-tight'>Stock Adjustments</h1>
        <p className='text-muted-foreground'>
          A log of all inventory movements.
        </p>
      </div>
      <main className='px-6 lg:px-8'>
        <StockAdjustmentsTable columns={columns} data={data} />
      </main>
    </>
  )
}
