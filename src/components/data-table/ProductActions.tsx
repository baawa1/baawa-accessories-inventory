import React, { memo, useState, useCallback } from 'react'
import Image from 'next/image'
import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog'
import {
  IconDotsVertical,
  IconLayoutColumns,
} from '@tabler/icons-react'

interface ProductActionsProps {
  row: Row<any>
  suppliers?: { id: string; name: string }[]
  onDataUpdate?: (callback: (prev: any[]) => any[]) => void
}

export const ProductActions = memo(function ProductActions({
  row,
  suppliers = [],
  onDataUpdate,
}: ProductActionsProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  
  const hasVariants = row.original.variants && row.original.variants.length > 0

  const handleEdit = useCallback(() => {
    window.location.href = `/inventory/edit/${row.original.id}`
  }, [row.original.id])

  const handleStockAdjustSuccess = useCallback((newQty: number) => {
    if (onDataUpdate) {
      onDataUpdate((prev) =>
        prev.map((p) =>
          p.id === row.original.id
            ? { ...p, quantity_on_hand: newQty }
            : p
        )
      )
    }
  }, [row.original.id, onDataUpdate])

  return (
    <div className='flex items-center gap-1'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' className='size-7'>
            <IconDotsVertical className='size-4' />
            <span className='sr-only'>Open row actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={handleEdit}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>
            Write Content
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>
            Push to Webflow
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className='text-red-600' onClick={() => {}}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant='ghost'
        size='icon'
        aria-label='Show Details'
        onClick={(e) => {
          e.stopPropagation()
          setDetailsOpen(true)
        }}
      >
        <IconLayoutColumns />
      </Button>
      <Button
        variant='outline'
        size='sm'
        className='text-xs'
        onClick={(e) => {
          e.stopPropagation()
          setAdjustDialogOpen(true)
        }}
      >
        Adjust Stock
      </Button>
      <StockAdjustmentDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        productId={row.original.id}
        suppliers={suppliers}
        onSuccess={handleStockAdjustSuccess}
      />
      <ProductDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        product={row.original}
        hasVariants={hasVariants}
      />
    </div>
  )
})

interface ProductDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  hasVariants: boolean
}

const ProductDetailsDialog = memo(function ProductDetailsDialog({
  open,
  onOpenChange,
  product,
  hasVariants,
}: ProductDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-full max-w-full sm:max-w-2xl max-h-[90dvh] p-0 flex flex-col'>
        <DialogHeader className='px-3 pt-3 sm:px-6 sm:pt-6'>
          <DialogTitle className='text-base sm:text-lg'>
            Product Details: {product.name}
          </DialogTitle>
          <DialogDescription>
            All product details{hasVariants ? ' and variants' : ''} at a glance
          </DialogDescription>
        </DialogHeader>
        <div className='flex-1 overflow-y-auto w-full px-3 sm:px-6 pb-3 sm:pb-4 max-h-[70dvh]'>
          <div className='flex flex-col md:flex-row gap-4 md:gap-8 items-start'>
            {product.main_image_url && (
              <div className='flex-shrink-0 mb-4 md:mb-0 w-full md:w-auto flex justify-center'>
                <Image
                  src={product.main_image_url}
                  alt={product.name}
                  width={144}
                  height={144}
                  className='w-32 h-32 md:w-36 md:h-36 object-cover rounded-lg border shadow-sm max-w-full'
                />
              </div>
            )}
            <div className='flex-1 w-full'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm'>
                <div className='col-span-2 font-semibold text-lg mb-2'>
                  General
                </div>
                <div className='font-medium text-muted-foreground'>Name</div>
                <div>{product.name}</div>
                <div className='font-medium text-muted-foreground'>SKU</div>
                <div>{product.sku}</div>
                <div className='font-medium text-muted-foreground'>Category</div>
                <div>{product.category_name || '-'}</div>
                <div className='font-medium text-muted-foreground'>Brand</div>
                <div>{product.brand_name || '-'}</div>
                <div className='font-medium text-muted-foreground'>Supplier</div>
                <div>{product.supplier_name || '-'}</div>
                <div className='font-medium text-muted-foreground'>Model</div>
                <div>{product.model_name || '-'}</div>
                <div className='font-medium text-muted-foreground'>Status</div>
                <div>
                  {product.status === 'active' ? (
                    <Badge variant='default'>Active</Badge>
                  ) : (
                    <Badge variant='secondary'>{product.status}</Badge>
                  )}
                </div>
                <div className='font-medium text-muted-foreground'>Featured</div>
                <div>
                  {product.featured ? (
                    <Badge variant='default'>Yes</Badge>
                  ) : (
                    <Badge variant='secondary'>No</Badge>
                  )}
                </div>
                <div className='font-medium text-muted-foreground'>
                  Catalog Visibility
                </div>
                <div>{product.catalog_visibility ? 'Yes' : 'No'}</div>
                <div className='font-medium text-muted-foreground'>Tags</div>
                <div>{product.tags?.join(', ') || '-'}</div>
                <div className='col-span-2'>
                  <Separator />
                </div>
                <div className='col-span-2 font-semibold text-lg mb-2'>
                  Stock & Pricing
                </div>
                <div className='font-medium text-muted-foreground'>Cost Price</div>
                <div>₦{Number(product.cost_price).toLocaleString()}</div>
                <div className='font-medium text-muted-foreground'>
                  Selling Price
                </div>
                <div>₦{Number(product.selling_price).toLocaleString()}</div>
                <div className='font-medium text-muted-foreground'>
                  Regular Price
                </div>
                <div>₦{Number(product.regular_price).toLocaleString()}</div>
                <div className='font-medium text-muted-foreground'>Quantity</div>
                <div>{product.quantity_on_hand}</div>
                <div className='font-medium text-muted-foreground'>
                  Reorder Level
                </div>
                <div>{product.reorder_level}</div>
                <div className='font-medium text-muted-foreground'>
                  Stock Status
                </div>
                <div>{product.stock_status}</div>
                <div className='col-span-2'>
                  <Separator />
                </div>
                <div className='font-medium text-muted-foreground'>
                  Created At
                </div>
                <div>{new Date(product.created_at).toLocaleString()}</div>
                <div className='font-medium text-muted-foreground'>
                  Updated At
                </div>
                <div>{new Date(product.updated_at).toLocaleString()}</div>
              </div>
            </div>
          </div>
          {hasVariants && (
            <div className='mt-6'>
              <div className='font-semibold mb-2'>Variants</div>
              <div className='overflow-x-auto'>
                <Table className='text-xs'>
                  <TableHeader>
                    <TableRow className='bg-gray-50'>
                      <TableHead className='p-2'>SKU</TableHead>
                      <TableHead className='p-2'>Color</TableHead>
                      <TableHead className='p-2'>Size</TableHead>
                      <TableHead className='p-2'>Price</TableHead>
                      <TableHead className='p-2'>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants?.map((v: any, idx: number) => (
                      <TableRow key={v.id || v.sku_variant || idx} className='border-t'>
                        <TableCell className='p-2'>{v.sku_variant}</TableCell>
                        <TableCell className='p-2'>{v.color}</TableCell>
                        <TableCell className='p-2'>{v.size}</TableCell>
                        <TableCell className='p-2'>₦{v.price_variant}</TableCell>
                        <TableCell className='p-2'>{v.quantity_variant}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className='px-3 sm:px-6 pb-3 sm:pb-6'>
          <DialogClose asChild>
            <Button variant='outline'>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
