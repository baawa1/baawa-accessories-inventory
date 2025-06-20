'use client'

import * as React from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
  IconChevronUp,
} from '@tabler/icons-react'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { toast } from 'sonner'
import { z } from 'zod'

import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog'

// Extend the schema to include category_name and brand_name for display
export const schema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string(),
  short_description: z.string(),
  slug: z.string(),
  cost_price: z.number(),
  selling_price: z.number(),
  regular_price: z.number(),
  quantity_on_hand: z.number(),
  category_id: z.string(),
  brand_id: z.string(),
  model_name: z.string(),
  supplier_id: z.string(),
  status: z.string(),
  tags: z.array(z.string()),
  reorder_level: z.number(),
  stock_status: z.string(),
  featured: z.boolean(),
  catalog_visibility: z.boolean(),
  meta: z.any(),
  created_at: z.string(),
  updated_at: z.string(),
  main_image_url: z.string().optional(),
  category_name: z.string().optional(),
  brand_name: z.string().optional(),
  supplier_name: z.string().optional(),
})

// Move DEFAULT_VISIBLE_COLUMNS and COLUMN_VIS_KEY above DataTable for scope
const DEFAULT_VISIBLE_COLUMNS = {
  drag: true,
  select: true,
  main_image: true,
  sku: true,
  name: true,
  cost_price: true,
  selling_price: true,
  quantity_on_hand: true,
  category_id: true,
  brand_id: true,
  status: true,
  featured: true,
  // All others default to false
  description: false,
  short_description: false,
  slug: false,
  regular_price: false,
  supplier_id: false,
  model_name: false,
  tags: false,
  reorder_level: false,
  stock_status: false,
  catalog_visibility: false,
  meta: false,
  created_at: false,
  updated_at: false,
}
const COLUMN_VIS_KEY = 'inventory_table_column_visibility'

// Create a separate component for the drag handle
function DragHandle({
  attributes,
  listeners,
}: {
  attributes: any
  listeners: any
}) {
  return (
    <Button
      {...attributes}
      {...listeners}
      variant='ghost'
      size='icon'
      className='text-muted-foreground size-7 hover:bg-transparent'
    >
      <IconGripVertical className='text-muted-foreground size-3' />
      <span className='sr-only'>Drag to reorder</span>
    </Button>
  )
}

// Fix: Move ProductRow type definition above DataTable so it is in scope
// (This is safe because we always attach variants in the data loading logic)
type ProductRow = z.infer<typeof schema> & { variants?: any[] }

// Move columns definition inside DataTable so it can access expandedRows and handleToggleExpand
export function DataTable({
  data: initialData,
  suppliers = [],
}: {
  data: ProductRow[]
  suppliers?: { id: string; name: string }[]
}) {
  const [data, setData] = React.useState(() => initialData)
  // Sync local data state with prop changes
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(DEFAULT_VISIBLE_COLUMNS)

  // On mount (client only), update from localStorage if available
  React.useEffect(() => {
    const saved = localStorage.getItem(COLUMN_VIS_KEY)
    if (saved) setColumnVisibility(JSON.parse(saved))
  }, [])

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  // Remove useMemo for dataIds, just use the latest data order
  const dataIds = data.map(({ id }) => id)

  const [expandedRows, setExpandedRows] = React.useState<{
    [id: string]: boolean
  }>({})
  function handleToggleExpand(id: string) {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // columns must be inside DataTable to access expandedRows and handleToggleExpand
  const columns: ColumnDef<ProductRow>[] = [
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
          <img
            src={row.original.main_image_url}
            alt={row.original.name}
            style={{
              width: 48,
              height: 48,
              objectFit: 'cover',
              borderRadius: 6,
            }}
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
      header: ({ column }) => (
        <div
          className='flex items-center gap-1 cursor-pointer select-none'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          SKU
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
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <div
          className='flex items-center gap-1 cursor-pointer select-none'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
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
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'short_description',
      header: 'Short Description',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'cost_price',
      header: ({ column }) => (
        <div
          className='flex items-center gap-1 cursor-pointer select-none'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Cost Price
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
      ),
      cell: ({ row }) =>
        row.original.cost_price !== undefined
          ? `₦${Number(row.original.cost_price).toLocaleString()}`
          : '-',
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'selling_price',
      header: ({ column }) => (
        <div
          className='flex items-center gap-1 cursor-pointer select-none'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Selling Price
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
      ),
      cell: ({ row }) =>
        row.original.selling_price !== undefined
          ? `₦${Number(row.original.selling_price).toLocaleString()}`
          : '-',
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'regular_price',
      header: 'Regular Price',
      cell: ({ row }) =>
        row.original.regular_price !== undefined
          ? `₦${Number(row.original.regular_price).toLocaleString()}`
          : '-',
      enableSorting: false,
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
      cell: ({ row }) =>
        row.original.category_name ? row.original.category_name : '',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'brand_id',
      header: 'Brand',
      cell: ({ row }) =>
        row.original.brand_name ? row.original.brand_name : '',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'supplier_id',
      header: 'Supplier',
      cell: ({ row }) =>
        row.original.supplier_name ? row.original.supplier_name : '',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'model_name',
      header: 'Model Name',
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
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => row.original.tags?.join(', '),
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'reorder_level',
      header: 'Reorder Level',
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'stock_status',
      header: 'Stock Status',
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
      accessorKey: 'catalog_visibility',
      header: 'Catalog Visibility',
      cell: ({ row }) =>
        row.original.catalog_visibility ? (
          <IconCircleCheckFilled className='text-green-500 size-4' />
        ) : (
          <IconCircleCheckFilled className='text-gray-400 size-4' />
        ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <div
          className='flex items-center gap-1 cursor-pointer select-none'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created At
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
      ),
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'updated_at',
      header: ({ column }) => (
        <div
          className='flex items-center gap-1 cursor-pointer select-none'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Updated At
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
      ),
      cell: ({ row }) => new Date(row.original.updated_at).toLocaleString(),
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        // Dialog state for product details
        const [open, setOpen] = React.useState(false)
        // Dialog state for stock adjustment
        const [adjustDialogOpen, setAdjustDialogOpen] = React.useState(false)
        const hasVariants =
          (row.original as ProductRow).variants &&
          (row.original as ProductRow).variants!.length > 0
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
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = `/inventory/edit/${row.original.id}`
                  }}
                >
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
                setOpen(true)
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
              onSuccess={(newQty) => {
                // Update the product's quantity in the table immediately
                setData((prev) =>
                  prev.map((p) =>
                    p.id === row.original.id
                      ? { ...p, quantity_on_hand: newQty }
                      : p
                  )
                )
              }}
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className='w-full max-w-full sm:max-w-2xl max-h-[90dvh] p-0 flex flex-col'>
                <DialogHeader className='px-3 pt-3 sm:px-6 sm:pt-6'>
                  <DialogTitle className='text-base sm:text-lg'>
                    Product Details: {row.original.name}
                  </DialogTitle>
                  <DialogDescription>
                    All product details{hasVariants ? ' and variants' : ''} at a
                    glance
                  </DialogDescription>
                </DialogHeader>
                <div className='flex-1 overflow-y-auto w-full px-3 sm:px-6 pb-3 sm:pb-4 max-h-[70dvh]'>
                  {/* Elegant Product Details Section */}
                  <div className='flex flex-col md:flex-row gap-4 md:gap-8 items-start'>
                    {row.original.main_image_url && (
                      <div className='flex-shrink-0 mb-4 md:mb-0 w-full md:w-auto flex justify-center'>
                        <img
                          src={row.original.main_image_url}
                          alt={row.original.name}
                          className='w-32 h-32 md:w-36 md:h-36 object-cover rounded-lg border shadow-sm max-w-full'
                          style={{ height: 'auto' }}
                        />
                      </div>
                    )}
                    <div className='flex-1 w-full'>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm'>
                        <div className='col-span-2 font-semibold text-lg mb-2'>
                          General
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Name
                        </div>
                        <div>{row.original.name}</div>
                        <div className='font-medium text-muted-foreground'>
                          SKU
                        </div>
                        <div>{row.original.sku}</div>
                        <div className='font-medium text-muted-foreground'>
                          Category
                        </div>
                        <div>{row.original.category_name || '-'}</div>
                        <div className='font-medium text-muted-foreground'>
                          Brand
                        </div>
                        <div>{row.original.brand_name || '-'}</div>
                        <div className='font-medium text-muted-foreground'>
                          Supplier
                        </div>
                        <div>{row.original.supplier_name || '-'}</div>
                        <div className='font-medium text-muted-foreground'>
                          Model
                        </div>
                        <div>{row.original.model_name || '-'}</div>
                        <div className='font-medium text-muted-foreground'>
                          Status
                        </div>
                        <div>
                          {row.original.status === 'active' ? (
                            <Badge variant='default'>Active</Badge>
                          ) : (
                            <Badge variant='secondary'>
                              {row.original.status}
                            </Badge>
                          )}
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Featured
                        </div>
                        <div>
                          {row.original.featured ? (
                            <Badge variant='default'>Yes</Badge>
                          ) : (
                            <Badge variant='secondary'>No</Badge>
                          )}
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Catalog Visibility
                        </div>
                        <div>
                          {row.original.catalog_visibility ? 'Yes' : 'No'}
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Tags
                        </div>
                        <div>{row.original.tags?.join(', ') || '-'}</div>
                        <div className='col-span-2'>
                          <Separator />
                        </div>
                        <div className='col-span-2 font-semibold text-lg mb-2'>
                          Stock & Pricing
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Cost Price
                        </div>
                        <div>
                          ₦{Number(row.original.cost_price).toLocaleString()}
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Selling Price
                        </div>
                        <div>
                          ₦{Number(row.original.selling_price).toLocaleString()}
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Regular Price
                        </div>
                        <div>
                          ₦{Number(row.original.regular_price).toLocaleString()}
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Quantity
                        </div>
                        <div>{row.original.quantity_on_hand}</div>
                        <div className='font-medium text-muted-foreground'>
                          Reorder Level
                        </div>
                        <div>{row.original.reorder_level}</div>
                        <div className='font-medium text-muted-foreground'>
                          Stock Status
                        </div>
                        <div>{row.original.stock_status}</div>
                        <div className='col-span-2'>
                          <Separator />
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Created At
                        </div>
                        <div>
                          {new Date(row.original.created_at).toLocaleString()}
                        </div>
                        <div className='font-medium text-muted-foreground'>
                          Updated At
                        </div>
                        <div>
                          {new Date(row.original.updated_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Variants Table Section */}
                  {hasVariants && (
                    <div className='mt-6'>
                      <div className='font-semibold mb-2'>Variants</div>
                      <div className='overflow-x-auto'>
                        <table className='w-full text-xs border rounded'>
                          <thead>
                            <tr className='bg-gray-50 text-left'>
                              <th className='p-2'>SKU</th>
                              <th className='p-2'>Color</th>
                              <th className='p-2'>Size</th>
                              <th className='p-2'>Price</th>
                              <th className='p-2'>Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(row.original as ProductRow).variants!.map(
                              (v: any, idx: number) => (
                                <tr
                                  key={v.id || v.sku_variant || idx}
                                  className='border-t'
                                >
                                  <td className='p-2'>{v.sku_variant}</td>
                                  <td className='p-2'>{v.color}</td>
                                  <td className='p-2'>{v.size}</td>
                                  <td className='p-2'>₦{v.price_variant}</td>
                                  <td className='p-2'>{v.quantity_variant}</td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
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
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Persist column visibility to localStorage
  React.useEffect(() => {
    localStorage.setItem(COLUMN_VIS_KEY, JSON.stringify(columnVisibility))
  }, [columnVisibility])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(String(active.id))
        const newIndex = dataIds.indexOf(String(over.id))
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs
      defaultValue='outline'
      className='w-full flex-col justify-start gap-6'
    >
      <div className='flex items-center justify-between px-4 lg:px-6'>
        <Label htmlFor='view-selector' className='sr-only'>
          View
        </Label>
        <Select defaultValue='outline'>
          <SelectTrigger
            className='flex w-fit @4xl/main:hidden'
            size='sm'
            id='view-selector'
          >
            <SelectValue placeholder='Select a view' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='outline'>Outline</SelectItem>
            <SelectItem value='past-performance'>Past Performance</SelectItem>
            <SelectItem value='key-personnel'>Key Personnel</SelectItem>
            <SelectItem value='focus-documents'>Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className='**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex'>
          <TabsTrigger value='outline'>Outline</TabsTrigger>
          <TabsTrigger value='past-performance'>
            Past Performance <Badge variant='secondary'>3</Badge>
          </TabsTrigger>
          <TabsTrigger value='key-personnel'>
            Key Personnel <Badge variant='secondary'>2</Badge>
          </TabsTrigger>
          <TabsTrigger value='focus-documents'>Focus Documents</TabsTrigger>
        </TabsList>
        <div className='flex items-center gap-2'>
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
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== 'undefined' &&
                    column.getCanHide()
                )
                .map((column) => {
                  // Special case for category_id, brand_id, supplier_id
                  let humanLabel = column.id
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                  if (column.id === 'category_id') humanLabel = 'Category'
                  if (column.id === 'brand_id') humanLabel = 'Brand'
                  if (column.id === 'supplier_id') humanLabel = 'Supplier'
                  if (column.id === 'quantity_on_hand') humanLabel = 'Quantity'
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className='capitalize'
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {humanLabel}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant='outline' size='sm'>
            <IconPlus />
            <span className='hidden lg:inline'>Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value='outline'
        className='relative flex flex-col gap-4 overflow-auto px-4 lg:px-6'
      >
        <div className='overflow-hidden rounded-lg border'>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className='bg-muted sticky top-0 z-10'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className='**:data-[slot=table-cell]:first:w-8'>
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow
                        key={row.id}
                        row={row as any as Row<ProductRow>}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className='flex items-center justify-between px-4'>
          <div className='text-muted-foreground hidden flex-1 text-sm lg:flex'>
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className='flex w-full items-center gap-8 lg:w-fit'>
            <div className='hidden items-center gap-2 lg:flex'>
              <Label htmlFor='rows-per-page' className='text-sm font-medium'>
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size='sm' className='w-20' id='rows-per-page'>
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side='top'>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex w-fit items-center justify-center text-sm font-medium'>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className='ml-auto flex items-center gap-2 lg:ml-0'>
              <Button
                variant='outline'
                className='hidden h-8 w-8 p-0 lg:flex'
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className='sr-only'>Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className='sr-only'>Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant='outline'
                className='size-8'
                size='icon'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className='sr-only'>Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant='outline'
                className='hidden size-8 lg:flex'
                size='icon'
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className='sr-only'>Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value='past-performance'
        className='flex flex-col px-4 lg:px-6'
      >
        <div className='aspect-video w-full flex-1 rounded-lg border border-dashed'></div>
      </TabsContent>
      <TabsContent value='key-personnel' className='flex flex-col px-4 lg:px-6'>
        <div className='aspect-video w-full flex-1 rounded-lg border border-dashed'></div>
      </TabsContent>
      <TabsContent
        value='focus-documents'
        className='flex flex-col px-4 lg:px-6'
      >
        <div className='aspect-video w-full flex-1 rounded-lg border border-dashed'></div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--primary)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

// DraggableRow for expandable product rows
function DraggableRow({ row }: { row: Row<ProductRow> }) {
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
    isDragging,
  } = useSortable({
    id: row.original.id,
    disabled: false,
  })
  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className='relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80'
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {cell.column.id === 'drag' ? (
            <DragHandle attributes={attributes} listeners={listeners} />
          ) : (
            flexRender(cell.column.columnDef.cell, cell.getContext())
          )}
        </TableCell>
      ))}
    </TableRow>
  )
}
