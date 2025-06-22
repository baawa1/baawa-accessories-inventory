import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Product, ReconProduct, StockReconciliationDialogProps } from './types'

export const useReconciliation = ({
  open,
  products,
  reconciliationData
}: Pick<StockReconciliationDialogProps, 'open' | 'products' | 'reconciliationData'>) => {
  const [userId, setUserId] = useState<string | null>(null)
  
  // Initialize selected products from reconciliation data
  const [selectedProducts, setSelectedProducts] = useState<ReconProduct[]>(() => {
    if (!reconciliationData?.data) return []
    
    const data = typeof reconciliationData.data === 'string'
      ? JSON.parse(reconciliationData.data)
      : reconciliationData.data
      
    return data.map((product: any) => ({
      id: product.id,
      name: product.name,
      quantity_on_hand: product.quantity_on_hand || 0,
      selling_price: product.selling_price || 0,
      physicalCount: product.physicalCount || '',
      discrepancy: product.discrepancy || 0,
      estimatedImpact: product.estimatedImpact || 0,
      reason: product.reason || '',
      variants: product.variants || [],
    }))
  })

  // Get user ID for reconciliation creation
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null)
    })
  }, [])

  // Reset selected products when dialog opens without reconciliation data
  useEffect(() => {
    if (open && !reconciliationData) {
      setSelectedProducts([])
    }
  }, [open, reconciliationData])

  const handleAddProduct = useCallback((product: Product) => {
    if (selectedProducts.some((p) => p.id === product.id)) return
    
    setSelectedProducts((prev) => [
      ...prev,
      {
        ...product,
        physicalCount: '',
        discrepancy: 0,
        estimatedImpact: 0,
        reason: '',
      },
    ])
  }, [selectedProducts])

  const handleRemoveProduct = useCallback((id: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handlePhysicalCountChange = useCallback((id: string, value: string) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        
        const physical = value === '' ? '' : parseInt(value, 10)
        const discrepancy = physical === '' ? 0 : (physical as number) - p.quantity_on_hand
        const estimatedImpact = discrepancy * (p.selling_price || 0)
        
        return { 
          ...p, 
          physicalCount: value, 
          discrepancy, 
          estimatedImpact 
        }
      })
    )
  }, [])

  const handleReasonChange = useCallback((id: string, value: string) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, reason: value } : p))
    )
  }, [])

  const handleSaveOrSubmit = useCallback(async (status: 'draft' | 'pending') => {
    const payload = {
      created_by: userId,
      status,
      notes: '',
      data: selectedProducts,
    }

    const url = reconciliationData
      ? `/api/stock-reconciliations/${reconciliationData.id}`
      : '/api/stock-reconciliations'

    const method = reconciliationData ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to save reconciliation: ${errorText}`)
      }

      return await res.json()
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred'
      throw new Error(errorMessage)
    }
  }, [userId, selectedProducts, reconciliationData])

  return {
    selectedProducts,
    handleAddProduct,
    handleRemoveProduct,
    handlePhysicalCountChange,
    handleReasonChange,
    handleSaveOrSubmit,
  }
}
