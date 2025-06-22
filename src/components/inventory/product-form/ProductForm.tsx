'use client'

import React, { memo, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Form } from '@/components/ui/form'
import { ProductFormProps } from './types'
import { useProductForm } from './useProductForm'
import { useSkuValidation } from './useSkuValidation'
import { useImageManagement } from './useImageManagement'
import { useProductVariants } from './useProductVariants'
import { BasicInfoSection } from './BasicInfoSection'
import { PricingInventorySection } from './PricingInventorySection'
import { ImageManagementSection } from './ImageManagementSection'
import { FormActions } from './FormActions'

export const ProductForm = memo(function ProductForm({
  initialValues = {},
  categories = [],
  suppliers = [],
  brands = [],
  isLoading = false,
  existingImages: existingImagesProp,
}: ProductFormProps) {
  const router = useRouter()
  
  // Memoize sorted data to prevent recreation on every render
  const sortedCategories = useMemo(() => 
    [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  )
  
  const sortedSuppliers = useMemo(() => 
    [...suppliers].sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers]
  )
  
  const sortedBrands = useMemo(() => 
    [...brands].sort((a, b) => a.name.localeCompare(b.name)),
    [brands]
  )
  
  // Main form logic
  const {
    form,
    serverError,
    loading,
    productId,
    removedImageIds,
    setRemovedImageIds,
    handleSubmit,
  } = useProductForm({ initialValues, existingImages: existingImagesProp })

  // SKU validation
  const { skuStatus, validateSku, resetSkuStatus } = useSkuValidation(productId)

  // Image management
  const {
    allImages,
    handleImageChange,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    handleRemoveImage,
    handleAltChange,
    handleDrop,
  } = useImageManagement(existingImagesProp)

  // Product variants
  const { variants } = useProductVariants((initialValues as any).variants)

  // Handle SKU validation
  const handleSkuBlur = (value: string) => {
    validateSku(value, form)
  }

  const handleSkuChange = () => {
    resetSkuStatus()
  }

  // Handle image removal with callback
  const handleImageRemove = (idx: number) => {
    handleRemoveImage(idx, (id: string) => {
      setRemovedImageIds(prev => [...prev, id])
    })
  }

  // Handle form submission
  const onSubmit = (values: any) => {
    handleSubmit(values, allImages, variants)
  }

  // Handle cancel
  const handleCancel = () => {
    router.back()
  }

  return (
    <Form {...form}>
      <div className="relative">
        {/* Loading Overlay */}
        {(isLoading || loading) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading spinner"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        )}

        {/* Error Display */}
        {serverError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{serverError}</p>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <BasicInfoSection
            control={form.control}
            categories={sortedCategories}
            brands={sortedBrands}
            suppliers={sortedSuppliers}
            skuStatus={skuStatus}
            onSkuBlur={handleSkuBlur}
            onSkuChange={handleSkuChange}
          />

          {/* Pricing & Inventory Section */}
          <PricingInventorySection control={form.control} />

          {/* Image Management Section */}
          <ImageManagementSection
            allImages={allImages}
            onImageChange={handleImageChange}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragEnd={handleDragEnd}
            onRemoveImage={handleImageRemove}
            onAltChange={handleAltChange}
          />

          {/* Form Actions */}
          <FormActions
            isLoading={loading}
            isEditing={!!productId}
            onCancel={handleCancel}
          />
        </form>
      </div>
    </Form>
  )
})

// Export the component as default for backward compatibility
export default ProductForm
