import supabase from '@/lib/supabaseClient'
import { ProductFormValues } from '@/components/inventory/ProductForm'

export async function saveProduct(
  values: ProductFormValues & {
    images?: { id?: string; url: string; alt?: string }[]
    removedImageIds?: string[]
  },
  id?: string
) {
  console.log('saveProduct called with:', { values, id })
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
      console.log('Attempting to delete images:', removedIds)
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
          } else {
            console.log('Removed from storage:', filePath)
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
      } else {
        console.log('Deleted from DB:', deletedRows)
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
      console.log('Updating image', {
        id: img.id,
        alt: img.alt,
        display_order: idx,
        type: typeof img.id,
      })
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
      } else {
        console.log('Updated image rows:', updatedRows)
      }
    }
  }

  return id
    ? { success: true, updated: true }
    : { success: true, product: createdProduct }
}
