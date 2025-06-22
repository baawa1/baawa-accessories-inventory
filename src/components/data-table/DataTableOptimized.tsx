import React, { memo, useState, useEffect, useCallback, useMemo } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { IconPlus } from '@tabler/icons-react'
import { DraggableRow } from './DraggableRow'
import { TablePagination } from './TablePagination'
import { ColumnToggle } from './ColumnToggle'
import { useProductColumns } from './useProductColumns'

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

interface DataTableOptimizedProps {
  data: Product[]
  suppliers?: { id: string; name: string }[]
}

export const DataTableOptimized = memo(function DataTableOptimized({
  data: initialData,
  suppliers = [],
}: DataTableOptimizedProps) {
  const [data, setData] = useState(() => initialData)
  
  // Sync local data state with prop changes
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(DEFAULT_VISIBLE_COLUMNS)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // On mount (client only), update from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem(COLUMN_VIS_KEY)
    if (saved) setColumnVisibility(JSON.parse(saved))
  }, [])

  // Persist column visibility to localStorage
  useEffect(() => {
    localStorage.setItem(COLUMN_VIS_KEY, JSON.stringify(columnVisibility))
  }, [columnVisibility])

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = useMemo(() => data.map(({ id }) => id), [data])

  const columns = useProductColumns({ 
    suppliers, 
    onDataUpdate: setData 
  })

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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(String(active.id))
        const newIndex = dataIds.indexOf(String(over.id))
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }, [dataIds])

  return (
    <Tabs
      defaultValue='outline'
      className='w-full flex-col justify-start gap-6'
    >
      <div className='flex items-center justify-between'>
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
          <ColumnToggle table={table} />
          <Button variant='outline' size='sm'>
            <IconPlus />
            <span className='hidden lg:inline'>Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value='outline'
        className='relative flex flex-col gap-4 overflow-auto'
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
                      <DraggableRow key={row.id} row={row} />
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
        <TablePagination table={table} />
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
})
