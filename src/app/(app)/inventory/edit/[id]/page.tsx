import React from 'react'
import { ProductForm } from '@/components/inventory/ProductForm'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

async function fetchProduct(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('id', id)
    .single()
  return data
}
async function fetchCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('id, name')
  return data || []
}
async function fetchSuppliers() {
  const supabase = await createClient()
  const { data } = await supabase.from('suppliers').select('id, name')
  return data || []
}
async function fetchBrands() {
  const supabase = await createClient()
  const { data } = await supabase.from('brands').select('id, name')
  return data || []
}
async function fetchProductImages(productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_images')
    .select('id, image_url, alt_text, display_order')
    .eq('product_id', productId)
    .order('display_order', { ascending: true })
  return data || []
}
async function fetchProductVariants(productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true })
  return data || []
}

interface EditProductPageProps {
  params: { id: string }
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const product = await fetchProduct(params.id)
  console.log('Edit page product id:', product?.id)
  if (!product) return notFound()
  const categories = await fetchCategories()
  const suppliers = await fetchSuppliers()
  const brands = await fetchBrands()
  const productImages = await fetchProductImages(product.id)
  const productVariants = await fetchProductVariants(product.id)

  // Log fetched images and variants for debugging
  console.log('Fetched productImages:', productImages)
  console.log('Fetched productVariants:', productVariants)

  // Map category_id to category for form compatibility and ensure all select fields are strings
  const initialValues = {
    ...product,
    category: product.category_id ? String(product.category_id) : '',
    brand_id: product.brand_id ? String(product.brand_id) : '',
    supplier_id: product.supplier_id ? String(product.supplier_id) : '',
    tags: Array.isArray(product.tags)
      ? product.tags.join(',')
      : product.tags || '',
    variants: productVariants,
  }

  const existingImages = productImages.map((img) => ({
    id: img.id,
    url: img.image_url,
    alt: img.alt_text,
  }))
  console.log('Mapped existingImages for ProductForm:', existingImages)

  return (
    <div className='max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-6'>Edit Product</h1>
      <ProductForm
        initialValues={initialValues}
        categories={categories}
        suppliers={suppliers}
        brands={brands}
        existingImages={existingImages}
      />
    </div>
  )
}
