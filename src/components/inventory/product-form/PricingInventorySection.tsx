import React from 'react'
import { Control } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { NumberField, SelectField } from '../SelectField'
import { ProductFormValues } from './types'

interface PricingInventorySectionProps {
  control: Control<ProductFormValues>
}

export const PricingInventorySection: React.FC<PricingInventorySectionProps> = ({
  control,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pricing & Inventory</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cost Price */}
        <NumberField
          name="cost_price"
          label="Cost Price"
          control={control}
          placeholder="0.00"
          step={0.01}
          min={0}
        />

        {/* Selling Price */}
        <NumberField
          name="selling_price"
          label="Selling Price"
          control={control}
          placeholder="0.00"
          step={0.01}
          min={0}
        />

        {/* Quantity on Hand */}
        <NumberField
          name="quantity_on_hand"
          label="Quantity on Hand"
          control={control}
          placeholder="0"
          step={1}
          min={0}
        />
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          name="status"
          label="Status"
          control={control}
          options={[
            { id: 'active', name: 'Active' },
            { id: 'archived', name: 'Archived' },
            { id: 'draft', name: 'Draft' },
          ]}
          placeholder="Select status"
        />
      </div>

      {/* Profit Margin Display */}
      <FormField
        name="cost_price"
        control={control}
        render={({ field: costField }) => (
          <FormField
            name="selling_price"
            control={control}
            render={({ field: priceField }) => {
              const costPrice = Number(costField.value) || 0
              const sellingPrice = Number(priceField.value) || 0
              const profitMargin = sellingPrice > 0 
                ? ((sellingPrice - costPrice) / sellingPrice * 100).toFixed(2)
                : '0.00'
              
              return (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <strong>Profit Margin:</strong> {profitMargin}%
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Profit Amount:</strong> ${(sellingPrice - costPrice).toFixed(2)}
                  </div>
                </div>
              )
            }}
          />
        )}
      />
    </div>
  )
}
