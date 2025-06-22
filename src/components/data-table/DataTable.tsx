'use client'

import React, { useState, memo, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog'
import { DataTableProps } from './types'
import { useTableState } from './useTableState'
import { useColumns } from './useColumns'
import { DataTableToolbar } from './DataTableToolbar'
import { DataTableContent } from './DataTableContent'
import { DataTablePagination } from './DataTablePagination'

export const DataTable = memo(function DataTable({ data: initialData, suppliers = [] }: DataTableProps) {
  const {
    data,
    tableState,
    updateTableState,
    toggleRowExpansion,
    reorderData,
  } = useTableState(initialData)

  // Stock adjustment dialog state
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>()

  // Memoize handlers to prevent recreation on every render
  const handleStockAdjustment = useCallback((productId: string, variantId?: number) => {
    setSelectedProductId(productId)
    setSelectedVariantId(variantId)
    setStockDialogOpen(true)
  }, [])

  const handleStockDialogSuccess = useCallback(() => {
    setStockDialogOpen(false)
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      reorderData(String(active.id), String(over?.id))
    }
  }, [reorderData])

  // Get columns with handlers
  const columns = useColumns({
    expandedRows: tableState.expandedRows,
    onToggleExpandAction: toggleRowExpansion,
    onStockAdjustmentAction: handleStockAdjustment,
    suppliers,
  })

  // Setup table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: tableState.sorting,
      columnVisibility: tableState.columnVisibility,
      rowSelection: tableState.rowSelection,
      columnFilters: tableState.columnFilters,
      pagination: tableState.pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' 
        ? updater(tableState.rowSelection) 
        : updater
      updateTableState({ rowSelection: newSelection })
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function'
        ? updater(tableState.sorting)
        : updater
      updateTableState({ sorting: newSorting })
    },
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function'
        ? updater(tableState.columnFilters)
        : updater
      updateTableState({ columnFilters: newFilters })
    },
    onColumnVisibilityChange: (updater) => {
      const newVisibility = typeof updater === 'function'
        ? updater(tableState.columnVisibility)
        : updater
      updateTableState({ columnVisibility: newVisibility })
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function'
        ? updater(tableState.pagination)
        : updater
      updateTableState({ pagination: newPagination })
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
  })

  // DnD sensors - memoize to prevent recreation
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = data.map(({ id }) => id)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DataTableToolbar table={table} />

      {/* Table Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
          <DataTableContent 
            table={table} 
            expandedRows={tableState.expandedRows}
            onStockAdjustmentAction={handleStockAdjustment}
          />
        </SortableContext>
      </DndContext>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        productId={selectedProductId}
        variantId={selectedVariantId}
        suppliers={suppliers}
        onSuccess={handleStockDialogSuccess}
      />
    </div>
  )
})
