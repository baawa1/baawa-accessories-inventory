import React, { memo, useCallback } from 'react'
import { Table as TanStackTable } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'

interface TablePaginationProps {
  table: TanStackTable<any>
}

export const TablePagination = memo(function TablePagination({ 
  table 
}: TablePaginationProps) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()
  const totalRows = table.getFilteredRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows.length

  const handlePageSizeChange = useCallback((value: string) => {
    table.setPageSize(Number(value))
  }, [table])

  const handleFirstPage = useCallback(() => {
    table.setPageIndex(0)
  }, [table])

  const handlePreviousPage = useCallback(() => {
    table.previousPage()
  }, [table])

  const handleNextPage = useCallback(() => {
    table.nextPage()
  }, [table])

  const handleLastPage = useCallback(() => {
    table.setPageIndex(pageCount - 1)
  }, [table, pageCount])

  return (
    <div className='flex items-center justify-between px-4'>
      <div className='text-muted-foreground hidden flex-1 text-sm lg:flex'>
        {selectedRows} of {totalRows} row(s) selected.
      </div>
      <div className='flex w-full items-center gap-8 lg:w-fit'>
        <div className='hidden items-center gap-2 lg:flex'>
          <Label htmlFor='rows-per-page' className='text-sm font-medium'>
            Rows per page
          </Label>
          <Select
            value={`${pageSize}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger size='sm' className='w-20' id='rows-per-page'>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex w-fit items-center justify-center text-sm font-medium'>
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div className='ml-auto flex items-center gap-2 lg:ml-0'>
          <Button
            variant='outline'
            className='hidden h-8 w-8 p-0 lg:flex'
            onClick={handleFirstPage}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to first page</span>
            <IconChevronsLeft />
          </Button>
          <Button
            variant='outline'
            className='size-8'
            size='icon'
            onClick={handlePreviousPage}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to previous page</span>
            <IconChevronLeft />
          </Button>
          <Button
            variant='outline'
            className='size-8'
            size='icon'
            onClick={handleNextPage}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to next page</span>
            <IconChevronRight />
          </Button>
          <Button
            variant='outline'
            className='hidden size-8 lg:flex'
            size='icon'
            onClick={handleLastPage}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to last page</span>
            <IconChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
})
