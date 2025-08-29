import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

// Mock authentication context for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockUser = {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@medtechinnovations.com',
    role: 'Compliance Manager',
    organization: 'Test Organization'
  }

  return (
    <div data-testid="mock-auth-provider">
      {children}
    </div>
  )
}

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <MockAuthProvider>
          {children}
          <Toaster />
        </MockAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data generators for testing
export const mockProject = {
  id: 'proj-test-1',
  name: 'Test Medical Device Project',
  description: 'Test project for healthcare compliance testing',
  status: 'active' as const,
  riskClass: 'Class II' as const,
  complianceFrameworks: ['FDA QMSR', 'ISO 13485'],
  complianceScore: 87,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  team: [
    {
      id: 'user-1',
      name: 'Test User',
      email: 'test@medtechinnovations.com',
      role: 'Compliance Manager'
    }
  ]
}

export const mockRequirement = {
  id: 'req-test-1',
  title: 'Test Safety Requirement',
  description: 'Test requirement for safety validation',
  type: 'functional' as const,
  priority: 'critical' as const,
  status: 'approved' as const,
  projectId: 'proj-test-1',
  regulatoryReferences: ['IEC 62304', 'ISO 14971'],
  acceptanceCriteria: 'System must meet safety standards',
  testCoverage: 85,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
}

export const mockTestCase = {
  id: 'tc-test-1',
  title: 'Test Case for Safety Validation',
  description: 'Automated test case for safety requirement validation',
  type: 'automated' as const,
  priority: 'critical' as const,
  status: 'passed' as const,
  requirementId: 'req-test-1',
  projectId: 'proj-test-1',
  steps: [
    {
      step: 1,
      action: 'Initialize safety monitoring system',
      expectedResult: 'System starts successfully'
    },
    {
      step: 2,
      action: 'Trigger safety threshold condition',
      expectedResult: 'System activates safety shutdown'
    }
  ],
  executionHistory: [
    {
      id: 'exec-1',
      executedAt: '2024-01-15T10:00:00Z',
      result: 'passed' as const,
      executedBy: 'test@medtechinnovations.com',
      duration: 45
    }
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
}

export const mockComplianceData = {
  overallScore: 87,
  frameworks: [
    {
      name: 'FDA QMSR',
      score: 89,
      gaps: 3,
      lastAssessment: '2024-01-15T00:00:00Z'
    },
    {
      name: 'ISO 13485',
      score: 91,
      gaps: 2,
      lastAssessment: '2024-01-14T00:00:00Z'
    },
    {
      name: 'IEC 62304',
      score: 83,
      gaps: 4,
      lastAssessment: '2024-01-13T00:00:00Z'
    }
  ],
  trends: {
    direction: 'improving' as const,
    changePercent: 5.2
  }
}

export const mockSecurityAlert = {
  id: 'alert-test-1',
  type: 'authentication' as const,
  severity: 'high' as const,
  title: 'Test Security Alert',
  description: 'Test alert for security monitoring',
  timestamp: '2024-01-15T14:30:00Z',
  source: 'Test System',
  status: 'active' as const,
  location: 'Test Location',
  deviceInfo: 'Test Device'
}

export const mockAuditEvent = {
  id: 'audit-test-1',
  timestamp: '2024-01-15T14:30:00Z',
  userId: 'user-test-1',
  userName: 'Test User',
  userEmail: 'test@medtechinnovations.com',
  action: 'Updated test requirement',
  resource: 'Test Resource',
  resourceId: 'resource-test-1',
  resourceType: 'requirement' as const,
  category: 'modification' as const,
  severity: 'info' as const,
  details: 'Test audit event for compliance tracking',
  ipAddress: '192.168.1.100',
  userAgent: 'Test User Agent',
  location: 'Test Location',
  sessionId: 'session-test-1',
  outcome: 'success' as const,
  complianceRelevant: true,
  regulatoryFrameworks: ['FDA QMSR', 'ISO 13485']
}

// Test utilities for common assertions
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toHaveClass(className)
}

export const expectToHaveAttribute = (element: HTMLElement | null, attribute: string, value?: string) => {
  if (value) {
    expect(element).toHaveAttribute(attribute, value)
  } else {
    expect(element).toHaveAttribute(attribute)
  }
}

// Accessibility testing utilities
export const expectToHaveAccessibleName = (element: HTMLElement | null, name: string) => {
  expect(element).toHaveAccessibleName(name)
}

export const expectToHaveAccessibleDescription = (element: HTMLElement | null, description: string) => {
  expect(element).toHaveAccessibleDescription(description)
}

export const expectToBeAccessible = async (container: HTMLElement) => {
  const { axe } = await import('@axe-core/react')
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 100) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (message: string, status = 500, delay = 100) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay)
  })
}

// Healthcare compliance specific test utilities
export const expectComplianceScore = (score: number, min: number, max: number) => {
  expect(score).toBeGreaterThanOrEqual(min)
  expect(score).toBeLessThanOrEqual(max)
}

export const expectRegulatoryFramework = (frameworks: string[], expectedFramework: string) => {
  expect(frameworks).toContain(expectedFramework)
}

export const expectAuditTrail = (event: any) => {
  expect(event).toHaveProperty('id')
  expect(event).toHaveProperty('timestamp')
  expect(event).toHaveProperty('userId')
  expect(event).toHaveProperty('action')
  expect(event).toHaveProperty('resource')
  expect(event).toHaveProperty('complianceRelevant')
}

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

export const expectRenderTimeUnder = async (renderFn: () => void, maxTime: number) => {
  const renderTime = await measureRenderTime(renderFn)
  expect(renderTime).toBeLessThan(maxTime)
}

// Security testing utilities
export const expectSecureHeaders = (response: Response) => {
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
  expect(response.headers.get('X-Frame-Options')).toBe('DENY')
  expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
}

export const expectNoSensitiveData = (element: HTMLElement) => {
  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    /\b\d{16}\b/, // Credit card pattern
    /password/i,
    /secret/i,
    /token/i
  ]
  
  const textContent = element.textContent || ''
  sensitivePatterns.forEach(pattern => {
    expect(textContent).not.toMatch(pattern)
  })
}

// Export everything including the custom render
export * from '@testing-library/react'
export { customRender as render }
