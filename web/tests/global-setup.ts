import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🏥 Setting up Healthcare Compliance SaaS E2E Testing Environment...')
  
  const { baseURL } = config.projects[0].use
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...')
    await page.goto(baseURL || 'http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    })
    
    // Verify critical healthcare compliance features are available
    console.log('🔍 Verifying healthcare compliance features...')
    
    // Check if the main application loads
    await page.waitForSelector('body', { timeout: 30000 })
    
    // Verify authentication system is ready
    const authElements = await page.locator('[data-testid="auth-provider"], [data-auth="true"], .auth-container').count()
    if (authElements === 0) {
      console.warn('⚠️  Authentication system may not be fully initialized')
    }
    
    // Set up test authentication state
    console.log('🔐 Setting up test authentication state...')
    await page.addInitScript(() => {
      // Mock authentication for E2E tests
      window.localStorage.setItem('auth-token', 'e2e-test-token')
      window.localStorage.setItem('user-data', JSON.stringify({
        id: 'e2e-test-user',
        name: 'E2E Test User',
        email: 'e2e-test@medtechinnovations.com',
        role: 'Compliance Manager',
        organization: 'E2E Test Organization',
        permissions: [
          'projects:read',
          'projects:write',
          'requirements:read',
          'requirements:write',
          'tests:read',
          'tests:write',
          'compliance:read',
          'audit:read',
          'security:read',
          'ai:use'
        ]
      }))
      
      // Mock compliance frameworks configuration
      window.localStorage.setItem('compliance-frameworks', JSON.stringify([
        'FDA QMSR',
        'ISO 13485',
        'IEC 62304',
        'ISO 14971',
        'ISO 27001',
        'HIPAA',
        'GDPR',
        '21 CFR Part 11'
      ]))
      
      // Mock organization settings
      window.localStorage.setItem('org-settings', JSON.stringify({
        id: 'e2e-test-org',
        name: 'E2E Test Healthcare Organization',
        industry: 'Medical Devices',
        regulatoryClass: 'Class II',
        complianceFrameworks: ['FDA QMSR', 'ISO 13485', 'IEC 62304'],
        securitySettings: {
          mfaRequired: true,
          sessionTimeout: 3600,
          passwordPolicy: 'strong'
        }
      }))
    })
    
    // Verify healthcare compliance data structures
    console.log('📊 Verifying compliance data structures...')
    
    // Check for compliance dashboard elements
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' })
    
    // Verify navigation structure for healthcare workflows
    const navElements = [
      'Projects',
      'Requirements', 
      'Tests',
      'Compliance',
      'Security',
      'Audit'
    ]
    
    for (const navItem of navElements) {
      const element = page.locator(`text="${navItem}"`).first()
      const isVisible = await element.isVisible().catch(() => false)
      if (!isVisible) {
        console.warn(`⚠️  Navigation item "${navItem}" not found - may affect E2E tests`)
      }
    }
    
    // Set up test data in localStorage for consistent testing
    console.log('🗄️  Setting up test data...')
    await page.addInitScript(() => {
      // Mock projects data
      window.localStorage.setItem('test-projects', JSON.stringify([
        {
          id: 'proj-e2e-1',
          name: 'E2E Test Cardiac Monitor',
          description: 'Test project for E2E testing',
          regulatoryClass: 'Class II',
          riskClass: 'Risk B',
          complianceFrameworks: ['FDA QMSR', 'ISO 13485'],
          status: 'active',
          complianceScore: 87
        }
      ]))
      
      // Mock requirements data
      window.localStorage.setItem('test-requirements', JSON.stringify([
        {
          id: 'req-e2e-1',
          title: 'E2E Test Safety Requirement',
          type: 'functional',
          priority: 'critical',
          status: 'approved',
          projectId: 'proj-e2e-1'
        }
      ]))
      
      // Mock test cases data
      window.localStorage.setItem('test-cases', JSON.stringify([
        {
          id: 'test-e2e-1',
          title: 'E2E Test Case',
          type: 'functional',
          status: 'passed',
          requirementId: 'req-e2e-1'
        }
      ]))
    })
    
    // Verify AI services are accessible (mock endpoints)
    console.log('🤖 Setting up AI service mocks...')
    await page.route('**/api/ai/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'AI service mock response',
          data: { mock: true }
        })
      })
    })
    
    // Set up security monitoring mocks
    console.log('🔒 Setting up security monitoring mocks...')
    await page.route('**/api/security/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          securityScore: 95,
          alerts: [],
          sessions: [],
          compliance: true
        })
      })
    })
    
    // Set up audit trail mocks
    console.log('📋 Setting up audit trail mocks...')
    await page.route('**/api/audit/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          events: [],
          totalCount: 0,
          compliance: '21 CFR Part 11'
        })
      })
    })
    
    console.log('✅ Healthcare Compliance SaaS E2E Testing Environment Ready!')
    
  } catch (error) {
    console.error('❌ Failed to set up E2E testing environment:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
