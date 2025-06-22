import React from 'react'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command'
import { Product } from './types'

interface ProductSearchProps {
  filteredProducts: Product[]
  commandSearch: string
  setCommandSearch: (value: string) => void
  commandComboOpen: boolean
  setCommandComboOpen: (open: boolean) => void
  commandTriggerRef: React.RefObject<HTMLInputElement | null>
  commandBoxRef: React.RefObject<HTMLDivElement | null>
  onAddProduct: (product: Product) => void
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  filteredProducts,
  commandSearch,
  setCommandSearch,
  commandComboOpen,
  setCommandComboOpen,
  commandTriggerRef,
  commandBoxRef,
  onAddProduct,
}) => {
  return (
    <div className="relative w-full">
      <Input
        ref={commandTriggerRef}
        placeholder="Search products to add to reconciliation..."
        value={commandSearch}
        onChange={(e) => setCommandSearch(e.target.value)}
        onFocus={() => setCommandComboOpen(true)}
        className="w-full"
      />
      
      {commandComboOpen && (
        <div
          ref={commandBoxRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-hidden"
        >
          <Command>
            <CommandInput
              placeholder="Search products..."
              value={commandSearch}
              onValueChange={setCommandSearch}
              className="hidden"
            />
            <CommandList className="max-h-60 overflow-y-auto">
              <CommandEmpty>No products found.</CommandEmpty>
              {filteredProducts
                .filter((p) =>
                  p.name.toLowerCase().includes(commandSearch.toLowerCase())
                )
                .slice(0, 10)
                .map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => {
                      onAddProduct(product)
                      setCommandSearch('')
                      setCommandComboOpen(false)
                    }}
                    className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">{product.name}</span>
                      <div className="text-sm text-gray-500">
                        <span className="mr-2">Stock: {product.quantity_on_hand}</span>
                        <span>₦{product.selling_price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
