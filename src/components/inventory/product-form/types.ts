import { z } from 'zod'

// Product form schema
export const productSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .regex(/^[^\s]+$/, 'SKU must not contain spaces'),
  category: z.string().min(1, 'Category is required'),
  brand_id: z.string().min(1, 'Brand is required'),
  model_name: z.string().min(1, 'Model name is required'),
  cost_price: z.coerce.number().gt(0, 'Cost price must be greater than 0'),
  selling_price: z.coerce
    .number()
    .gt(0, 'Selling price must be greater than 0'),
  quantity_on_hand: z.coerce.number().int().nonnegative(),
  supplier_id: z.string().optional(),
  status: z.enum(['active', 'archived', 'draft']),
  description: z.string().optional(),
  tags: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
})

export type ProductFormValues = z.infer<typeof productSchema>

// Product image interface
export interface ProductImage {
  id?: string
  url: string
  alt?: string
}

// Product variant interface
export interface ProductVariant {
  id?: string
  color?: string
  size?: string
  sku_variant: string
  price_variant?: number
  quantity_variant?: number
}

// Extended image interface for drag-and-drop
export interface ExtendedProductImage extends ProductImage {
  isNew?: boolean
  file?: File
  preview?: string
}

// Form props interface
export interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>
  categories?: { id: string; name: string }[]
  suppliers?: { id: string; name: string }[]
  brands?: { id: string; name: string }[]
  isLoading?: boolean
  existingImages?: ProductImage[]
}
