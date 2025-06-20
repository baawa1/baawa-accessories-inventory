import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabaseClient'

// POST: Create a new stock reconciliation (draft or submit)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      created_by, // user id
      status = 'draft', // 'draft' or 'pending'
      notes = '',
      data, // array of reconciliation line items
    } = body

    // Calculate discrepancies and estimated impact
    const discrepancies = Array.isArray(data)
      ? data.reduce((sum, item) => sum + (item.discrepancy || 0), 0)
      : 0
    const estimated_impact = Array.isArray(data)
      ? data.reduce((sum, item) => sum + (item.estimatedImpact || 0), 0)
      : 0

    const { data: inserted, error } = await supabase
      .from('stock_reconciliations')
      .insert([
        {
          created_by,
          status,
          notes,
          discrepancies,
          estimated_impact,
          data,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, reconciliation: inserted?.[0] })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
