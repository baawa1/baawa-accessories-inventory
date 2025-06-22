import React from 'react'
import { Control } from 'react-hook-form'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectField } from '../SelectField'
import { ProductFormValues } from './types'

interface BasicInfoSectionProps {
  control: Control<ProductFormValues>
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  skuStatus: 'idle' | 'loading' | 'unique' | 'not-unique'
  onSkuBlur: (value: string) => void
  onSkuChange: (value: string) => void
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  control,
  categories,
  brands,
  suppliers,
  skuStatus,
  onSkuBlur,
  onSkuChange,
}) => {
  // Sort options alphabetically by name
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name))
  const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name))
  const sortedSuppliers = [...suppliers].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SKU Field with Validation */}
        <FormField
          name="sku"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    onBlur={() => {
                      field.onBlur()
                      onSkuBlur(field.value)
                    }}
                    onChange={(e) => {
                      field.onChange(e)
                      onSkuChange(e.target.value)
                    }}
                    placeholder="Enter unique SKU"
                  />
                  {skuStatus === 'loading' && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
                  )}
                  {skuStatus === 'not-unique' && (
                    <XCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                  )}
                  {skuStatus === 'unique' && (
                    <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Name */}
        <FormField
          name="name"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter product name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <SelectField
          name="category_id"
          label="Category"
          control={control}
          options={sortedCategories.map(cat => ({ id: cat.id, name: cat.name }))}
          placeholder="Select category"
        />

        {/* Brand */}
        <SelectField
          name="brand_id"
          label="Brand"
          control={control}
          options={sortedBrands.map(brand => ({ id: brand.id, name: brand.name }))}
          placeholder="Select brand"
        />

        {/* Model Name */}
        <FormField
          name="model_name"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter model name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Supplier */}
        <SelectField
          name="supplier_id"
          label="Supplier (Optional)"
          control={control}
          options={sortedSuppliers.map(supplier => ({ id: supplier.id, name: supplier.name }))}
          placeholder="Select supplier"
        />
      </div>

      {/* Description */}
      <FormField
        name="description"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Enter product description"
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tags */}
      <FormField
        name="tags"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags (Optional)</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="Enter tags separated by commas"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
