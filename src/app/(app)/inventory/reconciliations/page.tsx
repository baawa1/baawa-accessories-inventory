'use client'

import ReconciliationsList from '@/components/inventory/reconciliations-list'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { Reconciliation, Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { StockReconciliationDialog } from '@/components/inventory/StockReconciliationDialog'
import { useEffect, useState } from 'react'

export default function StockReconciliationsPage() {
  const { supabase } = useAuth()
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [reconciliationDialogOpen, setReconciliationDialogOpen] =
    useState(false)
  const [reconciliationLoading, setReconciliationLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!supabase) return

    const fetchReconciliations = async () => {
      const { data, error } = await supabase
        .from('stock_reconciliations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reconciliations:', error)
      } else {
        setReconciliations(data || [])
      }
    }

    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*')

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
    }

    fetchReconciliations()
    fetchProducts()
  }, [supabase])

  const handleOpenReconciliation = () => {
    setReconciliationLoading(true)
    setReconciliationDialogOpen(true)
    // Simulate loading delay (e.g., fetching, heavy mapping)
    setTimeout(() => {
      setReconciliationLoading(false)
    }, 600) // adjust as needed
  }

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
        <Button onClick={handleOpenReconciliation} variant='secondary'>
          New Reconciliation
        </Button>
      </div>
      <Separator />
      <ReconciliationsList reconciliations={reconciliations} />

      {/* Stock Reconciliation Dialog (new) */}
      <StockReconciliationDialog
        open={reconciliationDialogOpen}
        onOpenChange={setReconciliationDialogOpen}
        products={products} // Pass the products list here
        loading={reconciliationLoading}
      />
    </div>
  )
}
