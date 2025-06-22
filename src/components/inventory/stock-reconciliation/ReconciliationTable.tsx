import React from 'react'
import { ReconTableRow } from './ReconTableRow'
import { ReconProduct } from './types'

interface ReconciliationTableProps {
  selectedProducts: ReconProduct[]
  onPhysicalChange: (id: string, value: string) => void
  onReasonChange: (id: string, value: string) => void
  onRemove: (id: string) => void
}

export const ReconciliationTable: React.FC<ReconciliationTableProps> = ({
  selectedProducts,
  onPhysicalChange,
  onReasonChange,
  onRemove,
}) => {
  if (selectedProducts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No products added to reconciliation yet.</p>
        <p className="text-sm">Search and add products above to get started.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-2 border text-left">Product Name</th>
            <th className="px-2 py-2 border text-left">Variants</th>
            <th className="px-2 py-2 border text-left">System Count</th>
            <th className="px-2 py-2 border text-left">Physical Count</th>
            <th className="px-2 py-2 border text-left">Discrepancy</th>
            <th className="px-2 py-2 border text-left">Est. Impact</th>
            <th className="px-2 py-2 border text-left">Reason</th>
            <th className="px-2 py-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {selectedProducts.map((product) => (
            <ReconTableRow
              key={product.id}
              product={product}
              onPhysicalChange={onPhysicalChange}
              onReasonChange={onReasonChange}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
      
      {/* Summary Row */}
      <div className="bg-gray-50 px-4 py-3 border-t">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">
            Total Products: {selectedProducts.length}
          </span>
          <div className="flex gap-4">
            <span>
              Total Discrepancy: {' '}
              <span className={
                selectedProducts.reduce((sum, p) => sum + p.discrepancy, 0) < 0 
                  ? 'text-red-500' 
                  : 'text-green-600'
              }>
                {selectedProducts.reduce((sum, p) => sum + p.discrepancy, 0)} units
              </span>
            </span>
            <span>
              Est. Impact: {' '}
              <span className={
                selectedProducts.reduce((sum, p) => sum + p.estimatedImpact, 0) < 0 
                  ? 'text-red-500' 
                  : 'text-green-600'
              }>
                ₦{selectedProducts.reduce((sum, p) => sum + p.estimatedImpact, 0).toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
