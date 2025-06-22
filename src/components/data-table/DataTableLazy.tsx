import { lazy, Suspense } from 'react'
import { DataTableSkeleton } from '@/components/ui/loading'

// Lazy load the DataTable component
const LazyDataTable = lazy(() => import('./DataTable').then(m => ({ default: m.DataTable })))

// Wrapper component with loading state
export function DataTableLazy(props: any) {
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <LazyDataTable {...props} />
    </Suspense>
  )
}

export default DataTableLazy
