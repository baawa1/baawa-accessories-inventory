import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Create a new stock reconciliation (draft or submit)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
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

// PUT: Update an existing stock reconciliation
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  try {
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required in the request body' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('stock_reconciliations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(), // Ensure updated_at is set
        discrepancies: Array.isArray(updateData.data)
          ? updateData.data.reduce(
              (sum: number, item: { discrepancy?: number }) =>
                sum + (item.discrepancy || 0),
              0
            )
          : 0,
        estimated_impact: Array.isArray(updateData.data)
          ? updateData.data.reduce(
              (sum: number, item: { estimatedImpact?: number }) =>
                sum + (item.estimatedImpact || 0),
              0
            )
          : 0,
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, reconciliation: data?.[0] })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
