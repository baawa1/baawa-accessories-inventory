require('@testing-library/jest-dom')

// Mock environment variables
Object.defineProperty(process.env, 'NEXT_PUBLIC_SUPABASE_URL', {
  value: 'http://localhost:3000',
  writable: false,
})

Object.defineProperty(process.env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', {
  value: 'test-key',
  writable: false,
})

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
