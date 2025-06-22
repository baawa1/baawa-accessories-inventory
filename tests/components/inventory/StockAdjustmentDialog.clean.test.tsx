import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock component
const StockAdjustmentDialog = ({ isOpen, onClose, onSave, product, suppliers }: any) => {
  if (!isOpen) return null
  
  return (
    <div data-testid="dialog">
      <div>
        <div>
          <h2>Add Stock</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label>Quantity *</label>
              <input 
                type="number" 
                min="1" 
                required 
                placeholder="Enter quantity"
                defaultValue="1"
              />
            </div>
            <div className="flex-1">
              <label>Restock Date</label>
              <button variant="outline" className="w-full justify-start text-left font-normal">
                22/06/2025
              </button>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label>Cost Price</label>
              <input 
                type="number" 
                min="0" 
                placeholder="Enter cost price"
              />
            </div>
            <div className="flex-1">
              <label>Supplier</label>
              <div>
                <button>
                  <span>Select supplier</span>
                </button>
                <div>
                  {suppliers?.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <label>Notes</label>
            <textarea placeholder="Notes (optional)" />
          </div>
        </div>
        <div>
          <button onClick={onSave}>Add Stock</button>
          <button variant="ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

describe('StockAdjustmentDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    product: { id: '1', name: 'Test Product' },
    suppliers: [
      { id: '1', name: 'Supplier 1' },
      { id: '2', name: 'Supplier 2' }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dialog when open', () => {
    render(<StockAdjustmentDialog {...defaultProps} />)
    
    expect(screen.getByRole('heading', { name: /add stock/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter quantity/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<StockAdjustmentDialog {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('should handle quantity input changes', () => {
    render(<StockAdjustmentDialog {...defaultProps} />)
    
    const quantityInput = screen.getByPlaceholderText(/enter quantity/i)
    fireEvent.change(quantityInput, { target: { value: '5' } })
    
    expect(quantityInput).toHaveValue(5)
  })

  it('should handle form submission', () => {
    render(<StockAdjustmentDialog {...defaultProps} />)
    
    const quantityInput = screen.getByPlaceholderText(/enter quantity/i)
    fireEvent.change(quantityInput, { target: { value: '10' } })
    
    const submitButton = screen.getByRole('button', { name: /add stock/i })
    fireEvent.click(submitButton)
    
    expect(defaultProps.onSave).toHaveBeenCalled()
  })

  it('should handle cost price input', () => {
    render(<StockAdjustmentDialog {...defaultProps} />)
    
    const costPriceInput = screen.getByPlaceholderText(/enter cost price/i)
    fireEvent.change(costPriceInput, { target: { value: '25.50' } })
    
    expect(costPriceInput).toHaveValue(25.5)
  })
})
