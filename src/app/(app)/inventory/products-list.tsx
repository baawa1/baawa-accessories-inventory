'use client'

import React, { useState, useMemo, useCallback, memo } from 'react'
import { DataTableLazy } from '@/components/data-table/DataTableLazy'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CSVImportDialog } from '@/components/inventory/CSVImportDialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { StockReconciliationDialogLazy } from '@/components/inventory/stock-reconciliation/StockReconciliationDialogLazy'

interface Category {
  id: string
  name: string
}
interface Brand {
  id: string
  name: string
}
interface Supplier {
  id: string
  name: string
}
interface Product {
  id: string
  sku: string
  name: string
  description: string
  short_description: string
  slug: string
  cost_price: number
  selling_price: number
  regular_price: number
  quantity_on_hand: number
  category_id: string | number
  brand_id: string | number
  model_name: string
  supplier_id: string | number
  status: string
  tags: string[]
  reorder_level: number
  stock_status: string
  featured: boolean
  catalog_visibility: boolean
  meta: any
  created_at: string
  updated_at: string
  product_images?: { image_url: string; display_order: number }[]
  variants?: {
    id: number
    sku_variant: string
    color: string
    size: string
    price_variant: number
    quantity_variant: number
  }[]
}

const ProductsListPage = memo(function ProductsListPage({
  products,
  categories,
  brands,
  suppliers,
  error,
}: {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  suppliers: Supplier[]
  error?: any
}) {
  // Memoize helper functions to prevent recreation on every render
  const getCategoryName = useCallback((id: string | number) =>
    categories?.find((c) => String(c.id) === String(id))?.name || String(id),
    [categories]
  )
  
  const getBrandName = useCallback((id: string | number) =>
    brands?.find((b) => String(b.id) === String(id))?.name || String(id),
    [brands]
  )
  
  const getSupplierName = useCallback((id: string | number) =>
    suppliers?.find((s) => String(s.id) === String(id))?.name || String(id),
    [suppliers]
  )

  // Memoize adapted data to prevent expensive recalculation
  const adaptedData = useMemo(() => {
    return (products || []).map((product: Product & { product_images?: any }) => {
      // Handle product_images as array or single object
      let imagesArr: { image_url: string; display_order: number }[] = []
      if (Array.isArray(product.product_images)) {
        imagesArr = product.product_images
      } else if (
        product.product_images &&
        typeof product.product_images === 'object'
      ) {
        imagesArr = [product.product_images]
      }
      let main_image_url = ''
      if (imagesArr.length > 0) {
        const sorted = [...imagesArr].sort(
          (a, b) => a.display_order - b.display_order
        )
        main_image_url = sorted[0]?.image_url || ''
      }
      return {
        ...product,
        category_id: product.category_id?.toString() || '',
        brand_id: product.brand_id?.toString() || '',
        supplier_id: product.supplier_id?.toString() || '',
        main_image_url,
        category_name: getCategoryName(product.category_id),
        brand_name: getBrandName(product.brand_id),
        supplier_name: getSupplierName(product.supplier_id),
      }
    })
  }, [products, getCategoryName, getBrandName, getSupplierName])

  const [filters, setFilters] = useState({
    sku: '',
    name: '',
    category_id: 'all',
    brand_id: 'all',
  })
  const [csvDialogOpen, setCSVDialogOpen] = useState(false)
  const [csvUploading, setCSVUploading] = useState(false)
  const [csvError, setCSVError] = useState<string | undefined>(undefined)
  const [uploadChoiceDialogOpen, setUploadChoiceDialogOpen] = useState(false)
  const [reconciliationDialogOpen, setReconciliationDialogOpen] =
    useState(false)
  const [reconciliationLoading, setReconciliationLoading] = useState(false)

  const handleCSVFileSelected = useCallback(async (file: File) => {
    setCSVUploading(true)
    setCSVError(undefined)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        body: formData,
      })
      const contentType = res.headers.get('content-type')
      if (res.ok && contentType && contentType.includes('text/csv')) {
        // Download the CSV result
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'bulk-upload-status.csv'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        setCSVDialogOpen(false)
      } else {
        // Try to parse error JSON
        let data
        try {
          data = await res.json()
        } catch {
          data = { error: 'Unknown error' }
        }
        throw new Error(data.error || 'Bulk upload failed')
      }
    } catch (e: any) {
      setCSVError(e.message || 'Failed to upload CSV')
    } finally {
      setCSVUploading(false)
    }
  }, [])

  // Memoize filtering logic to prevent recalculation on every render
  const filteredData = useMemo(() => {
    return adaptedData.filter((product) => {
      const matchesSku =
        !filters.sku ||
        product.sku?.toLowerCase().includes(filters.sku.toLowerCase())
      const matchesName =
        !filters.name ||
        product.name?.toLowerCase().includes(filters.name.toLowerCase())
      const matchesCategory =
        filters.category_id === 'all' ||
        product.category_id === filters.category_id
      const matchesBrand =
        filters.brand_id === 'all' || product.brand_id === filters.brand_id
      return matchesSku && matchesName && matchesCategory && matchesBrand
    })
  }, [adaptedData, filters])

  // Memoize sorted categories and brands to prevent recreation
  const sortedCategories = useMemo(() => 
    [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  )
  
  const sortedBrands = useMemo(() => 
    [...brands].sort((a, b) => a.name.localeCompare(b.name)),
    [brands]
  )

  const router = useRouter()

  const handleOpenReconciliation = useCallback(() => {
    setReconciliationLoading(true)
    setReconciliationDialogOpen(true)
    // Simulate loading delay (e.g., fetching, heavy mapping)
    setTimeout(() => {
      setReconciliationLoading(false)
    }, 600) // adjust as needed
  }, [])

  // Memoize filter handlers to prevent recreation
  const handleSkuFilterChange = useCallback((value: string) => {
    setFilters((f) => ({ ...f, sku: value }))
  }, [])

  const handleNameFilterChange = useCallback((value: string) => {
    setFilters((f) => ({ ...f, name: value }))
  }, [])

  const handleCategoryFilterChange = useCallback((value: string) => {
    setFilters((f) => ({ ...f, category_id: value }))
  }, [])

  const handleBrandFilterChange = useCallback((value: string) => {
    setFilters((f) => ({ ...f, brand_id: value }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({
      sku: '',
      name: '',
      category_id: 'all',
      brand_id: 'all',
    })
  }, [])

  const handleAddProductClick = useCallback(() => {
    setUploadChoiceDialogOpen(false)
    router.push('/inventory/add')
  }, [router])

  const handleBulkUploadClick = useCallback(() => {
    setUploadChoiceDialogOpen(false)
    setCSVDialogOpen(true)
  }, [])

  if (error) {
    return (
      <div className='p-6 text-red-500'>
        Error loading products: {error.message}
      </div>
    )
  }

  return (
    <div className='p-6 lg:px-8'>
      <h1 className='text-2xl font-bold mb-4'>Products</h1>
      <div className='flex flex-wrap gap-4 mb-4 items-center'>
        <Input
          placeholder='Filter by SKU'
          value={filters.sku}
          onChange={(e) => handleSkuFilterChange(e.target.value)}
          className='w-40'
        />
        <Input
          placeholder='Filter by Name'
          value={filters.name}
          onChange={(e) => handleNameFilterChange(e.target.value)}
          className='w-40'
        />
        <Select
          value={filters.category_id}
          onValueChange={handleCategoryFilterChange}
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Filter by Category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            {sortedCategories?.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.brand_id}
          onValueChange={handleBrandFilterChange}
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Filter by Brand' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Brands</SelectItem>
            {sortedBrands?.map((brand: any) => (
              <SelectItem key={brand.id} value={brand.id.toString()}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          className='px-3 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300'
          onClick={handleClearFilters}
        >
          Clear Filters
        </button>
        <div className='ml-auto flex gap-2'>
          <Button onClick={handleOpenReconciliation} variant='secondary'>
            Stock Reconciliation
          </Button>
          <Button
            onClick={() => setUploadChoiceDialogOpen(true)}
            variant='default'
          >
            Add Product
          </Button>
        </div>
      </div>
      <DataTableLazy data={filteredData} suppliers={suppliers} />
      {/* Add Product Choice Dialog */}
      <Dialog
        open={uploadChoiceDialogOpen}
        onOpenChange={setUploadChoiceDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-center'>Add Product</DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-4 pt-4'>
            <Button
              variant='default'
              onClick={handleAddProductClick}
            >
              Single Product Upload
            </Button>
            <Button
              variant='outline'
              onClick={handleBulkUploadClick}
            >
              Bulk Upload via CSV
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setUploadChoiceDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={csvDialogOpen}
        onOpenChange={setCSVDialogOpen}
        onFileSelected={handleCSVFileSelected}
        uploading={csvUploading}
        error={csvError}
      />
      {/* Stock Reconciliation Dialog (new) */}
      <StockReconciliationDialogLazy
        open={reconciliationDialogOpen}
        onOpenChange={setReconciliationDialogOpen}
        products={adaptedData}
        loading={reconciliationLoading}
      />
    </div>
  )
})

ProductsListPage.displayName = 'ProductsListPage'

export default ProductsListPage
