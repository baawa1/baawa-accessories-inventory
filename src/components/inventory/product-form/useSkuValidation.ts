'use client'

import { useState } from 'react'

type SkuStatus = 'idle' | 'loading' | 'unique' | 'not-unique'

// SKU validation function
const checkSkuUnique = async (sku: string, productId?: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/products/check-sku', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, productId }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to check SKU uniqueness')
    }
    
    const { isUnique } = await response.json()
    return isUnique
  } catch (error) {
    console.error('Error checking SKU uniqueness:', error)
    return false
  }
}

export const useSkuValidation = (productId?: string) => {
  const [skuStatus, setSkuStatus] = useState<SkuStatus>('idle')

  const validateSku = async (sku: string, form: any) => {
    if (!sku) {
      setSkuStatus('idle')
      return
    }

    setSkuStatus('loading')
    const isUnique = await checkSkuUnique(sku, productId)
    
    if (!isUnique) {
      form.setError('sku', {
        type: 'manual',
        message: 'SKU already exists. Please use a unique SKU.',
      })
      setSkuStatus('not-unique')
    } else {
      form.clearErrors('sku')
      setSkuStatus('unique')
    }
  }

  const resetSkuStatus = () => {
    setSkuStatus('idle')
  }

  return {
    skuStatus,
    validateSku,
    resetSkuStatus,
  }
}
