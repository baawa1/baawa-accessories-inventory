import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductForm } from '@/components/inventory/product-form'
import { useRouter } from 'next/navigation'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the toast notification
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

// Mock the image upload utility
jest.mock('@/lib/uploadProductImage', () => ({
  uploadProductImage: jest.fn(() => Promise.resolve('http://example.com/image.jpg'))
}))

// Mock the save product utility
jest.mock('@/lib/saveProduct', () => ({
  saveProduct: jest.fn(() => Promise.resolve({ success: true, product: { id: '1' } }))
}))

const mockRouterPush = jest.fn()
const mockRouterReplace = jest.fn()

describe('ProductForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
      replace: mockRouterReplace,
    })
  })

  it('should render product form fields', () => {
    render(<ProductForm />)
    
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/selling price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cost price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
  })

  it('should display validation errors for required fields', async () => {
    render(<ProductForm />)
    
    const submitButton = screen.getByText(/save product/i)
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/product name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/sku is required/i)).toBeInTheDocument()
    })
  })

  it('should allow input in form fields', async () => {
    render(<ProductForm />)
    
    const nameInput = screen.getByLabelText(/product name/i)
    const skuInput = screen.getByLabelText(/sku/i)
    
    fireEvent.change(nameInput, { target: { value: 'Test Product' } })
    fireEvent.change(skuInput, { target: { value: 'TEST-001' } })
    
    expect(nameInput).toHaveValue('Test Product')
    expect(skuInput).toHaveValue('TEST-001')
  })

  it('should validate price fields are positive numbers', async () => {
    render(<ProductForm />)
    
    const sellingPriceInput = screen.getByLabelText(/selling price/i)
    const costPriceInput = screen.getByLabelText(/cost price/i)
    
    fireEvent.change(sellingPriceInput, { target: { value: '-10' } })
    fireEvent.change(costPriceInput, { target: { value: 'invalid' } })
    
    const submitButton = screen.getByText(/save product/i)
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/selling price must be positive/i)).toBeInTheDocument()
      expect(screen.getByText(/cost price must be a valid number/i)).toBeInTheDocument()
    })
  })

  it('should handle image upload', async () => {
    render(<ProductForm />)
    
    const fileInput = screen.getByLabelText(/product image/i)
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during form submission', async () => {
    render(<ProductForm />)
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/product name/i), { target: { value: 'Test Product' } })
    fireEvent.change(screen.getByLabelText(/sku/i), { target: { value: 'TEST-001' } })
    fireEvent.change(screen.getByLabelText(/selling price/i), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText(/cost price/i), { target: { value: '50' } })
    
    const submitButton = screen.getByText(/save product/i)
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/saving/i)).toBeInTheDocument()
    })
  })

  it('should redirect after successful product creation', async () => {
    const mockSaveProduct = require('@/lib/saveProduct').saveProduct
    mockSaveProduct.mockResolvedValueOnce({ success: true, product: { id: '1' } })
    
    render(<ProductForm />)
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/product name/i), { target: { value: 'Test Product' } })
    fireEvent.change(screen.getByLabelText(/sku/i), { target: { value: 'TEST-001' } })
    fireEvent.change(screen.getByLabelText(/selling price/i), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText(/cost price/i), { target: { value: '50' } })
    
    const submitButton = screen.getByText(/save product/i)
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/inventory')
    })
  })
})
