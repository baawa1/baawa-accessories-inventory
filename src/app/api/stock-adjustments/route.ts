import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST: Adjust stock for a product (and optionally a variant)
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    product_id,
    variant_id,
    user_id,
    adjustment_type,
    quantity_changed,
    reason,
  } = await req.json()

  if (!product_id || !adjustment_type || !quantity_changed) {
    return NextResponse.json(
      { error: 'Missing required fields.' },
      { status: 400 }
    )
  }

  // Fetch current quantity
  let currentQty = 0
  if (variant_id) {
    const { data, error } = await supabase
      .from('product_variants')
      .select('quantity_variant')
      .eq('id', variant_id)
      .single()
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    currentQty = data.quantity_variant
  } else {
    const { data, error } = await supabase
      .from('products')
      .select('quantity_on_hand')
      .eq('id', product_id)
      .single()
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    currentQty = data.quantity_on_hand
  }

  // Update quantity
  const newQty = currentQty + quantity_changed
  let updateError
  if (variant_id) {
    const { error } = await supabase
      .from('product_variants')
      .update({ quantity_variant: newQty })
      .eq('id', variant_id)
    updateError = error
  } else {
    const { error } = await supabase
      .from('products')
      .update({ quantity_on_hand: newQty })
      .eq('id', product_id)
    updateError = error
  }
  if (updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Log adjustment
  const { error: logError } = await supabase.from('stock_adjustments').insert({
    product_id,
    variant_id,
    user_id,
    adjustment_type,
    quantity_changed,
    reason,
  })
  if (logError)
    return NextResponse.json({ error: logError.message }, { status: 500 })

  return NextResponse.json({ success: true, newQty })
}
