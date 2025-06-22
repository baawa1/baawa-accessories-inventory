'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { StockReconciliationDialogProps } from './types'
import { useReconciliation } from './useReconciliation'
import { useProductSearch } from './useProductSearch'
import { ProductSearch } from './ProductSearch'
import { ReconciliationTable } from './ReconciliationTable'

export function StockReconciliationDialog({
  open,
  onOpenChange,
  products,
  reconciliationData,
  loading = false,
}: StockReconciliationDialogProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reconciliation state management
  const {
    selectedProducts,
    handleAddProduct,
    handleRemoveProduct,
    handlePhysicalCountChange,
    handleReasonChange,
    handleSaveOrSubmit,
  } = useReconciliation({ open, products, reconciliationData })

  // Product search functionality
  const {
    commandSearch,
    setCommandSearch,
    commandComboOpen,
    setCommandComboOpen,
    commandTriggerRef,
    commandBoxRef,
    filteredProducts,
    resetSearch,
  } = useProductSearch(products, selectedProducts)

  const handleSave = async (status: 'draft' | 'pending') => {
    setSaving(true)
    setError(null)
    
    try {
      await handleSaveOrSubmit(status)
      onOpenChange(false)
      resetSearch()
      router.refresh() // Refresh the page to show updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reconciliation')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    resetSearch()
    setError(null)
  }

  const canSubmit = selectedProducts.length > 0 && 
    selectedProducts.every(p => p.physicalCount !== '' && p.reason !== '')

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading reconciliation data...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Reconciliation</DialogTitle>
          <p className="text-sm text-gray-500">
            Compare and adjust your inventory records with your physical inventory counts here.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Product Search */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Add Products</h3>
            <ProductSearch
              filteredProducts={filteredProducts}
              commandSearch={commandSearch}
              setCommandSearch={setCommandSearch}
              commandComboOpen={commandComboOpen}
              setCommandComboOpen={setCommandComboOpen}
              commandTriggerRef={commandTriggerRef}
              commandBoxRef={commandBoxRef}
              onAddProduct={handleAddProduct}
            />
          </div>

          {/* Reconciliation Table */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Products to Reconcile</h3>
            <ReconciliationTable
              selectedProducts={selectedProducts}
              onPhysicalChange={handlePhysicalCountChange}
              onReasonChange={handleReasonChange}
              onRemove={handleRemoveProduct}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={saving || selectedProducts.length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save as Draft'
                )}
              </Button>

              <Button
                onClick={() => handleSave('pending')}
                disabled={saving || !canSubmit}
                title={
                  !canSubmit 
                    ? 'Please add products and fill in all physical counts and reasons'
                    : undefined
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Reconciliation'
                )}
              </Button>
            </div>
          </div>

          {/* Help Text */}
          {selectedProducts.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              <p>💡 Start by searching and adding products to reconcile above.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
