import supabase from '@/lib/supabaseClient'
import { ProductFormValues } from '@/components/inventory/product-form'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function saveProduct(
  supabase: SupabaseClient,
  values: ProductFormValues & {
    images?: { id?: string; url: string; alt?: string }[]
    removedImageIds?: string[]
    variants?: {
      id?: string | number
      color?: string
      size?: string
      sku_variant: string
      price_variant?: number
      quantity_variant?: number
    }[]
  },
  id?: string
) {
  const now = new Date().toISOString()
  // Map form values to DB columns (adjust as needed for your schema)
  const data = {
    sku: values.sku,
    category_id: values.category, // assuming category is id
    brand_id: values.brand_id, // use brand_id for DB
    name: values.name, // ensure name is included
    model_name: values.model_name,
    cost_price: values.cost_price,
    selling_price: values.selling_price,
    quantity_on_hand: values.quantity_on_hand,
    supplier_id: values.supplier_id || null,
    status: values.status,
    description: values.description,
    tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : [],
    ...(id ? { updated_at: now } : { created_at: now, updated_at: now }),
  }

  let productId = id
  let createdProduct = null

  if (id) {
    // Update existing product
    const { error } = await supabase.from('products').update(data).eq('id', id)
    if (error) throw error
  } else {
    // Create new product
    const { data: created, error } = await supabase
      .from('products')
      .insert([data])
      .select()
      .single()
    if (error) throw error
    productId = created.id
    createdProduct = created
  }

  // Handle product_images table if images are provided
  if (values.images && productId) {
    // Delete only removed images (by id), not all images for the product
    if (
      id &&
      Array.isArray(values.removedImageIds) &&
      values.removedImageIds.length > 0
    ) {
      // De-duplicate and normalize removedImageIds to numbers
      const removedIds = Array.from(
        new Set(values.removedImageIds.map((id) => Number(id)))
      )
      // Fetch URLs for images to delete from storage
      const { data: toDelete, error: fetchError } = await supabase
        .from('product_images')
        .select('id, image_url')
        .in('id', removedIds)
      if (fetchError) {
        console.error('Error fetching images to delete:', fetchError)
        throw fetchError
      }
      // Remove from storage
      for (const img of toDelete || []) {
        // Extract path after bucket name
        const url = img.image_url
        const match = url.match(/product-images\/(.+)$/)
        if (match) {
          const filePath = match[0]
          const { error: storageError } = await supabase.storage
            .from('product-images')
            .remove([filePath])
          if (storageError) {
            console.error(
              'Error removing from storage:',
              storageError,
              'File:',
              filePath
            )
          }
        } else {
          console.warn('Could not extract file path from url:', url)
        }
      }
      // Remove from DB
      const { data: deletedRows, error: delError } = await supabase
        .from('product_images')
        .delete()
        .in('id', removedIds)
        .select()
      if (delError) {
        console.error('Error deleting from DB:', delError)
        throw delError
      }
    }
    // Remove duplicate URLs (keep first occurrence)
    const seen = new Set<string>()
    const removedIds = Array.isArray(values.removedImageIds)
      ? values.removedImageIds.map((id) => String(id))
      : []
    const uniqueImages = values.images.filter((img) => {
      // Defensive: skip if image id is in removedImageIds
      if (img.id && removedIds.includes(String(img.id))) return false
      if (seen.has(img.url)) return false
      seen.add(img.url)
      return true
    })
    // Only insert images that do NOT have an id (i.e., new images)
    const imagesToInsert = uniqueImages
      .filter((img) => !img.id && !removedIds.includes(String(img.id)))
      .map((img, idx) => ({
        product_id: productId,
        image_url: img.url,
        alt_text: img.alt || '',
        display_order: idx,
      }))
    // Insert only new images
    if (imagesToInsert.length > 0) {
      const { error: imgError } = await supabase
        .from('product_images')
        .insert(imagesToInsert)
      if (imgError) throw imgError
    }
    // Update alt_text and display_order for existing images
    const imagesToUpdate = uniqueImages.filter(
      (img) => img.id && !removedIds.includes(String(img.id))
    )
    for (const [idx, img] of imagesToUpdate.entries()) {
      const { data: updatedRows, error: updateError } = await supabase
        .from('product_images')
        .update({
          alt_text: img.alt || '',
          display_order: idx,
        })
        .eq('id', img.id)
        .select()
      if (updateError) {
        console.error('Error updating image:', updateError)
        throw updateError
      }
    }
  }

  // --- Product Variants CRUD ---
  if (values.variants && productId) {
    // Helper to map a variant to DB shape
    const mapVariantToDb = (variant: any) => ({
      product_id: productId,
      sku_variant: variant.sku_variant,
      color: variant.color || null,
      size: variant.size || null,
      price_variant:
        typeof variant.price_variant === 'number'
          ? variant.price_variant
          : null,
      quantity_variant:
        typeof variant.quantity_variant === 'number'
          ? variant.quantity_variant
          : null,
    })
    // Single pass: split into existing and new
    const existingVariantsToUpsert: any[] = []
    const newVariantsToInsert: any[] = []
    for (const variant of values.variants) {
      if (typeof variant.id === 'number' && !isNaN(variant.id)) {
        existingVariantsToUpsert.push({
          ...mapVariantToDb(variant),
          id: variant.id,
        })
      } else {
        newVariantsToInsert.push(mapVariantToDb(variant))
      }
    }

    // Upsert existing variants (with id)
    let upsertedIds: number[] = []
    if (existingVariantsToUpsert.length > 0) {
      const { data: upserted, error: upsertError } = await supabase
        .from('product_variants')
        .upsert(existingVariantsToUpsert)
        .select()
      if (upsertError) throw upsertError
      upsertedIds = (upserted || []).map((v: any) => v.id).filter(Boolean)
    }
    // Insert new variants (without id)
    let insertedIds: number[] = []
    if (newVariantsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('product_variants')
        .insert(newVariantsToInsert)
        .select()
      if (insertError) throw insertError
      insertedIds = (inserted || []).map((v: any) => v.id).filter(Boolean)
    }

    // Delete variants in DB that are not in the submitted list
    const { data: existingVariantsFromDb, error: fetchVarError } =
      await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', productId)
    if (fetchVarError) throw fetchVarError
    // Combine ids from upserted and inserted variants
    const submittedIds = [...upsertedIds, ...insertedIds]
    const toDelete = (existingVariantsFromDb || [])
      .map((v: { id: number }) => v.id)
      .filter((id) => !submittedIds.includes(id))
    if (toDelete.length > 0) {
      const { error: delVarError } = await supabase
        .from('product_variants')
        .delete()
        .in('id', toDelete)
      if (delVarError) throw delVarError
    }
  }

  return id
    ? { success: true, updated: true }
    : { success: true, product: createdProduct }
}

// Fetch products and their variants, then attach variants to each product
// This should be done in your data loading logic (e.g., getServerSideProps, getStaticProps, or API route)
// Example:
//
// const { data: products } = await supabase.from('products').select('*');
// const { data: variants } = await supabase.from('product_variants').select('*');
// const variantsByProductId = variants.reduce((acc, variant) => {
//   (acc[variant.product_id] = acc[variant.product_id] || []).push(variant);
//   return acc;
// }, {});
// const productsWithVariants = products.map(product => ({
//   ...product,
//   variants: variantsByProductId[product.id] || [],
// }));
// Pass productsWithVariants to your ProductsListPage as the products prop.
