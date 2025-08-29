import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
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

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
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

// Mock clipboard API for healthcare compliance data export
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
})

// Mock geolocation for security monitoring
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn().mockImplementation((success) =>
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      })
    ),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
})

// Mock Web Crypto API for security features
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockReturnValue(new Uint32Array(10)),
    subtle: {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      digest: jest.fn(),
      generateKey: jest.fn(),
      deriveKey: jest.fn(),
      deriveBits: jest.fn(),
      importKey: jest.fn(),
      exportKey: jest.fn(),
      wrapKey: jest.fn(),
      unwrapKey: jest.fn(),
    },
  },
})

// Mock File API for document upload
global.File = class MockFile {
  constructor(parts, filename, properties) {
    this.parts = parts
    this.name = filename
    this.size = parts.reduce((acc, part) => acc + part.length, 0)
    this.type = properties?.type || 'text/plain'
    this.lastModified = Date.now()
  }
}

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0
    this.result = null
    this.error = null
    this.onload = null
    this.onerror = null
    this.onabort = null
  }

  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2
      this.result = 'mock file content'
      if (this.onload) this.onload({ target: this })
    }, 0)
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ='
      if (this.onload) this.onload({ target: this })
    }, 0)
  }
}

// Mock localStorage for authentication and settings
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage for temporary data
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock performance API for monitoring
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn().mockReturnValue([]),
  getEntriesByType: jest.fn().mockReturnValue([]),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  now: jest.fn(() => Date.now()),
}

// Mock console methods to reduce test noise
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillUpdate'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Global test utilities for healthcare compliance
global.testUtils = {
  // Mock compliance data
  mockComplianceFrameworks: ['FDA QMSR', 'ISO 13485', 'IEC 62304', 'ISO 14971'],
  mockRiskClasses: ['Class I', 'Class II', 'Class III'],
  mockUserRoles: ['Compliance Manager', 'QA Engineer', 'Regulatory Specialist'],
  
  // Mock API endpoints
  mockApiEndpoints: {
    projects: '/api/projects',
    requirements: '/api/requirements',
    tests: '/api/tests',
    compliance: '/api/compliance',
    audit: '/api/audit',
    security: '/api/security',
  },
  
  // Healthcare compliance test helpers
  generateMockAuditEvent: (overrides = {}) => ({
    id: 'audit-test-' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    userId: 'user-test-1',
    userName: 'Test User',
    userEmail: 'test@medtechinnovations.com',
    action: 'Test Action',
    resource: 'Test Resource',
    resourceType: 'test',
    category: 'modification',
    severity: 'info',
    complianceRelevant: true,
    regulatoryFrameworks: ['FDA QMSR'],
    ...overrides,
  }),
  
  generateMockSecurityAlert: (overrides = {}) => ({
    id: 'alert-test-' + Math.random().toString(36).substr(2, 9),
    type: 'authentication',
    severity: 'medium',
    title: 'Test Security Alert',
    description: 'Test alert description',
    timestamp: new Date().toISOString(),
    status: 'active',
    ...overrides,
  }),
}

// Set up fake timers for testing time-dependent functionality
jest.useFakeTimers({
  advanceTimers: true,
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
  localStorage.clear()
  sessionStorage.clear()
})
