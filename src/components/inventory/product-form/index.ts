// Main component export
export { ProductForm as default } from './ProductForm'
export { ProductForm } from './ProductForm'

// Type exports
export type {
  ProductFormValues,
  ProductFormProps,
  ProductImage,
  ProductVariant,
  ExtendedProductImage,
} from './types'

// Hook exports
export { useProductForm } from './useProductForm'
export { useSkuValidation } from './useSkuValidation'
export { useImageManagement } from './useImageManagement'
export { useProductVariants } from './useProductVariants'

// Component exports
export { BasicInfoSection } from './BasicInfoSection'
export { PricingInventorySection } from './PricingInventorySection'
export { ImageManagementSection } from './ImageManagementSection'
export { FormActions } from './FormActions'
