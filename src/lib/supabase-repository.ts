import supabase from './supabaseClient'
import { classifyError } from '@/hooks/use-error-handler'

// Generic function for executing Supabase queries with error handling
export async function executeSupabaseQuery<T>(
  queryBuilder: any,
  operation: string = 'query'
): Promise<{ data: T | null; error: string | null }> {
  try {
    const result = await queryBuilder

    if (result.error) {
      console.error(`Supabase ${operation} error:`, result.error)
      const { message } = classifyError(result.error)
      return { data: null, error: message }
    }

    return { data: result.data, error: null }
  } catch (error) {
    console.error(`Unexpected error during ${operation}:`, error)
    const { message } = classifyError(error)
    return { data: null, error: message }
  }
}

// Common query patterns
export class SupabaseRepository<T> {
  constructor(private tableName: string) {}

  async findAll(filters?: Record<string, any>): Promise<{ data: T[] | null; error: string | null }> {
    let query = supabase.from(this.tableName).select('*')
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    return executeSupabaseQuery<T[]>(query, `find all ${this.tableName}`)
  }

  async findById(id: string | number): Promise<{ data: T | null; error: string | null }> {
    const query = supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    return executeSupabaseQuery<T>(query, `find ${this.tableName} by id`)
  }

  async create(data: Partial<T>): Promise<{ data: T | null; error: string | null }> {
    const query = supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single()

    return executeSupabaseQuery<T>(query, `create ${this.tableName}`)
  }

  async update(id: string | number, data: Partial<T>): Promise<{ data: T | null; error: string | null }> {
    const query = supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    return executeSupabaseQuery<T>(query, `update ${this.tableName}`)
  }

  async delete(id: string | number): Promise<{ data: null; error: string | null }> {
    const query = supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    const result = await executeSupabaseQuery(query, `delete ${this.tableName}`)
    return { data: null, error: result.error }
  }

  async count(filters?: Record<string, any>): Promise<{ data: number; error: string | null }> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    try {
      const result = await query
      
      if (result.error) {
        console.error(`Supabase count error:`, result.error)
        const { message } = classifyError(result.error)
        return { data: 0, error: message }
      }

      return { data: result.count || 0, error: null }
    } catch (error) {
      console.error(`Unexpected error during count ${this.tableName}:`, error)
      const { message } = classifyError(error)
      return { data: 0, error: message }
    }
  }
}

// Specific repository instances for common entities
export const productsRepository = new SupabaseRepository('products')
export const categoriesRepository = new SupabaseRepository('categories')
export const brandsRepository = new SupabaseRepository('brands')
export const suppliersRepository = new SupabaseRepository('suppliers')
export const stockAdjustmentsRepository = new SupabaseRepository('stock_adjustments')

// Custom queries for complex operations
export async function getProductsWithRelations() {
  const query = supabase
    .from('products')
    .select(`
      *,
      categories(name),
      brands(name),
      suppliers(name),
      product_images(*)
    `)

  return executeSupabaseQuery(query, 'get products with relations')
}

export async function searchProducts(searchTerm: string, limit: number = 50) {
  const query = supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .limit(limit)

  return executeSupabaseQuery(query, 'search products')
}

export async function getProductsByCategory(categoryId: string | number) {
  const query = supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)

  return executeSupabaseQuery(query, 'get products by category')
}

export async function getLowStockProducts(threshold: number = 10) {
  const query = supabase
    .from('products')
    .select('*')
    .lt('quantity_on_hand', threshold)
    .order('quantity_on_hand', { ascending: true })

  return executeSupabaseQuery(query, 'get low stock products')
}
