import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Set mock environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Supabase client before any imports
// Create a chainable mock object that properly supports method chaining
// In Supabase, the builder is thenable (can be awaited directly)
const createChainableMock = () => {
  const chain = {}
  
  // Default response
  let responseData = { data: null, error: null }
  
  // All chainable methods return the chain itself
  const chainableMethods = [
    'select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'rangeGt', 'rangeGte',
    'rangeLt', 'rangeLte', 'rangeAdjacent', 'overlaps', 'textSearch', 'match',
    'not', 'or', 'filter', 'order', 'limit', 'range', 'abortSignal', 'returns',
    'upsert', 'onConflict'
  ]
  
  chainableMethods.forEach(method => {
    chain[method] = vi.fn(() => chain)
  })
  
  // Terminal methods that return promises
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  
  // Make the chain thenable so it can be awaited directly
  // When you await the chain after chaining methods, it resolves to the response
  chain.then = vi.fn((resolve) => {
    return Promise.resolve(responseData).then(resolve)
  })
  chain.catch = vi.fn((reject) => {
    return Promise.resolve(responseData).catch(reject)
  })
  
  return chain
}

vi.mock('../api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn(() => createChainableMock()),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file' } }),
      }),
    },
  },
}))

// Mock PermissionsProvider - default mock for all tests
vi.mock('../contexts/PermissionsProvider', () => ({
  usePermissions: vi.fn(() => ({
    loading: false,
    error: null,
    permissions: {
      role_level: 4, // Super admin by default in tests
      role_code: 'CEO',
      can_create_records: true,
      can_edit_all_records: true,
      can_delete_all_records: true,
      can_view_all_records: true,
    },
    roleLevel: 4,
    roleCode: 'CEO',
    clientPermissions: {
      canViewSection: true,
      canAccessDashboard: true,
      canAccessInfo: true,
      canAccessJobOrders: true,
      canViewLinkedContacts: true,
      canCreateClients: true,
      canEditClients: true,
      canDeleteClients: true,
      canCreateJobOrders: true,
      canEditJobOrders: true,
      canDeleteJobOrders: true,
    },
    menuPermissions: {},
    menuItems: [],
    hasMenuAccess: vi.fn(() => true), // Default to allowing all menu access
    refresh: vi.fn(),
  })),
  PermissionsProvider: ({ children }) => children,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
