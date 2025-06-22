import React, { memo, useCallback } from 'react'
import { Table as TanStackTable } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconLayoutColumns, IconChevronDown } from '@tabler/icons-react'

interface ColumnToggleProps {
  table: TanStackTable<any>
}

export const ColumnToggle = memo(function ColumnToggle({ 
  table 
}: ColumnToggleProps) {
  const getHumanLabel = useCallback((columnId: string) => {
    let humanLabel = columnId
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    
    // Special cases
    if (columnId === 'category_id') humanLabel = 'Category'
    if (columnId === 'brand_id') humanLabel = 'Brand'
    if (columnId === 'supplier_id') humanLabel = 'Supplier'
    if (columnId === 'quantity_on_hand') humanLabel = 'Quantity'
    
    return humanLabel
  }, [])

  const visibleColumns = table
    .getAllColumns()
    .filter(column => 
      typeof column.accessorFn !== 'undefined' && column.getCanHide()
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm'>
          <IconLayoutColumns />
          <span className='hidden lg:inline'>Customize Columns</span>
          <span className='lg:hidden'>Columns</span>
          <IconChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        {visibleColumns.map((column) => {
          const humanLabel = getHumanLabel(column.id)
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className='capitalize'
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {humanLabel}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
