require('@testing-library/jest-dom')

// Mock React Table for DataTable components
jest.mock('@tanstack/react-table', () => ({
  useReactTable: jest.fn(() => ({
    getHeaderGroups: () => [
      {
        id: 'header-group-1',
        headers: [
          { id: 'select', column: { id: 'select', columnDef: { header: 'Select' } } },
          { id: 'name', column: { id: 'name', columnDef: { header: 'Name' } } },
          { id: 'category', column: { id: 'category', columnDef: { header: 'Category' } } },
          { id: 'price', column: { id: 'price', columnDef: { header: 'Price' } } },
        ]
      }
    ],
    getRowModel: () => ({
      rows: [
        { id: 'row-1', original: { id: '1', name: 'Test Product', category: 'Electronics' } },
        { id: 'row-2', original: { id: '2', name: 'Another Product', category: 'Books' } }
      ]
    }),
    getFilteredRowModel: () => ({
      rows: [
        { id: 'row-1', original: { id: '1', name: 'Test Product', category: 'Electronics' } }
      ]
    }),
    getFilteredSelectedRowModel: () => ({ rows: [] }),
    getState: () => ({
      columnFilters: [],
      globalFilter: '',
      pagination: { pageIndex: 0, pageSize: 10 },
      rowSelection: {}
    }),
    setGlobalFilter: jest.fn(),
    getCanPreviousPage: () => false,
    getCanNextPage: () => true,
    previousPage: jest.fn(),
    nextPage: jest.fn(),
    setPageIndex: jest.fn(),
    setPageSize: jest.fn(),
    getPageCount: () => 5,
    getAllColumns: () => [],
    getColumn: () => ({ toggleVisibility: jest.fn(), getIsVisible: () => true }),
    resetColumnFilters: jest.fn(),
    toggleAllRowsSelected: jest.fn(),
    getIsAllRowsSelected: () => false,
    getIsSomeRowsSelected: () => false
  })),
  createColumnHelper: () => ({
    accessor: jest.fn((key, config) => ({ accessorKey: key, ...config })),
    display: jest.fn((config) => ({ ...config }))
  }),
  getCoreRowModel: () => ({}),
  getFilteredRowModel: () => ({}),
  getPaginationRowModel: () => ({}),
  getSortedRowModel: () => ({}),
  getFacetedRowModel: () => ({}),
  getFacetedUniqueValues: () => ({})
}))

// Don't override global Request for NextRequest compatibility
// Instead, create a more specific mock that won't conflict

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = (init && init.status) || 200
    this.statusText = (init && init.statusText) || 'OK'
    this.headers = new Headers(init && init.headers)
    this.ok = this.status >= 200 && this.status < 300
  }
  
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init && init.headers)
      }
    })
  }
  
  async json() {
    return JSON.parse(this.body || '{}')
  }
  
  async text() {
    return this.body || ''
  }
}

global.Headers = class Headers {
  constructor(init) {
    this.headers = new Map()
    if (init) {
      if (init instanceof Headers) {
        for (const [key, value] of init.headers) {
          this.headers.set(key.toLowerCase(), value)
        }
      } else if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.headers.set(key.toLowerCase(), value)
        }
      } else {
        for (const [key, value] of Object.entries(init)) {
          this.headers.set(key.toLowerCase(), value)
        }
      }
    }
  }
  
  get(name) {
    return this.headers.get(name.toLowerCase())
  }
  
  set(name, value) {
    this.headers.set(name.toLowerCase(), value)
  }
  
  has(name) {
    return this.headers.has(name.toLowerCase())
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Supabase client  
jest.mock('./src/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        range: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
      upsert: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signUp: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://test.com/image.jpg' } })),
      })),
    },
  },
}))

// Mock uploadProductImage
jest.mock('./src/lib/uploadProductImage', () => ({
  uploadProductImage: jest.fn(() => Promise.resolve('http://example.com/image.jpg')),
}))

// Mock the toast hook
jest.mock('./src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

// Mock shadcn/ui components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    React.createElement('button', { onClick, ...props }, children)
  ),
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props) => React.createElement('input', props),
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }) => React.createElement('label', props, children),
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }) => React.createElement('div', props, children),
  CardContent: ({ children, ...props }) => React.createElement('div', props, children),
  CardHeader: ({ children, ...props }) => React.createElement('div', props, children),
  CardTitle: ({ children, ...props }) => React.createElement('h2', props, children),
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }) => open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null,
  DialogContent: ({ children, ...props }) => React.createElement('div', props, children),
  DialogHeader: ({ children, ...props }) => React.createElement('div', props, children),
  DialogTitle: ({ children, ...props }) => React.createElement('h2', props, children),
  DialogFooter: ({ children, ...props }) => React.createElement('div', props, children),
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }) => React.createElement('div', null, children),
  SelectTrigger: ({ children, ...props }) => React.createElement('button', props, children),
  SelectValue: ({ placeholder }) => React.createElement('span', null, placeholder),
  SelectContent: ({ children, ...props }) => React.createElement('div', props, children),
  SelectItem: ({ children, value, ...props }) => React.createElement('option', { value, ...props }, children),
}))

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props) => React.createElement('textarea', props),
}))

// Global React for JSX components
global.React = require('react')
