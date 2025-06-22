'use client'

import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { 
  IconChevronDown, 
  IconChevronRight,
  IconTrendingUp,
  IconPlus 
} from '@tabler/icons-react'
import { ProductRow, Supplier } from './types'
import { DataTableColumnHeader } from '../data-table-column-header'

interface UseColumnsProps {
  expandedRows: Record<string, boolean>
  onToggleExpandAction: (id: string) => void
  onStockAdjustmentAction: (productId: string, variantId?: number) => void
  suppliers: Supplier[]
}

export const useColumns = ({
  expandedRows,
  onToggleExpandAction,
  onStockAdjustmentAction,
  suppliers,
}: UseColumnsProps): ColumnDef<ProductRow>[] => {
  return useMemo(() => [
    {
      id: 'drag',
      header: '',
      cell: () => null,
      enableSorting: false,
      enableHiding: false,
      size: 32,
      minSize: 32,
      maxSize: 32,
    },
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
      minSize: 40,
      maxSize: 40,
    },
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => {
        const hasVariants = row.original.variants && row.original.variants.length > 0
        if (!hasVariants) return null
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpandAction(row.original.id)}
            className="h-6 w-6 p-0"
          >
            {expandedRows[row.original.id] ? (
              <IconChevronDown className="h-4 w-4" />
            ) : (
              <IconChevronRight className="h-4 w-4" />
            )}
          </Button>
        )
      },
      enableSorting: false,
      enableHiding: false,
      size: 32,
      minSize: 32,
      maxSize: 32,
    },
    {
      accessorKey: 'main_image_url',
      id: 'main_image',
      header: 'Image',
      cell: ({ getValue }) => {
        const imageUrl = getValue() as string
        return imageUrl ? (
          <img
            src={imageUrl}
            alt="Product"
            className="h-12 w-12 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )
      },
      enableSorting: false,
      size: 80,
      minSize: 80,
      maxSize: 80,
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="SKU" />
      ),
      cell: ({ getValue }) => (
        <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded">
          {getValue() as string}
        </code>
      ),
      size: 120,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ getValue, row }) => (
        <div className="max-w-[200px]">
          <div className="font-medium truncate">{getValue() as string}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground truncate">
              {row.original.description}
            </div>
          )}
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: 'cost_price',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cost Price" />
      ),
      cell: ({ getValue }) => {
        const price = getValue() as number
        return <span>₦{price?.toLocaleString() || '0'}</span>
      },
      size: 100,
    },
    {
      accessorKey: 'selling_price',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Selling Price" />
      ),
      cell: ({ getValue }) => {
        const price = getValue() as number
        return <span className="font-medium">₦{price?.toLocaleString() || '0'}</span>
      },
      size: 120,
    },
    {
      accessorKey: 'quantity_on_hand',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ getValue, row }) => {
        const quantity = getValue() as number
        const isLowStock = quantity <= (row.original.reorder_level || 0)
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
              {quantity} units
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStockAdjustmentAction(row.original.id)}
              className="h-6 w-6 p-0"
              title="Adjust stock"
            >
              <IconPlus className="h-3 w-3" />
            </Button>
          </div>
        )
      },
      size: 120,
    },
    {
      accessorKey: 'category_name',
      id: 'category_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ getValue }) => {
        const category = getValue() as string
        return category ? (
          <Badge variant="outline">{category}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      size: 120,
    },
    {
      accessorKey: 'brand_name',
      id: 'brand_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Brand" />
      ),
      cell: ({ getValue }) => {
        const brand = getValue() as string
        return brand ? (
          <Badge variant="outline">{brand}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
      size: 120,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ getValue }) => {
        const status = getValue() as string
        const variant = status === 'active' ? 'default' : 
                      status === 'archived' ? 'secondary' : 'destructive'
        
        return <Badge variant={variant}>{status}</Badge>
      },
      size: 100,
    },
    {
      accessorKey: 'featured',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Featured" />
      ),
      cell: ({ getValue }) => {
        const isFeatured = getValue() as boolean
        return isFeatured ? (
          <IconTrendingUp className="h-4 w-4 text-primary" />
        ) : null
      },
      size: 80,
    },
  ], [expandedRows, onToggleExpandAction, onStockAdjustmentAction])
}
