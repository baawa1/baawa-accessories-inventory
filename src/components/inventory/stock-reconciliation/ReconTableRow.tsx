import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { ReconProduct, discrepancyReasons } from './types'

interface ReconTableRowProps {
  product: ReconProduct
  onPhysicalChange: (id: string, value: string) => void
  onReasonChange: (id: string, value: string) => void
  onRemove: (id: string) => void
}

export const ReconTableRow: React.FC<ReconTableRowProps> = ({
  product,
  onPhysicalChange,
  onReasonChange,
  onRemove,
}) => {
  return (
    <tr key={product.id}>
      <td className="px-2 py-1 border">{product.name}</td>
      <td className="px-2 py-1 border">
        {product.variants?.map((v) => v.sku_variant).join(', ') || '-'}
      </td>
      <td className="px-2 py-1 border">{product.quantity_on_hand} unit</td>
      <td className="px-2 py-1 border">
        <Input
          type="number"
          min="0"
          value={product.physicalCount}
          onChange={(e) => onPhysicalChange(product.id, e.target.value)}
          className="w-24"
          placeholder="Enter value"
        />
      </td>
      <td
        className={`px-2 py-1 border ${
          product.discrepancy < 0 ? 'text-red-500' : 'text-green-600'
        }`}
      >
        {product.discrepancy} unit
      </td>
      <td
        className={`px-2 py-1 border ${
          product.estimatedImpact < 0 ? 'text-red-500' : 'text-green-600'
        }`}
      >
        {product.estimatedImpact === 0
          ? '₦0.00'
          : `₦${product.estimatedImpact.toLocaleString()}`}
      </td>
      <td className="px-2 py-1 border">
        <Select
          value={product.reason}
          onValueChange={(val) => onReasonChange(product.id, val)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {discrepancyReasons.map((reason) => (
              <SelectItem key={reason} value={reason}>
                {reason}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-1 border text-center">
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => onRemove(product.id)}
          className="h-6 w-6"
        >
          ×
        </Button>
      </td>
    </tr>
  )
}
