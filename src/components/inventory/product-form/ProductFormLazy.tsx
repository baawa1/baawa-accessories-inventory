import { lazy, Suspense } from 'react'
import { ProductFormSkeleton } from '@/components/ui/loading'

// Lazy load the ProductForm component
const LazyProductForm = lazy(() => import('./ProductForm'))

// Wrapper component with loading state
export function ProductFormLazy(props: any) {
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <LazyProductForm {...props} />
    </Suspense>
  )
}

export default ProductFormLazy
