import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use environment variables for your Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sku = searchParams.get('sku')
  const productId = searchParams.get('productId')

  if (!sku) {
    return NextResponse.json({ unique: false }, { status: 400 })
  }

  let query = supabase.from('products').select('id').eq('sku', sku).limit(1)
  if (productId) {
    query = query.neq('id', productId)
  }
  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { unique: false, error: error.message },
      { status: 500 }
    )
  }

  const isUnique = !data || data.length === 0
  return NextResponse.json({ unique: isUnique })
}
