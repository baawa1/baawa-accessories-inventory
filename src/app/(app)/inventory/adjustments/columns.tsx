'use client'

import { ColumnDef } from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ClientDate } from '@/components/inventory/ClientDate'

// Define the type for our stock adjustment data
export type StockAdjustment = {
  id: string
  createdAt: string
  productName: string
  productSku: string
  user: string
  adjustmentType:
    | 'restock'
    | 'damage'
    | 'theft'
    | 'return'
    | 'correction'
    | 'initial'
  quantityChanged: number
  reason: string
  notes?: string
  supplier_id?: string
  cost_price?: number
  supplier?: string
}

// Define the columns for the data table
export const columns: ColumnDef<StockAdjustment>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => <ClientDate date={row.original.createdAt} />,
  },
  {
    accessorKey: 'productName',
    header: 'Product',
  },
  {
    accessorKey: 'productSku',
    header: 'SKU',
  },
  {
    accessorKey: 'adjustmentType',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.adjustmentType
      let variant: 'default' | 'destructive' | 'outline' = 'default'
      if (type === 'restock') variant = 'default'
      if (['damage', 'theft', 'correction'].includes(type))
        variant = 'destructive'
      if (type === 'return') variant = 'outline'
      return <Badge variant={variant}>{type}</Badge>
    },
  },
  {
    accessorKey: 'quantityChanged',
    header: 'Quantity Change',
  },
  {
    accessorKey: 'user',
    header: 'User',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const adjustment = row.original

      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='ghost'>View Details</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Adjustment Details</DialogTitle>
              <DialogDescription>
                Detailed information about the stock adjustment.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <p className='text-sm font-medium text-muted-foreground col-span-1'>
                  Product
                </p>
                <p className='col-span-3'>
                  {adjustment.productName} ({adjustment.productSku})
                </p>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <p className='text-sm font-medium text-muted-foreground col-span-1'>
                  Date
                </p>
                <p className='col-span-3'>
                  {new Date(adjustment.createdAt).toLocaleString()}
                </p>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <p className='text-sm font-medium text-muted-foreground col-span-1'>
                  User
                </p>
                <p className='col-span-3'>{adjustment.user}</p>
              </div>
              <Separator className='my-2' />
              <div className='grid grid-cols-4 items-center gap-4'>
                <p className='text-sm font-medium text-muted-foreground col-span-1'>
                  Type
                </p>
                <p className='col-span-3'>{adjustment.adjustmentType}</p>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <p className='text-sm font-medium text-muted-foreground col-span-1'>
                  Quantity
                </p>
                <p className='col-span-3'>{adjustment.quantityChanged}</p>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <p className='text-sm font-medium text-muted-foreground col-span-1'>
                  Reason
                </p>
                <p className='col-span-3'>{adjustment.reason}</p>
              </div>
              {adjustment.notes && (
                <div className='grid grid-cols-4 items-center gap-4'>
                  <p className='text-sm font-medium text-muted-foreground col-span-1'>
                    Notes
                  </p>
                  <p className='col-span-3'>{adjustment.notes}</p>
                </div>
              )}
              {adjustment.cost_price && (
                <div className='grid grid-cols-4 items-center gap-4'>
                  <p className='text-sm font-medium text-muted-foreground col-span-1'>
                    Cost Price
                  </p>
                  <p className='col-span-3'>{adjustment.cost_price}</p>
                </div>
              )}
              {adjustment.supplier && (
                <div className='grid grid-cols-4 items-center gap-4'>
                  <p className='text-sm font-medium text-muted-foreground col-span-1'>
                    Supplier
                  </p>
                  <p className='col-span-3'>{adjustment.supplier}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )
    },
  },
]
