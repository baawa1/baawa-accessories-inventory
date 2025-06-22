'use client'

import { useState, useCallback } from 'react'
import { ProductVariant } from './types'

export const useProductVariants = (initialVariants?: ProductVariant[]) => {
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants || [])
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)

  const handleAddVariant = useCallback(() => {
    setEditingVariant({
      sku_variant: '',
      color: '',
      size: '',
      price_variant: undefined,
      quantity_variant: undefined,
    })
    setVariantDialogOpen(true)
  }, [])

  const handleEditVariant = useCallback((idx: number) => {
    setEditingVariant({ ...variants[idx] })
    setVariantDialogOpen(true)
  }, [variants])

  const handleSaveVariant = useCallback((variant: ProductVariant) => {
    setVariants((prev) => {
      if (editingVariant && editingVariant.id) {
        // Update existing
        return prev.map((v) =>
          v.id === editingVariant.id ? { ...variant, id: editingVariant.id } : v
        )
      } else if (
        editingVariant &&
        prev.some((v) => v.sku_variant === editingVariant.sku_variant)
      ) {
        // Update by sku_variant if no id
        return prev.map((v) =>
          v.sku_variant === editingVariant.sku_variant ? variant : v
        )
      } else {
        // Add new
        return [...prev, variant]
      }
    })
    setEditingVariant(null)
    setVariantDialogOpen(false)
  }, [editingVariant])

  const handleRemoveVariant = useCallback((idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const resetVariants = useCallback(() => {
    setVariants([])
    setEditingVariant(null)
    setVariantDialogOpen(false)
  }, [])

  return {
    variants,
    editingVariant,
    variantDialogOpen,
    setVariantDialogOpen,
    handleAddVariant,
    handleEditVariant,
    handleSaveVariant,
    handleRemoveVariant,
    resetVariants,
  }
}
