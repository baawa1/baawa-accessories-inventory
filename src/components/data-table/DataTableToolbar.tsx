'use client'

import React from 'react'
import { Table } from '@tanstack/react-table'
import { Search, SlidersHorizontal, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ProductTableData } from './types'

interface DataTableToolbarProps {
  table: Table<ProductTableData>
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length
  
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Search and Filters */}
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:space-x-2">
        {/* Global Search */}
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Input
            placeholder="Filter by category..."
            value={(table.getColumn('category_id')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('category_id')?.setFilterValue(event.target.value)
            }
            className="w-full md:w-[200px]"
          />
        </div>

        {/* Clear Filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Selected Items Info */}
        {selectedRowsCount > 0 && (
          <Badge variant="secondary" className="mr-2">
            {selectedRowsCount} selected
          </Badge>
        )}

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-8"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== 'undefined' && column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            // TODO: Implement export functionality
            console.log('Export clicked')
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  )
}
