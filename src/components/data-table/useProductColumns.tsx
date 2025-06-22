import React, { useMemo, useCallback } from 'react'
import Image from 'next/image'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductActions } from './ProductActions'
import {
  IconChevronUp,
  IconChevronDown,
  IconCircleCheckFilled,
} from '@tabler/icons-react'

interface Product {
  id: string
  sku: string
  name: string
  main_image_url?: string
  cost_price: number
  selling_price: number
  regular_price: number
  quantity_on_hand: number
  category_name?: string
  brand_name?: string
  supplier_name?: string
  status: string
  featured: boolean
  catalog_visibility: boolean
  tags?: string[]
  created_at: string
  updated_at: string
  variants?: any[]
}

interface UseProductColumnsProps {
  suppliers?: { id: string; name: string }[]
  onDataUpdate?: (callback: (prev: Product[]) => Product[]) => void
}

export function useProductColumns({ 
  suppliers = [], 
  onDataUpdate 
}: UseProductColumnsProps = {}) {
  const createSortableHeader = useCallback((title: string, column: any) => (
    <div
      className='flex items-center gap-1 cursor-pointer select-none'
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {title}
      {column.getIsSorted() === 'asc' ? (
        <IconChevronUp className='inline size-4' />
      ) : column.getIsSorted() === 'desc' ? (
        <IconChevronDown className='inline size-4' />
      ) : (
        <span className='opacity-30'>
          <IconChevronUp className='inline size-4' />
        </span>
      )}
    </div>
  ), [])

  const columns = useMemo((): ColumnDef<Product>[] => [
    {
      id: 'drag',
      header: '',
      cell: () => null, // Drag handle rendered in DraggableRow
      enableSorting: false,
      enableHiding: false,
      size: 32,
      minSize: 32,
      maxSize: 32,
    },
    {
      id: 'select',
      header: ({ table }) => (
        <div className='flex items-center justify-center'>
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label='Select all'
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className='flex items-center justify-center'>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label='Select row'
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'main_image',
      header: 'Image',
      cell: ({ row }) =>
        row.original.main_image_url ? (
          <Image
            src={row.original.main_image_url}
            alt={row.original.name}
            width={48}
            height={48}
            className='object-cover rounded-md'
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              background: '#eee',
              borderRadius: 6,
            }}
          />
        ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => createSortableHeader('SKU', column),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => createSortableHeader('Name', column),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'cost_price',
      header: ({ column }) => createSortableHeader('Cost Price', column),
      cell: ({ row }) =>
        row.original.cost_price !== undefined
          ? `₦${Number(row.original.cost_price).toLocaleString()}`
          : '-',
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'selling_price',
      header: ({ column }) => createSortableHeader('Selling Price', column),
      cell: ({ row }) =>
        row.original.selling_price !== undefined
          ? `₦${Number(row.original.selling_price).toLocaleString()}`
          : '-',
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'quantity_on_hand',
      header: 'Quantity',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'category_id',
      header: 'Category',
      cell: ({ row }) => row.original.category_name || '',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'brand_id',
      header: 'Brand',
      cell: ({ row }) => row.original.brand_name || '',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status?.toLowerCase()
        return (
          <span className='flex items-center gap-2'>
            {status === 'active' ? (
              <IconCircleCheckFilled className='text-green-500 size-4' />
            ) : (
              <IconCircleCheckFilled className='text-gray-400 size-4' />
            )}
            {row.original.status}
          </span>
        )
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'featured',
      header: 'Featured',
      cell: ({ row }) =>
        row.original.featured ? (
          <IconCircleCheckFilled className='text-green-500 size-4' />
        ) : (
          <IconCircleCheckFilled className='text-gray-400 size-4' />
        ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ProductActions
          row={row}
          suppliers={suppliers}
          onDataUpdate={onDataUpdate}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ], [createSortableHeader, suppliers, onDataUpdate])

  return columns
}
