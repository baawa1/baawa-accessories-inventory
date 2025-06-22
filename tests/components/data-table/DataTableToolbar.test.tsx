import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar'

// Mock the shadcn/ui components
jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />
  )
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span data-variant={variant} {...props}>
      {children}
    </span>
  )
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuCheckboxItem: ({ children, checked, onCheckedChange }: any) => (
    <label data-testid="dropdown-checkbox-item">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
      />
      {children}
    </label>
  ),
  DropdownMenuLabel: ({ children }: any) => <div data-testid="dropdown-label">{children}</div>,
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />
}))

// Mock icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  SlidersHorizontal: () => <div data-testid="sliders-icon" />,
  Download: () => <div data-testid="download-icon" />,
  X: () => <div data-testid="x-icon" />
}))

describe('DataTableToolbar', () => {
  // Mock React Table instance
  const createMockTable = (overrides: any = {}) => ({
    getState: jest.fn(() => ({
      columnFilters: [],
      columnVisibility: {},
      ...overrides.state
    })),
    getColumn: jest.fn((columnId: string) => ({
      getFilterValue: jest.fn(() => ''),
      setFilterValue: jest.fn(),
    })),
    resetColumnFilters: jest.fn(),
    getFilteredSelectedRowModel: jest.fn(() => ({
      rows: overrides.selectedRows || []
    })),
    getAllColumns: jest.fn(() => [
      { 
        id: 'name', 
        getCanHide: () => true, 
        getIsVisible: () => true,
        columnDef: { header: 'Name' }
      },
      { 
        id: 'sku', 
        getCanHide: () => true, 
        getIsVisible: () => true,
        columnDef: { header: 'SKU' }
      },
      { 
        id: 'category_id', 
        getCanHide: () => true, 
        getIsVisible: () => false,
        columnDef: { header: 'Category' }
      },
    ]),
    getToggleAllColumnsVisibilityHandler: jest.fn(() => jest.fn()),
    ...overrides
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render search input', () => {
    const mockTable = createMockTable()
    render(<DataTableToolbar table={mockTable} />)
    
    const searchInput = screen.getByPlaceholderText('Search products...')
    expect(searchInput).toBeInTheDocument()
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('should handle search input changes', () => {
    const mockSetFilterValue = jest.fn()
    const mockTable = createMockTable({
      getColumn: jest.fn(() => ({
        getFilterValue: jest.fn(() => ''),
        setFilterValue: mockSetFilterValue,
      }))
    })
    
    render(<DataTableToolbar table={mockTable} />)
    
    const searchInput = screen.getByPlaceholderText('Search products...')
    fireEvent.change(searchInput, { target: { value: 'test search' } })
    
    expect(mockSetFilterValue).toHaveBeenCalledWith('test search')
  })

  it('should display current search value', () => {
    const mockTable = createMockTable({
      getColumn: jest.fn(() => ({
        getFilterValue: jest.fn(() => 'existing search'),
        setFilterValue: jest.fn(),
      }))
    })
    
    render(<DataTableToolbar table={mockTable} />)
    
    const searchInput = screen.getByDisplayValue('existing search')
    expect(searchInput).toBeInTheDocument()
  })

  it('should render category filter input', () => {
    const mockTable = createMockTable()
    render(<DataTableToolbar table={mockTable} />)
    
    const categoryInput = screen.getByPlaceholderText('Filter by category...')
    expect(categoryInput).toBeInTheDocument()
  })

  it('should show clear filters button when filters are active', () => {
    const mockTable = createMockTable({
      state: {
        columnFilters: [{ id: 'category_id', value: 'electronics' }]
      }
    })
    
    render(<DataTableToolbar table={mockTable} />)
    
    const resetButton = screen.getByText('Reset')
    expect(resetButton).toBeInTheDocument()
    expect(screen.getByTestId('x-icon')).toBeInTheDocument()
  })

  it('should handle clear filters action', () => {
    const mockResetColumnFilters = jest.fn()
    const mockTable = createMockTable({
      state: {
        columnFilters: [{ id: 'category_id', value: 'electronics' }]
      },
      resetColumnFilters: mockResetColumnFilters
    })
    
    render(<DataTableToolbar table={mockTable} />)
    
    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)
    
    expect(mockResetColumnFilters).toHaveBeenCalled()
  })

  it('should render column visibility dropdown', () => {
    const mockTable = createMockTable()
    render(<DataTableToolbar table={mockTable} />)
    
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
    expect(screen.getByText('Columns')).toBeInTheDocument()
    expect(screen.getByTestId('sliders-icon')).toBeInTheDocument()
  })

  it('should show selected count when rows are selected', () => {
    const mockTable = createMockTable({
      selectedRows: [{ id: '1' }, { id: '2' }, { id: '3' }]
    })
    
    render(<DataTableToolbar table={mockTable} />)
    
    expect(screen.getByText('3 selected')).toBeInTheDocument()
  })

  it('should not show selected count when no rows are selected', () => {
    const mockTable = createMockTable({
      selectedRows: []
    })
    
    render(<DataTableToolbar table={mockTable} />)
    
    expect(screen.queryByText('0 selected')).not.toBeInTheDocument()
  })

  it('should not show reset button when no filters are active', () => {
    const mockTable = createMockTable({
      state: {
        columnFilters: []
      }
    })
    
    render(<DataTableToolbar table={mockTable} />)
    
    expect(screen.queryByText('Reset')).not.toBeInTheDocument()
  })

  it('should handle category filter changes', () => {
    const mockSetFilterValue = jest.fn()
    const mockTable = createMockTable({
      getColumn: jest.fn((columnId) => {
        if (columnId === 'category_id') {
          return {
            getFilterValue: jest.fn(() => ''),
            setFilterValue: mockSetFilterValue,
          }
        }
        return {
          getFilterValue: jest.fn(() => ''),
          setFilterValue: jest.fn(),
        }
      })
    })
    
    render(<DataTableToolbar table={mockTable} />)
    
    const categoryInput = screen.getByPlaceholderText('Filter by category...')
    fireEvent.change(categoryInput, { target: { value: 'electronics' } })
    
    expect(mockSetFilterValue).toHaveBeenCalledWith('electronics')
  })

  it('should be accessible', () => {
    const mockTable = createMockTable()
    render(<DataTableToolbar table={mockTable} />)
    
    const searchInput = screen.getByPlaceholderText('Search products...')
    expect(searchInput).toHaveAttribute('type', 'text')
    
    const categoryInput = screen.getByPlaceholderText('Filter by category...')
    expect(categoryInput).toHaveAttribute('type', 'text')
    
    // Buttons should be focusable
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeVisible()
    })
  })
})
