'use client'

import React, { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form'
import { saveProduct } from '../../lib/saveProduct'
import { uploadProductImages } from '../../lib/uploadProductImage'
import { toast } from 'sonner'
import { X, GripVertical } from 'lucide-react'

// Product form schema (basic, can be extended for variants/images)
const productSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .regex(/^\S+$/, 'SKU must not contain spaces'),
  category: z.string().min(1, 'Category is required'),
  brand_id: z.string().min(1, 'Brand is required'),
  model_name: z.string().min(1, 'Model name is required'),
  cost_price: z.coerce.number().nonnegative(),
  selling_price: z.coerce.number().nonnegative(),
  quantity_on_hand: z.coerce.number().int().nonnegative(),
  supplier_id: z.string().optional(),
  status: z.enum(['active', 'archived', 'draft']),
  description: z.string().optional(),
  tags: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
})

export type ProductFormValues = z.infer<typeof productSchema>

interface ProductImage {
  id?: string
  url: string
  alt?: string
}

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>
  categories?: { id: string; name: string }[]
  suppliers?: { id: string; name: string }[]
  brands?: { id: string; name: string }[]
  isLoading?: boolean
  existingImages?: ProductImage[]
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialValues = {},
  categories = [],
  suppliers = [],
  brands = [],
  isLoading = false,
  existingImages: existingImagesProp,
}) => {
  // Fallback: extract images from initialValues if existingImages prop is not provided
  const getInitialExistingImages = () => {
    if (existingImagesProp && existingImagesProp.length > 0)
      return existingImagesProp
    // Try to extract from initialValues (support both image_urls and product_images)
    if (Array.isArray((initialValues as any).image_urls)) {
      return (initialValues as any).image_urls.map((url: string) => ({ url }))
    }
    if (Array.isArray((initialValues as any).product_images)) {
      // If product_images is an array of objects with url/alt
      return (initialValues as any).product_images.map((img: any) => ({
        url: img.url,
        alt: img.alt,
      }))
    }
    return []
  }
  const [existingImages, setExistingImages] = React.useState<ProductImage[]>(
    getInitialExistingImages()
  )
  const [removedImageIds, setRemovedImageIds] = React.useState<string[]>([])
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: initialValues.sku || '',
      category: initialValues.category || '',
      brand_id: initialValues.brand_id || '',
      model_name: initialValues.model_name || '',
      cost_price: initialValues.cost_price || 0,
      selling_price: initialValues.selling_price || 0,
      quantity_on_hand: initialValues.quantity_on_hand || 0,
      supplier_id: initialValues.supplier_id || '',
      status: initialValues.status || 'active',
      description: initialValues.description || '',
      tags: initialValues.tags || '',
      name: initialValues.name || '',
    },
  })
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [imageFiles, setImageFiles] = React.useState<File[]>([])
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([])
  const [imageAlts, setImageAlts] = React.useState<string[]>([])
  const [uploadProgress, setUploadProgress] = React.useState<number[]>([])
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  // Use a separate id prop for edit mode
  const productId = (initialValues as any).id

  // Enhanced image validation
  const validateImage = (file: File) => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return 'Only JPG, PNG, WEBP, or GIF images are allowed.'
    }
    if (file.size > maxSize) {
      return 'Image size must be under 5MB.'
    }
    return null
  }

  // --- DRAG-AND-DROP REORDERING FOR ALL IMAGES (existing + new) ---
  // Combine existingImages and new images into a single array for unified reordering
  const [allImages, setAllImages] = React.useState<
    (ProductImage & { isNew?: boolean; file?: File; preview?: string })[]
  >([
    ...((getInitialExistingImages() as ProductImage[]).map(
      (img: ProductImage) => ({ ...img, isNew: false })
    ) || []),
  ])

  // Enhanced image change handler with validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const errors: string[] = []
    const validFiles: File[] = []
    const previews: string[] = []
    files.forEach((file) => {
      const error = validateImage(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
        previews.push(URL.createObjectURL(file))
      }
    })
    if (errors.length) {
      toast(errors.join('\n'), {
        description: 'Image validation error',
        className: 'bg-red-100 text-red-800',
      })
    }
    validFiles.forEach((file, i) => {
      setAllImages((prev) => [
        ...prev,
        {
          url: previews[i],
          alt: '',
          isNew: true,
          file,
          preview: previews[i],
        },
      ])
    })
    setImageFiles((prev) => [...prev, ...validFiles])
    setImagePreviews((prev) => [...prev, ...previews])
    setImageAlts((prev) => [...prev, ...validFiles.map(() => '')])
    setUploadProgress((prev) => [...prev, ...validFiles.map(() => 0)])
  }

  // Drag-and-drop reordering handlers
  const handleDragStart = (idx: number) => {
    dragItem.current = idx
  }
  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx
  }
  const handleDragEnd = () => {
    const from = dragItem.current
    const to = dragOverItem.current
    if (from === null || to === null || from === to) return
    const reordered = [...allImages]
    reordered.splice(to, 0, reordered.splice(from, 1)[0])
    setAllImages(reordered)
    dragItem.current = null
    dragOverItem.current = null
  }

  // Remove image (handles both new and existing)
  const handleRemoveImage = (idx: number) => {
    setAllImages((prev) => {
      const removed = prev[idx]
      if (removed && removed.id) {
        setRemovedImageIds((ids) => [...ids, removed.id!])
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  // Alt text editing
  const handleAltChange = (idx: number, value: string) => {
    setAllImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, alt: value } : img))
    )
  }

  // Drag-and-drop area
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const errors: string[] = []
    const validFiles: File[] = []
    const previews: string[] = []
    files.forEach((file) => {
      const error = validateImage(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
        previews.push(URL.createObjectURL(file))
      }
    })
    if (errors.length) {
      toast(errors.join('\n'), {
        description: 'Image validation error',
        className: 'bg-red-100 text-red-800',
      })
    }
    validFiles.forEach((file, i) => {
      setAllImages((prev) => [
        ...prev,
        {
          url: previews[i],
          alt: '',
          isNew: true,
          file,
          preview: previews[i],
        },
      ])
    })
    setImageFiles((prev) => [...prev, ...validFiles])
    setImagePreviews((prev) => [...prev, ...previews])
    setImageAlts((prev) => [...prev, ...validFiles.map(() => '')])
    setUploadProgress((prev) => [...prev, ...validFiles.map(() => 0)])
  }

  const handleSubmit = async (values: ProductFormValues) => {
    console.log('Form handleSubmit called with:', values)
    setServerError(null)
    setLoading(true)
    try {
      // --- FIXED LOGIC: Only save the images currently visible in the UI, in the correct order ---
      // 1. existingImages: images already in DB, after any removals/reordering by the user
      // 2. imageFiles/imagePreviews/imageAlts: new images added in this session (not yet uploaded)
      //    - imagePreviews and imageAlts are always in sync with imageFiles
      //    - Only upload and include these as new
      let uploadedImageUrls: string[] = []
      const newImages = allImages.filter((img) => img.isNew && img.file)
      if (newImages.length > 0) {
        try {
          uploadedImageUrls = await uploadProductImages(
            newImages.map((img) => img.file!),
            productId
          )
          console.log('Image upload result:', uploadedImageUrls)
        } catch (uploadErr) {
          console.error('Error uploading images:', uploadErr)
          setServerError('Image upload failed: ' + (uploadErr as Error).message)
          setLoading(false)
          return
        }
      }
      // Build the final image list in the order shown in the UI:
      // 1. All existingImages (already have url/alt)
      // 2. All new uploaded images (use uploadedImageUrls and imageAlts for new files)
      //    - imageAlts for new images are at the end of imageAlts array
      let uploadIdx = 0
      const imagesForSave = allImages.map((img) => {
        if (img.isNew) {
          const url = uploadedImageUrls[uploadIdx++]
          return { url, alt: img.alt }
        } else {
          return { id: img.id, url: img.url, alt: img.alt }
        }
      })
      console.log(
        'Calling saveProduct with:',
        { ...values, images: imagesForSave },
        productId
      )
      await saveProduct(
        {
          ...values,
          images: imagesForSave,
          removedImageIds,
        } as any, // type cast for extended prop
        productId
      )
      toast(
        productId
          ? 'Product updated successfully!'
          : 'Product saved successfully!',
        {
          description: productId
            ? 'Your product has been updated.'
            : 'Your product has been saved.',
        }
      )
      if (productId) {
        form.reset(values)
      } else {
        form.reset()
        setImageFiles([])
        setImagePreviews([])
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  // Sort options alphabetically by name
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
  const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name))
  const sortedSuppliers = [...suppliers].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            name='sku'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='category'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={field.onChange}
                    disabled={loading || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCategories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='brand_id'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={field.onChange}
                    disabled={loading || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select brand' />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedBrands.map((brand) => (
                        <SelectItem key={brand.id} value={String(brand.id)}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='model_name'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='cost_price'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price</FormLabel>
                <FormControl>
                  <Input type='number' step='0.01' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='selling_price'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price</FormLabel>
                <FormControl>
                  <Input type='number' step='0.01' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='quantity_on_hand'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity on Hand</FormLabel>
                <FormControl>
                  <Input type='number' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='supplier_id'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={field.onChange}
                    disabled={loading || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select supplier' />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedSuppliers.map((sup) => (
                        <SelectItem key={sup.id} value={String(sup.id)}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='status'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={loading || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='archived'>Archived</SelectItem>
                      <SelectItem value='draft'>Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='name'
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          name='description'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name='tags'
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input {...field} placeholder='Comma separated' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel>Product Images</FormLabel>
          <div
            className='border-2 border-dashed rounded p-4 mb-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400'
            tabIndex={0}
            aria-label='Drag and drop product images here or click to select'
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() =>
              document.getElementById('product-image-input')?.click()
            }
            role='button'
          >
            <p className='text-gray-500 text-sm'>
              Drag and drop images here, or click to select
            </p>
            <Input
              id='product-image-input'
              type='file'
              accept='image/*'
              multiple
              onChange={handleImageChange}
              className='hidden'
              aria-label='Select product images'
            />
          </div>
          {/* Unified image list (existing + new, reorderable) */}
          <div className='flex flex-wrap gap-2 mt-2'>
            {allImages.map((img, idx) => (
              <div
                key={img.id || img.url || idx}
                className='relative group flex flex-col items-center cursor-move'
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                tabIndex={0}
                aria-label={`Image ${idx + 1}`}
              >
                <GripVertical
                  className='absolute left-1 top-1 text-gray-400 cursor-grab'
                  size={16}
                  aria-hidden='true'
                />
                <img
                  src={img.preview || img.url}
                  alt={img.alt || `Image ${idx + 1}`}
                  className='max-h-32 rounded border mb-1'
                />
                <button
                  type='button'
                  onClick={() => handleRemoveImage(idx)}
                  className='absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs border border-gray-300 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100'
                  aria-label='Remove image'
                >
                  <X size={16} />
                </button>
                <input
                  type='text'
                  value={img.alt || ''}
                  onChange={(e) => handleAltChange(idx, e.target.value)}
                  placeholder='Alt text'
                  className='mt-1 w-full text-xs border rounded px-1 py-0.5'
                  aria-label={`Alt text for image ${idx + 1}`}
                />
                {uploadProgress[idx] > 0 && uploadProgress[idx] < 100 && (
                  <div className='w-full bg-gray-200 rounded h-1 mt-1'>
                    <div
                      className='bg-blue-500 h-1 rounded'
                      style={{ width: `${uploadProgress[idx]}%` }}
                      aria-valuenow={uploadProgress[idx]}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {serverError && (
          <div className='text-red-500 text-sm'>{serverError}</div>
        )}
        <div className='flex justify-end'>
          <Button type='submit' disabled={isLoading || loading}>
            {isLoading || loading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
