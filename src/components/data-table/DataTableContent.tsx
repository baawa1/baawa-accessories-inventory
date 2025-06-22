'use client'

import React, { memo, useCallback } from 'react'
import { Table, flexRender } from '@tanstack/react-table'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import { ProductTableData, ProductVariant } from './types'
import { DragHandle } from './DragHandle'

interface DataTableContentProps {
  table: Table<ProductTableData>
  expandedRows: Record<string, boolean>
  onStockAdjustmentAction: (productId: string, variantId?: number) => void
}

interface SortableRowProps {
  row: any
  expandedRows: Record<string, boolean>
  onStockAdjustmentAction: (productId: string, variantId?: number) => void
}

const SortableRow = memo(function SortableRow({ row, expandedRows, onStockAdjustmentAction }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isExpanded = expandedRows[row.original.id] || false

  const handleVariantStockAdjustment = useCallback((variantId: number) => {
    onStockAdjustmentAction(row.original.id, variantId)
  }, [onStockAdjustmentAction, row.original.id])

  return (
    <>
      {/* Main Product Row */}
      <TableRow
        ref={setNodeRef}
        style={style}
        data-state={row.getIsSelected() && 'selected'}
        className={isDragging ? 'bg-muted/50' : ''}
      >
        {row.getVisibleCells().map((cell: any) => (
          <TableCell key={cell.id} className="p-4">          {cell.column.id === 'dragHandle' ? (
            <DragHandle attributes={attributes} listeners={listeners} />
          ) : (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            )}
          </TableCell>
        ))}
      </TableRow>

      {/* Variants Expansion */}
      {isExpanded && row.original.variants && row.original.variants.length > 0 && (
        <>
          <TableRow>
            <TableCell colSpan={row.getVisibleCells().length} className="p-0">
              <div className="bg-muted/30 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Product Variants ({row.original.variants.length})
                  </span>
                </div>
                <div className="grid gap-3">
                  {row.original.variants.map((variant: ProductVariant) => (
                    <Card key={variant.id} className="p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
                        {/* Variant Info */}
                        <div className="md:col-span-2">
                          <div className="font-medium">{variant.sku_variant || variant.name || 'Variant'}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {variant.sku_variant || variant.sku || 'N/A'}
                          </div>
                        </div>

                        {/* Attributes */}
                        <div className="flex flex-wrap gap-1">
                          {variant.color && (
                            <Badge variant="outline" className="text-xs">
                              Color: {variant.color}
                            </Badge>
                          )}
                          {variant.size && (
                            <Badge variant="outline" className="text-xs">
                              Size: {variant.size}
                            </Badge>
                          )}
                          {variant.attributes && Object.entries(variant.attributes).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>

                        {/* Stock */}
                        <div className="text-center">
                          <div className="font-medium">{variant.quantity_variant || variant.quantity || 0}</div>
                          <div className="text-xs text-muted-foreground">in stock</div>
                        </div>

                        {/* Price */}
                        <div className="text-center">
                          <div className="font-medium">₦{(variant.price_variant || variant.sellingPrice || 0).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            Cost: ₦{(variant.costPrice || 0).toLocaleString()}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVariantStockAdjustment(variant.id)}
                          >
                            Adjust Stock
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TableCell>
          </TableRow>
        </>
      )}
    </>
  )
})

export const DataTableContent = memo(function DataTableContent({ 
  table, 
  expandedRows, 
  onStockAdjustmentAction 
}: DataTableContentProps) {
  return (
    <div className="rounded-md border">
      <UITable>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="p-4">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <SortableRow
                key={row.id}
                row={row}
                expandedRows={expandedRows}
                onStockAdjustmentAction={onStockAdjustmentAction}
              />
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </UITable>
    </div>
  )
})
