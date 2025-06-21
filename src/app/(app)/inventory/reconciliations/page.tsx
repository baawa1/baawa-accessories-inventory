import ReconciliationsList from '@/components/inventory/reconciliations-list'
import { Separator } from '@/components/ui/separator'
import supabase from '@/lib/supabaseClient'
import { Reconciliation } from '@/lib/types'
import { Button } from '@/components/ui/button'

export default async function StockReconciliationsPage() {
  const { data, error } = await supabase
    .from('stock_reconciliations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reconciliations:', error)
    // You might want to render an error state here
  }

  const reconciliations = (data as Reconciliation[]) || []

  return (
    <div className='space-y-6 px-6 lg:px-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Stock Reconciliations
          </h1>
          <p className='text-muted-foreground'>
            View and manage your past stock reconciliations.
          </p>
        </div>
        <Button>New Reconciliation</Button>
      </div>
      <Separator />
      <ReconciliationsList reconciliations={reconciliations} />
    </div>
  )
}
