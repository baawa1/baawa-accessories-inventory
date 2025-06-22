import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProductForm } from '@/components/inventory/ProductForm'

// Mock the required dependencies
jest.mock('@/lib/supabaseClient')
jest.mock('@/hooks/use-toast')
jest.mock('@/lib/uploadProductImage')

describe('ProductForm', () => {
  const defaultProps = {
    onSuccess: jest.fn(),
    suppliers: [],
    categories: [
      { id: '1', name: 'Electronics' },
      { id: '2', name: 'Clothing' },
      { id: '3', name: 'Books' }
    ],
    brands: [
      { id: '1', name: 'Apple' },
      { id: '2', name: 'Samsung' }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render form fields', () => {
    render(<ProductForm {...defaultProps} />)
    
    expect(screen.getByText('SKU')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Selling Price')).toBeInTheDocument()
    expect(screen.getByText('Product Name')).toBeInTheDocument()
  })

  it('should handle basic form input', async () => {
    render(<ProductForm {...defaultProps} />)
    
    // Find specific input by placeholder text to avoid multiple matches
    const nameInput = screen.getByRole('textbox', { name: /product name/i })
    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    
    expect(nameInput).toHaveValue('Test Product')
  })

  it('should display save button', async () => {
    render(<ProductForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /save product/i })
    expect(submitButton).toBeInTheDocument()
  })
})