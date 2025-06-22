'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { productSchema, ProductFormValues, ProductFormProps } from './types'
import { saveProduct } from '@/lib/saveProduct'
import { uploadProductImages } from '@/lib/uploadProductImage'

export const useProductForm = ({
  initialValues = {},
  existingImages: existingImagesProp,
}: Pick<ProductFormProps, 'initialValues' | 'existingImages'>) => {
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])

  const productId = (initialValues as any).id

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

  const handleSubmit = useCallback(async (
    values: ProductFormValues,
    images: any[],
    variants: any[]
  ) => {
    console.log('Form handleSubmit called with:', values)
    setServerError(null)
    setLoading(true)

    try {
      let uploadedImageUrls: string[] = []
      const newImages = images.filter((img) => img.isNew && img.file)

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

      let uploadIdx = 0
      const imagesForSave = images.map((img) => {
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
          variants,
        } as any,
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
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }, [form, productId, removedImageIds])

  return {
    form,
    serverError,
    loading,
    productId,
    removedImageIds,
    setRemovedImageIds,
    handleSubmit,
    setServerError,
    setLoading,
  }
}
