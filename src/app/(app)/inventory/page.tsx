import React from 'react'
import ProductsListPage from './products-list'
import supabase from '../../../lib/supabaseClient'

const InventoryPage = async () => {
  // Fetch products with their main image (lowest display_order)
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id, sku, name, description, short_description, slug, cost_price, selling_price, regular_price, quantity_on_hand, category_id, brand_id, model_name, supplier_id, status, tags, reorder_level, stock_status, featured, catalog_visibility, meta, created_at, updated_at,
      product_images(product_id, image_url, display_order)
    `
    )
    .order('name', { ascending: true })

  // Fetch all categories, brands, and suppliers for name mapping
  const [{ data: categories }, { data: brands }, { data: suppliers }] =
    await Promise.all([
      supabase.from('categories').select('id, name'),
      supabase.from('brands').select('id, name'),
      supabase.from('suppliers').select('id, name'),
    ])

  return (
    <ProductsListPage
      products={data || []}
      categories={categories || []}
      brands={brands || []}
      suppliers={suppliers || []}
      error={error}
    />
  )
}

export default InventoryPage
