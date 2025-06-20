import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
// @ts-ignore
import { stringify } from 'csv-stringify/sync'

// Use environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: parse CSV buffer to array of objects
function parseCSV(buffer: Buffer | string) {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    const arrayBuffer = await file.arrayBuffer()
    const csvText = Buffer.from(arrayBuffer).toString('utf-8')
    const records = parseCSV(csvText)

    let results = []
    for (const row of records) {
      let status = 'added'
      let errorMsg = ''
      try {
        // Lookup category (must exist, case-insensitive, trimmed)
        let category_id = null
        if (row.category) {
          const categoryName = row.category.trim()
          let { data: catData, error: catErr } = await supabase
            .from('categories')
            .select('id')
            .ilike('name', categoryName)
            .single()
          if (catErr || !catData) {
            throw new Error(`Category not found: ${row.category}`)
          } else {
            category_id = catData.id
          }
        }
        // Lookup brand (must exist, case-insensitive, trimmed)
        let brand_id = null
        if (row.brand) {
          const brandName = row.brand.trim()
          let { data: brandData, error: brandErr } = await supabase
            .from('brands')
            .select('id')
            .ilike('name', brandName)
            .single()
          if (brandErr || !brandData) {
            throw new Error(`Brand not found: ${row.brand}`)
          } else {
            brand_id = brandData.id
          }
        }
        // Lookup supplier (must exist, case-insensitive, trimmed)
        let supplier_id = null
        if (row.supplier_name) {
          const supplierName = row.supplier_name.trim()
          let { data: supData, error: supErr } = await supabase
            .from('suppliers')
            .select('id')
            .ilike('name', supplierName)
            .single()
          if (supErr || !supData) {
            throw new Error(`Supplier not found: ${row.supplier_name}`)
          } else {
            supplier_id = supData.id
          }
        }
        // Map CSV status to enum value (case-insensitive)
        function mapStatus(status: string) {
          if (!status) return null
          const s = status.trim().toLowerCase()
          if (s === 'active') return 'active'
          if (s === 'draft') return 'draft'
          if (s === 'archived') return 'archived'
          return null // fallback, will cause DB error for invalid value
        }
        // Map CSV fields to DB fields
        const productData = {
          id: row.id || undefined,
          sku: row.sku,
          name: row.name, // Use 'name' field from CSV directly
          category_id,
          brand_id,
          model_name: row.model_name,
          cost_price: row.cost_price ? Number(row.cost_price) : null,
          selling_price: row.selling_price ? Number(row.selling_price) : null,
          quantity_on_hand: row.quantity_on_hand
            ? Number(row.quantity_on_hand)
            : null,
          supplier_id,
          status: mapStatus(row.status),
          description: row.description,
          tags: row.tags
            ? row.tags.split(',').map((t: string) => t.trim())
            : [],
        }
        // Upsert product by id (if present) or sku (if unique)
        let upsertResult = await supabase
          .from('products')
          .upsert(productData, { onConflict: 'id' })
          .select()
        if (upsertResult.error) {
          status = 'failed'
          errorMsg = upsertResult.error.message
        } else {
          const product = upsertResult.data?.[0]
          if (row.id) status = 'updated'
          // Handle variants
          if (row.variant_sku) {
            await supabase.from('product_variants').upsert(
              {
                product_id: product.id,
                color: row.variant_color,
                size: row.variant_size,
                sku_variant: row.variant_sku,
                price_variant: row.variant_price
                  ? Number(row.variant_price)
                  : null,
                quantity_variant: row.variant_quantity
                  ? Number(row.variant_quantity)
                  : null,
              },
              { onConflict: 'sku_variant' }
            )
          }
          // Handle images
          if (row.image_url) {
            await supabase.from('product_images').upsert(
              {
                product_id: product.id,
                image_url: row.image_url,
                alt_text: row.image_alt_text,
                display_order: row.image_display_order
                  ? Number(row.image_display_order)
                  : 1,
              },
              { onConflict: 'image_url' }
            )
          }
        }
      } catch (err: any) {
        status = 'failed'
        // Include the full error object in the CSV for debugging
        errorMsg =
          err && typeof err === 'object'
            ? JSON.stringify(err, Object.getOwnPropertyNames(err))
            : err?.message || 'Unknown error'
        // eslint-disable-next-line no-console
        console.error(
          'Bulk upload error for row:',
          JSON.stringify(row),
          err,
          err?.stack
        )
      }
      results.push({ ...row, status, error: errorMsg })
    }
    // Prepare downloadable CSV
    const outputCsv = stringify(results, { header: true })
    return new NextResponse(outputCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="bulk-upload-status.csv"',
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Bulk upload failed' },
      { status: 500 }
    )
  }
}
