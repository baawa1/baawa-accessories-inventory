import { z } from 'zod'
import { ColumnDef, VisibilityState, ColumnFiltersState, SortingState } from '@tanstack/react-table'

// Product schema for data table
export const productTableSchema = z.object({
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

export type ProductRow = z.infer<typeof productTableSchema> & { 
  variants?: ProductVariant[] 
}

// Use ProductRow as ProductTableData for backward compatibility
export type ProductTableData = ProductRow

export interface ProductVariant {
  id: number
  sku_variant: string
  color: string
  size: string
  price_variant: number
  quantity_variant: number
  // Legacy properties for backward compatibility
  name?: string
  sku?: string
  costPrice?: number
  sellingPrice?: number
  quantity?: number
  attributes?: Record<string, string>
}

export interface Supplier {
  id: string
  name: string
}

export interface DataTableProps {
  data: ProductRow[]
  suppliers?: Supplier[]
}

export interface TableState {
  rowSelection: Record<string, boolean>
  columnVisibility: VisibilityState
  columnFilters: ColumnFiltersState
  sorting: SortingState
  pagination: {
    pageIndex: number
    pageSize: number
  }
  expandedRows: Record<string, boolean>
}

export const DEFAULT_VISIBLE_COLUMNS: VisibilityState = {
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

export const COLUMN_VIS_KEY = 'inventory_table_column_visibility'
