'use client'

import React, { useState } from 'react'
import { DataTable } from '@/components/data-table'
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
import { StockReconciliationDialog } from '@/components/inventory/StockReconciliationDialog'
import { Loader2 } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

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

export default function ProductsListPage({
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
  // Helper to get category/brand/supplier name by id (robust string comparison)
  const getCategoryName = (id: string | number) =>
    categories?.find((c) => String(c.id) === String(id))?.name || String(id)
  const getBrandName = (id: string | number) =>
    brands?.find((b) => String(b.id) === String(id))?.name || String(id)
  const getSupplierName = (id: string | number) =>
    suppliers?.find((s) => String(s.id) === String(id))?.name || String(id)

  // Adapt product data to match DataTable schema
  const adaptedData = (products || []).map(
    (product: Product & { product_images?: any }) => {
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
    }
  )

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

  const handleCSVFileSelected = async (file: File) => {
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
  }

  // Filtering logic
  const filteredData = adaptedData.filter((product) => {
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

  // Sort categories and brands alphabetically by name before passing to dropdowns
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
  const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name))

  const router = useRouter()

  const handleOpenReconciliation = () => {
    setReconciliationLoading(true)
    setReconciliationDialogOpen(true)
    // Simulate loading delay (e.g., fetching, heavy mapping)
    setTimeout(() => {
      setReconciliationLoading(false)
    }, 600) // adjust as needed
  }

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
          onChange={(e) => setFilters((f) => ({ ...f, sku: e.target.value }))}
          className='w-40'
        />
        <Input
          placeholder='Filter by Name'
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
          className='w-40'
        />
        <Select
          value={filters.category_id}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, category_id: val }))
          }
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
          onValueChange={(val) => setFilters((f) => ({ ...f, brand_id: val }))}
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
          onClick={() =>
            setFilters({
              sku: '',
              name: '',
              category_id: 'all',
              brand_id: 'all',
            })
          }
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
      <DataTable data={filteredData} suppliers={suppliers} />
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
              onClick={() => {
                setUploadChoiceDialogOpen(false)
                router.push('/inventory/add')
              }}
            >
              Single Product Upload
            </Button>
            <Button
              variant='outline'
              onClick={() => {
                setUploadChoiceDialogOpen(false)
                setCSVDialogOpen(true)
              }}
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
      <StockReconciliationDialog
        open={reconciliationDialogOpen}
        onOpenChange={setReconciliationDialogOpen}
        products={adaptedData}
        loading={reconciliationLoading}
      />
    </div>
  )
}
