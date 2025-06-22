import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTablePagination } from '@/components/data-table/DataTablePagination'

// Mock the shadcn/ui components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <select 
      data-testid="page-size-select"
      onChange={(e) => onValueChange(e.target.value)}
      value={value}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <span>{children}</span>
}))

// Mock icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="chevron-left" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  ChevronsLeft: () => <div data-testid="chevrons-left" />,
  ChevronsRight: () => <div data-testid="chevrons-right" />
}))

describe('DataTablePagination', () => {
  const defaultProps = {
    pageIndex: 0,
    pageSize: 10,
    pageCount: 5,
    totalItems: 50,
    canPreviousPage: false,
    canNextPage: true,
    gotoPage: jest.fn(),
    nextPage: jest.fn(),
    previousPage: jest.fn(),
    setPageSize: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render pagination info', () => {
    render(<DataTablePagination {...defaultProps} />)
    
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument()
    expect(screen.getByText('50 total items')).toBeInTheDocument()
  })

  it('should render navigation buttons', () => {
    render(<DataTablePagination {...defaultProps} />)
    
    expect(screen.getByTestId('chevrons-left')).toBeInTheDocument()
    expect(screen.getByTestId('chevron-left')).toBeInTheDocument()
    expect(screen.getByTestId('chevron-right')).toBeInTheDocument()
    expect(screen.getByTestId('chevrons-right')).toBeInTheDocument()
  })

  it('should disable previous buttons on first page', () => {
    render(<DataTablePagination {...defaultProps} />)
    
    const firstPageButton = screen.getByTestId('chevrons-left').closest('button')
    const prevPageButton = screen.getByTestId('chevron-left').closest('button')
    
    expect(firstPageButton).toBeDisabled()
    expect(prevPageButton).toBeDisabled()
  })

  it('should disable next buttons on last page', () => {
    const lastPageProps = {
      ...defaultProps,
      pageIndex: 4,
      canPreviousPage: true,
      canNextPage: false
    }
    
    render(<DataTablePagination {...lastPageProps} />)
    
    const lastPageButton = screen.getByTestId('chevrons-right').closest('button')
    const nextPageButton = screen.getByTestId('chevron-right').closest('button')
    
    expect(lastPageButton).toBeDisabled()
    expect(nextPageButton).toBeDisabled()
  })

  it('should handle first page navigation', () => {
    const mockGotoPage = jest.fn()
    const props = {
      ...defaultProps,
      pageIndex: 2,
      canPreviousPage: true,
      gotoPage: mockGotoPage
    }
    
    render(<DataTablePagination {...props} />)
    
    const firstPageButton = screen.getByTestId('chevrons-left').closest('button')!
    fireEvent.click(firstPageButton)
    
    expect(mockGotoPage).toHaveBeenCalledWith(0)
  })

  it('should handle previous page navigation', () => {
    const mockPreviousPage = jest.fn()
    const props = {
      ...defaultProps,
      pageIndex: 2,
      canPreviousPage: true,
      previousPage: mockPreviousPage
    }
    
    render(<DataTablePagination {...props} />)
    
    const prevPageButton = screen.getByTestId('chevron-left').closest('button')!
    fireEvent.click(prevPageButton)
    
    expect(mockPreviousPage).toHaveBeenCalled()
  })

  it('should handle next page navigation', () => {
    const mockNextPage = jest.fn()
    
    render(<DataTablePagination {...defaultProps} nextPage={mockNextPage} />)
    
    const nextPageButton = screen.getByTestId('chevron-right').closest('button')!
    fireEvent.click(nextPageButton)
    
    expect(mockNextPage).toHaveBeenCalled()
  })

  it('should handle last page navigation', () => {
    const mockGotoPage = jest.fn()
    
    render(<DataTablePagination {...defaultProps} gotoPage={mockGotoPage} />)
    
    const lastPageButton = screen.getByTestId('chevrons-right').closest('button')!
    fireEvent.click(lastPageButton)
    
    expect(mockGotoPage).toHaveBeenCalledWith(4) // pageCount - 1
  })

  it('should render page size selector', () => {
    render(<DataTablePagination {...defaultProps} />)
    
    const pageSizeSelect = screen.getByTestId('page-size-select')
    expect(pageSizeSelect).toBeInTheDocument()
    expect(pageSizeSelect).toHaveValue('10')
  })

  it('should handle page size changes', () => {
    const mockSetPageSize = jest.fn()
    
    render(<DataTablePagination {...defaultProps} setPageSize={mockSetPageSize} />)
    
    const pageSizeSelect = screen.getByTestId('page-size-select')
    fireEvent.change(pageSizeSelect, { target: { value: '20' } })
    
    expect(mockSetPageSize).toHaveBeenCalledWith('20')
  })

  it('should show correct page numbers for middle pages', () => {
    const middlePageProps = {
      ...defaultProps,
      pageIndex: 2,
      canPreviousPage: true,
      canNextPage: true
    }
    
    render(<DataTablePagination {...middlePageProps} />)
    
    expect(screen.getByText('Page 3 of 5')).toBeInTheDocument()
  })

  it('should handle single page scenario', () => {
    const singlePageProps = {
      ...defaultProps,
      pageCount: 1,
      totalItems: 5,
      canNextPage: false
    }
    
    render(<DataTablePagination {...singlePageProps} />)
    
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    
    const firstPageButton = screen.getByTestId('chevrons-left').closest('button')
    const prevPageButton = screen.getByTestId('chevron-left').closest('button')
    const nextPageButton = screen.getByTestId('chevron-right').closest('button')
    const lastPageButton = screen.getByTestId('chevrons-right').closest('button')
    
    expect(firstPageButton).toBeDisabled()
    expect(prevPageButton).toBeDisabled()
    expect(nextPageButton).toBeDisabled()
    expect(lastPageButton).toBeDisabled()
  })

  it('should handle zero items scenario', () => {
    const emptyProps = {
      ...defaultProps,
      pageCount: 0,
      totalItems: 0,
      canNextPage: false
    }
    
    render(<DataTablePagination {...emptyProps} />)
    
    expect(screen.getByText('0 total items')).toBeInTheDocument()
  })

  it('should display rows per page text', () => {
    render(<DataTablePagination {...defaultProps} />)
    
    expect(screen.getByText('Rows per page')).toBeInTheDocument()
  })

  it('should show current items range', () => {
    render(<DataTablePagination {...defaultProps} />)
    
    // Page 1, 10 items per page, 50 total
    expect(screen.getByText('Showing 1-10 of 50')).toBeInTheDocument()
  })

  it('should show correct range for last page with partial items', () => {
    const lastPageProps = {
      ...defaultProps,
      pageIndex: 4,
      totalItems: 47,
      canPreviousPage: true,
      canNextPage: false
    }
    
    render(<DataTablePagination {...lastPageProps} />)
    
    // Page 5, should show 41-47 of 47
    expect(screen.getByText('Showing 41-47 of 47')).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<DataTablePagination {...defaultProps} />)
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeVisible()
      // Navigation buttons should have accessible names
      if (button.querySelector('[data-testid*="chevron"]')) {
        expect(button).toHaveTextContent('')
      }
    })
    
    const select = screen.getByTestId('page-size-select')
    expect(select).toBeVisible()
  })

  it('should handle page size options', () => {
    render(<DataTablePagination {...defaultProps} />)
    
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(4) // 10, 20, 50, 100
    expect(options[0]).toHaveValue('10')
    expect(options[1]).toHaveValue('20')
    expect(options[2]).toHaveValue('50')
    expect(options[3]).toHaveValue('100')
  })
})
