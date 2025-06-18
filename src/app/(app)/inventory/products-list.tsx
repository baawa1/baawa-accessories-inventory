import React from 'react'
import { DataTable } from '@/components/data-table'
import { supabase } from '@/lib/supabaseClient'

const columns = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'model_name', header: 'Name' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'brand', header: 'Brand' },
  { accessorKey: 'quantity_on_hand', header: 'Stock' },
  { accessorKey: 'selling_price', header: 'Price' },
]

export default async function ProductsListPage() {
  // Server-side fetching of products from Supabase
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, sku, model_name, category, brand, quantity_on_hand, selling_price'
    )
    .order('model_name', { ascending: true })
    .limit(20)

  type Product = {
    id: string
    sku: string
    model_name: string
    category: string
    brand: string
    quantity_on_hand: number
    selling_price: number
  }

  // Adapt product data to match DataTable schema for now
  const adaptedData = (data || []).map((product: Product, idx: number) => ({
    id: product.id || idx,
    header: product.model_name || product.sku,
    type: product.category || '',
    status: product.quantity_on_hand > 0 ? 'In Stock' : 'Out of Stock',
    target: product.brand || '',
    limit: product.selling_price ? product.selling_price.toString() : '',
    reviewer: 'Assign reviewer', // Placeholder
  }))

  if (error) {
    return (
      <div className='p-6 text-red-500'>
        Error loading products: {error.message}
      </div>
    )
  }

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>Products</h1>
      {/* TODO: Refactor DataTable to accept dynamic columns for real product fields */}
      <DataTable data={adaptedData} />
    </div>
  )
}
