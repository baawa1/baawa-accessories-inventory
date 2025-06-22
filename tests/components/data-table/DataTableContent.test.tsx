import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTableContent } from '@/components/data-table/DataTableContent'
import { Product } from '@/types/product'
import { ColumnDef } from '@tanstack/react-table'

// Mock the drag handle component
jest.mock('@/components/data-table/DragHandle', () => ({
  DragHandle: ({ rowId }: any) => (
    <div data-testid={`drag-handle-${rowId}`} className="cursor-move">
      ⋮⋮
    </div>
  )
}))

// Mock the shadcn/ui components
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, className }: any) => (
    <td className={className}>{children}</td>
  ),
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableRow: ({ children, className }: any) => (
    <tr className={className}>{children}</tr>
  )
}))

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...props}
    />
  )
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  )
}))

// Mock icons
jest.mock('lucide-react', () => ({
  MoreHorizontal: () => <div data-testid="more-icon" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronUp: () => <div data-testid="chevron-up" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="delete-icon" />,
  Package: () => <div data-testid="package-icon" />
}))

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Product 1',
    sku: 'SKU001',
    category: 'electronics',
    selling_price: 100,
    cost_price: 50,
    quantity: 10,
    min_stock_level: 5,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user1',
    variants: [
      {
        id: 'v1',
        name: 'Variant 1',
        sku: 'SKU001-V1',
        quantity: 5,
        selling_price: 110,
        cost_price: 55
      }
    ]
  },
  {
    id: '2',
    name: 'Product 2',
    sku: 'SKU002',
    category: 'books',
    selling_price: 25,
    cost_price: 15,
    quantity: 20,
    min_stock_level: 10,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user1'
  }
]

// Mock columns
const mockColumns: ColumnDef<Product>[] = [
  {
    id: 'select',
    header: 'Select',
    cell: () => <input type="checkbox" />
  },
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'sku',
    header: 'SKU'
  },
  {
    accessorKey: 'category',
    header: 'Category'
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity'
  }
]

describe('DataTableContent', () => {
  const defaultProps = {
    data: mockProducts,
    columns: mockColumns,
    selectedRows: [] as string[],
    onRowSelect: jest.fn(),
    onSelectAll: jest.fn(),
    expandedRows: {} as Record<string, boolean>,
    onRowExpand: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onAdjustStock: jest.fn(),
    sorting: [],
    onSortingChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render table with data', () => {
    render(<DataTableContent {...defaultProps} />)
    
    expect(screen.getByTestId('table')).toBeInTheDocument()
    expect(screen.getByText('Product 1')).toBeInTheDocument()
    expect(screen.getByText('Product 2')).toBeInTheDocument()
    expect(screen.getByText('SKU001')).toBeInTheDocument()
    expect(screen.getByText('SKU002')).toBeInTheDocument()
  })

  it('should render column headers', () => {
    render(<DataTableContent {...defaultProps} />)
    
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('SKU')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Quantity')).toBeInTheDocument()
  })

  it('should handle row selection', () => {
    const mockOnRowSelect = jest.fn()
    render(<DataTableContent {...defaultProps} onRowSelect={mockOnRowSelect} />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // First product checkbox (second checkbox overall)
    
    expect(mockOnRowSelect).toHaveBeenCalledWith('1')
  })

  it('should handle select all', () => {
    const mockOnSelectAll = jest.fn()
    render(<DataTableContent {...defaultProps} onSelectAll={mockOnSelectAll} />)
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0] // Header checkbox
    fireEvent.click(selectAllCheckbox)
    
    expect(mockOnSelectAll).toHaveBeenCalled()
  })

  it('should show selected rows as checked', () => {
    render(<DataTableContent {...defaultProps} selectedRows={['1']} />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    // Find the checkbox for product 1
    const product1Checkbox = checkboxes.find(cb => 
      cb.closest('tr')?.textContent?.includes('Product 1')
    )
    expect(product1Checkbox).toBeChecked()
  })

  it('should render drag handles for each row', () => {
    render(<DataTableContent {...defaultProps} />)
    
    expect(screen.getByTestId('drag-handle-1')).toBeInTheDocument()
    expect(screen.getByTestId('drag-handle-2')).toBeInTheDocument()
  })

  it('should handle row expansion for products with variants', () => {
    const mockOnRowExpand = jest.fn()
    render(<DataTableContent {...defaultProps} onRowExpand={mockOnRowExpand} />)
    
    // Find expand button for product 1 (which has variants)
    const expandButton = screen.getByTestId('chevron-down')
    fireEvent.click(expandButton.closest('button')!)
    
    expect(mockOnRowExpand).toHaveBeenCalledWith('1')
  })

  it('should show expanded variants when row is expanded', () => {
    render(<DataTableContent {...defaultProps} expandedRows={{ '1': true }} />)
    
    expect(screen.getByText('Variant 1')).toBeInTheDocument()
    expect(screen.getByText('SKU001-V1')).toBeInTheDocument()
  })

  it('should render action buttons for each row', () => {
    render(<DataTableContent {...defaultProps} />)
    
    const editIcons = screen.getAllByTestId('edit-icon')
    const deleteIcons = screen.getAllByTestId('delete-icon')
    const packageIcons = screen.getAllByTestId('package-icon')
    
    expect(editIcons).toHaveLength(2) // One for each product
    expect(deleteIcons).toHaveLength(2)
    expect(packageIcons).toHaveLength(2)
  })

  it('should handle edit action', () => {
    const mockOnEdit = jest.fn()
    render(<DataTableContent {...defaultProps} onEdit={mockOnEdit} />)
    
    const editButtons = screen.getAllByTestId('edit-icon')
    fireEvent.click(editButtons[0].closest('button')!)
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockProducts[0])
  })

  it('should handle delete action', () => {
    const mockOnDelete = jest.fn()
    render(<DataTableContent {...defaultProps} onDelete={mockOnDelete} />)
    
    const deleteButtons = screen.getAllByTestId('delete-icon')
    fireEvent.click(deleteButtons[0].closest('button')!)
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockProducts[0])
  })

  it('should handle stock adjustment action', () => {
    const mockOnAdjustStock = jest.fn()
    render(<DataTableContent {...defaultProps} onAdjustStock={mockOnAdjustStock} />)
    
    const stockButtons = screen.getAllByTestId('package-icon')
    fireEvent.click(stockButtons[0].closest('button')!)
    
    expect(mockOnAdjustStock).toHaveBeenCalledWith(mockProducts[0])
  })

  it('should handle empty data gracefully', () => {
    render(<DataTableContent {...defaultProps} data={[]} />)
    
    expect(screen.getByTestId('table')).toBeInTheDocument()
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('should apply low stock styling', () => {
    const lowStockProduct = {
      ...mockProducts[0],
      quantity: 2 // Below min_stock_level of 5
    }
    
    render(<DataTableContent {...defaultProps} data={[lowStockProduct]} />)
    
    // Find the row and check for low stock indicator
    const quantityCell = screen.getByText('2')
    expect(quantityCell.closest('tr')).toHaveClass('bg-orange-50')
  })

  it('should handle sorting', () => {
    const mockOnSortingChange = jest.fn()
    render(<DataTableContent {...defaultProps} onSortingChange={mockOnSortingChange} />)
    
    const nameHeader = screen.getByText('Name')
    fireEvent.click(nameHeader)
    
    expect(mockOnSortingChange).toHaveBeenCalled()
  })

  it('should show sorting indicators', () => {
    const sorting = [{ id: 'name', desc: false }]
    render(<DataTableContent {...defaultProps} sorting={sorting} />)
    
    // Should show ascending sort indicator
    expect(screen.getByTestId('chevron-up')).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<DataTableContent {...defaultProps} />)
    
    const table = screen.getByTestId('table')
    expect(table).toHaveAttribute('role', 'table')
    
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeVisible()
    })
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeVisible()
    })
  })
})
