import React from 'react'
import { ProductForm } from '@/components/inventory/ProductForm'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Fetch categories, suppliers, and brands for dropdowns
async function fetchCategories() {
  const supabase = createServerComponentClient({ cookies })
  const { data } = await supabase.from('categories').select('id, name')
  return data || []
}
async function fetchSuppliers() {
  const supabase = createServerComponentClient({ cookies })
  const { data } = await supabase.from('suppliers').select('id, name')
  return data || []
}
async function fetchBrands() {
  const supabase = createServerComponentClient({ cookies })
  const { data } = await supabase.from('brands').select('id, name')
  return data || []
}

export default async function AddProductPage() {
  const categories = await fetchCategories()
  const suppliers = await fetchSuppliers()
  const brands = await fetchBrands()

  return (
    <div className='max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-6'>Add New Product</h1>
      <ProductForm
        categories={categories}
        suppliers={suppliers}
        brands={brands}
      />
    </div>
  )
}
