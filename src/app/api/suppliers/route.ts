import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/supabaseClient'

export async function GET() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ suppliers: data })
}
