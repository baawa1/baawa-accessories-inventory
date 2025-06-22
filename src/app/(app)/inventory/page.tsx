import React from 'react'
import ProductsListPage from './products-list'
import supabase from '../../../lib/supabaseClient'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const InventoryPage = async () => {
  
  // Fetch products with their main image (lowest display_order)
  const { data: products, error } = await supabase
    .from('products')
    .select(
      `
      id, sku, name, description, short_description, slug, cost_price, selling_price, regular_price, quantity_on_hand, category_id, brand_id, model_name, supplier_id, status, tags, reorder_level, stock_status, featured, catalog_visibility, meta, created_at, updated_at,
      product_images(product_id, image_url, display_order)
    `
    )
    .order('name', { ascending: true })

  // Fetch all product variants
  const { data: variants } = await supabase.from('product_variants').select('*')

  // Group variants by product_id
  const variantsByProductId: Record<string, any[]> = {}
  if (variants) {
    for (const variant of variants) {
      const pid = variant.product_id
      if (!variantsByProductId[pid]) variantsByProductId[pid] = []
      variantsByProductId[pid].push(variant)
    }
  }

  // Attach variants to each product
  const productsWithVariants = (products || []).map((product) => ({
    ...product,
    variants: variantsByProductId[product.id] || [],
  }))

  // Fetch all categories, brands, and suppliers for name mapping
  const [{ data: categories }, { data: brands }, { data: suppliers }] =
    await Promise.all([
      supabase.from('categories').select('id, name'),
      supabase.from('brands').select('id, name'),
      supabase.from('suppliers').select('id, name'),
    ])

  return (
    <ErrorBoundary>
      <ProductsListPage
        products={productsWithVariants}
        categories={categories || []}
        brands={brands || []}
        suppliers={suppliers || []}
        error={error}
      />
    </ErrorBoundary>
  )
}

export default InventoryPage
