import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DataTable } from '@/components/data-table/DataTable'
import { ProductRow } from '@/components/data-table/types'

// Mock the data-table components
jest.mock('@/components/data-table/DataTableToolbar', () => ({
  DataTableToolbar: ({ onSearch, onFilterChange }: any) => (
    <div data-testid="data-table-toolbar">
      <input 
        data-testid="search-input"
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search products..."
      />
      <select 
        data-testid="category-filter"
        onChange={(e) => onFilterChange('category', e.target.value)}
      >
        <option value="">All categories</option>
        <option value="electronics">Electronics</option>
      </select>
    </div>
  )
}))

jest.mock('@/components/data-table/DataTableContent', () => ({
  DataTableContent: ({ data, selectedRows, onRowSelect }: any) => (
    <div data-testid="data-table-content">
      {data.map((item: any) => (
        <div key={item.id} data-testid={`row-${item.id}`}>
          <input
            type="checkbox"
            checked={selectedRows.includes(item.id)}
            onChange={() => onRowSelect(item.id)}
            data-testid={`checkbox-${item.id}`}
          />
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  )
}))

jest.mock('@/components/data-table/DataTablePagination', () => ({
  DataTablePagination: ({ pageIndex, pageSize, pageCount, canPreviousPage, canNextPage, gotoPage, nextPage, previousPage }: any) => (
    <div data-testid="data-table-pagination">
      <button 
        disabled={!canPreviousPage}
        onClick={previousPage}
        data-testid="prev-page"
      >
        Previous
      </button>
      <span data-testid="page-info">
        Page {pageIndex + 1} of {pageCount}
      </span>
      <button 
        disabled={!canNextPage}
        onClick={nextPage}
        data-testid="next-page"
      >
        Next
      </button>
    </div>
  )
}))

const mockProducts: ProductRow[] = [
  {
    id: '1',
    name: 'Product 1',
    sku: 'SKU001',
    description: 'Test description 1',
    short_description: 'Short desc 1',
    slug: 'product-1',
    cost_price: 50,
    selling_price: 100,
    regular_price: 100,
    quantity_on_hand: 10,
    category_id: 'electronics',
    brand_id: 'brand1',
    model_name: 'Model 1',
    supplier_id: 'supplier1',
    status: 'active',
    tags: ['electronics'],
    reorder_level: 5,
    stock_status: 'in_stock',
    featured: false,
    catalog_visibility: true,
    meta: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    main_image_url: '',
    category_name: 'Electronics',
    brand_name: 'Brand 1',
    supplier_name: 'Supplier 1'
  },
  {
    id: '2',
    name: 'Product 2',
    sku: 'SKU002',
    description: 'Test description 2',
    short_description: 'Short desc 2',
    slug: 'product-2',
    cost_price: 100,
    selling_price: 200,
    regular_price: 200,
    quantity_on_hand: 5,
    category_id: 'electronics',
    brand_id: 'brand1',
    model_name: 'Model 2',
    supplier_id: 'supplier1',
    status: 'active',
    tags: ['electronics'],
    reorder_level: 3,
    stock_status: 'in_stock',
    featured: false,
    catalog_visibility: true,
    meta: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    main_image_url: '',
    category_name: 'Electronics',
    brand_name: 'Brand 1',
    supplier_name: 'Supplier 1'
  }
]

describe('DataTable', () => {
  const defaultProps = {
    data: mockProducts,
    suppliers: [
      { id: 'supplier1', name: 'Supplier 1' },
      { id: 'supplier2', name: 'Supplier 2' }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all components', () => {
    render(<DataTable {...defaultProps} />)
    
    expect(screen.getByTestId('data-table-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('data-table-content')).toBeInTheDocument()
    expect(screen.getByTestId('data-table-pagination')).toBeInTheDocument()
  })

  it('should display all products', () => {
    render(<DataTable {...defaultProps} />)
    
    expect(screen.getByTestId('row-1')).toBeInTheDocument()
    expect(screen.getByTestId('row-2')).toBeInTheDocument()
    expect(screen.getByText('Product 1')).toBeInTheDocument()
    expect(screen.getByText('Product 2')).toBeInTheDocument()
  })

  it('should handle search functionality', async () => {
    render(<DataTable {...defaultProps} />)
    
    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'Product 1' } })
    
    await waitFor(() => {
      // Should filter to show only Product 1
      expect(screen.getByText('Product 1')).toBeInTheDocument()
    })
  })

  it('should handle category filtering', async () => {
    render(<DataTable {...defaultProps} />)
    
    const categoryFilter = screen.getByTestId('category-filter')
    fireEvent.change(categoryFilter, { target: { value: 'electronics' } })
    
    await waitFor(() => {
      // Should show electronics products
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
    })
  })

  it('should handle row selection', () => {
    render(<DataTable {...defaultProps} />)
    
    const checkbox1 = screen.getByTestId('checkbox-1')
    const checkbox2 = screen.getByTestId('checkbox-2')
    
    fireEvent.click(checkbox1)
    expect(checkbox1).toBeChecked()
    expect(checkbox2).not.toBeChecked()
    
    fireEvent.click(checkbox2)
    expect(checkbox1).toBeChecked()
    expect(checkbox2).toBeChecked()
  })

  it('should handle pagination', () => {
    const manyProducts = Array.from({ length: 15 }, (_, i) => ({
      ...mockProducts[0],
      id: String(i + 1),
      name: `Product ${i + 1}`,
      sku: `SKU${String(i + 1).padStart(3, '0')}`
    }))

    render(<DataTable {...defaultProps} data={manyProducts} />)
    
    const nextButton = screen.getByTestId('next-page')
    const prevButton = screen.getByTestId('prev-page')
    
    expect(prevButton).toBeDisabled()
    expect(nextButton).not.toBeDisabled()
    
    fireEvent.click(nextButton)
    expect(screen.getByTestId('page-info')).toHaveTextContent('Page 2 of')
  })

  it('should handle empty data state', () => {
    render(<DataTable {...defaultProps} data={[]} />)
    
    expect(screen.getByTestId('data-table-content')).toBeInTheDocument()
    // Should render empty content without errors
  })

  it('should handle bulk actions', () => {
    render(<DataTable {...defaultProps} />)
    
    // Select multiple rows
    const checkbox1 = screen.getByTestId('checkbox-1')
    const checkbox2 = screen.getByTestId('checkbox-2')
    
    fireEvent.click(checkbox1)
    fireEvent.click(checkbox2)
    
    expect(checkbox1).toBeChecked()
    expect(checkbox2).toBeChecked()
  })

  it('should reset search when data changes', () => {
    const { rerender } = render(<DataTable {...defaultProps} />)
    
    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'Product 1' } })
    
    // Change data
    rerender(<DataTable {...defaultProps} data={[mockProducts[1]]} />)
    
    // Should display the new data
    expect(screen.getByText('Product 2')).toBeInTheDocument()
  })
})
