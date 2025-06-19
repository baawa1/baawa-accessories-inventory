// Utility for uploading images to Supabase Storage
import supabase from '@/lib/supabaseClient'

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export async function uploadProductImage(file: File, productId?: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${productId || 'temp'}-${Date.now()}.${fileExt}`
  const filePath = `products/${fileName}`

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return publicUrlData?.publicUrl || null
}

export async function uploadProductImages(files: File[], productId?: string) {
  console.log('Uploading images for product_id:', productId)
  const uploadedUrls: string[] = []
  for (const file of files) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId || 'temp'}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${fileExt}`
    const filePath = `products/${fileName}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })
    if (error) throw error
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)
    if (publicUrlData?.publicUrl) {
      uploadedUrls.push(publicUrlData.publicUrl)
    }
  }
  return uploadedUrls
}
