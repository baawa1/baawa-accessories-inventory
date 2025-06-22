import { lazy, Suspense } from 'react'
import { StockReconciliationSkeleton } from '@/components/ui/loading'

// Lazy load the StockReconciliationDialog component with named export
const LazyStockReconciliationDialog = lazy(() => 
  import('./StockReconciliationDialog').then(module => ({ 
    default: module.StockReconciliationDialog 
  }))
)

// Wrapper component with loading state
export function StockReconciliationDialogLazy(props: any) {
  return (
    <Suspense fallback={<StockReconciliationSkeleton />}>
      <LazyStockReconciliationDialog {...props} />
    </Suspense>
  )
}

export default StockReconciliationDialogLazy
