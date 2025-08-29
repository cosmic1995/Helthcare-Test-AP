import { test, expect } from '@playwright/test'

test.describe('Healthcare Compliance Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
    
    // Mock authentication for testing
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-test-token')
      window.localStorage.setItem('user-data', JSON.stringify({
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@medtechinnovations.com',
        role: 'Compliance Manager',
        organization: 'Test Organization'
      }))
    })
  })

  test('should display dashboard with compliance metrics', async ({ page }) => {
    await page.goto('/')
    
    // Check for dashboard header
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // Check for compliance overview
    await expect(page.getByText('Overall Compliance')).toBeVisible()
    await expect(page.getByText(/\d+%/)).toBeVisible()
    
    // Check for compliance framework badges
    await expect(page.getByText('FDA QMSR')).toBeVisible()
    await expect(page.getByText('ISO 13485')).toBeVisible()
    await expect(page.getByText('IEC 62304')).toBeVisible()
  })

  test('should navigate to projects and display project list', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to projects
    await page.getByRole('link', { name: /projects/i }).click()
    
    // Check projects page loaded
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible()
    
    // Check for project cards
    await expect(page.getByText('Cardiac Monitor Device')).toBeVisible()
    await expect(page.getByText('Class II')).toBeVisible()
    
    // Check for search functionality
    await expect(page.getByPlaceholder(/search projects/i)).toBeVisible()
  })

  test('should create a new project with compliance requirements', async ({ page }) => {
    await page.goto('/projects')
    
    // Click new project button
    await page.getByRole('button', { name: /new project/i }).click()
    
    // Fill out project form
    await page.getByLabel(/project name/i).fill('Test Medical Device Project')
    await page.getByLabel(/description/i).fill('E2E test project for compliance validation')
    
    // Select regulatory class
    await page.getByLabel(/regulatory class/i).selectOption('Class II')
    
    // Select compliance frameworks
    await page.getByLabel('FDA QMSR').check()
    await page.getByLabel('ISO 13485').check()
    
    // Submit form
    await page.getByRole('button', { name: /create project/i }).click()
    
    // Verify project was created
    await expect(page.getByText('Test Medical Device Project')).toBeVisible()
  })

  test('should manage requirements with traceability', async ({ page }) => {
    await page.goto('/requirements')
    
    // Check requirements page
    await expect(page.getByRole('heading', { name: /requirements/i })).toBeVisible()
    
    // Check for requirement cards
    await expect(page.getByText('Device Safety Requirements')).toBeVisible()
    await expect(page.getByText('Critical')).toBeVisible()
    
    // Click on a requirement to view details
    await page.getByText('Device Safety Requirements').click()
    
    // Check requirement detail page
    await expect(page.getByText('Traceability')).toBeVisible()
    await expect(page.getByText('Test Coverage')).toBeVisible()
    await expect(page.getByText('Regulatory References')).toBeVisible()
  })

  test('should execute AI-powered test generation workflow', async ({ page }) => {
    await page.goto('/requirements')
    
    // Navigate to AI test generator (assuming it's accessible from requirements)
    await page.getByRole('button', { name: /generate tests/i }).click()
    
    // Check AI test generator loaded
    await expect(page.getByText('AI-Powered Test Generation')).toBeVisible()
    await expect(page.getByText('Gemini AI')).toBeVisible()
    
    // Select requirements for test generation
    await page.getByText('Device Safety Shutdown').click()
    
    // Verify requirement selected
    await expect(page.getByText('1 requirement selected')).toBeVisible()
    
    // Configure test generation
    await page.getByRole('tab', { name: /configuration/i }).click()
    await page.getByLabel('Risk-Based Approach').check()
    
    // Generate tests
    await page.getByRole('button', { name: /generate tests/i }).click()
    
    // Wait for generation to complete
    await expect(page.getByText('Tests generated successfully')).toBeVisible({ timeout: 10000 })
    
    // Check generated test results
    await expect(page.getByText('Generated Test Cases')).toBeVisible()
    await expect(page.getByText(/confidence/i)).toBeVisible()
  })

  test('should display security monitoring dashboard', async ({ page }) => {
    await page.goto('/security')
    
    // Check security dashboard
    await expect(page.getByText('Security Monitoring Dashboard')).toBeVisible()
    
    // Check security metrics
    await expect(page.getByText('Authentication Success Rate')).toBeVisible()
    await expect(page.getByText('MFA Adoption')).toBeVisible()
    
    // Check for security alerts
    await expect(page.getByRole('tab', { name: /alerts/i })).toBeVisible()
    
    // Navigate to alerts tab
    await page.getByRole('tab', { name: /alerts/i }).click()
    await expect(page.getByText('Security Alerts')).toBeVisible()
  })

  test('should access audit trail with compliance filtering', async ({ page }) => {
    await page.goto('/audit')
    
    // Check audit trail page
    await expect(page.getByText('Audit Trail')).toBeVisible()
    await expect(page.getByText('21 CFR Part 11 Compliant')).toBeVisible()
    
    // Check for audit events
    await expect(page.getByText('Audit Events')).toBeVisible()
    
    // Test filtering
    await page.getByLabel('Compliance Only').check()
    
    // Check for compliance-relevant events
    await expect(page.getByText('Compliance')).toBeVisible()
    
    // Test search functionality
    await page.getByPlaceholder(/search audit events/i).fill('requirement')
    await expect(page.getByText(/requirement/i)).toBeVisible()
  })

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // Check mobile navigation
    await expect(page.getByRole('button', { name: /toggle menu/i })).toBeVisible()
    
    // Open mobile menu
    await page.getByRole('button', { name: /toggle menu/i }).click()
    
    // Check navigation items are visible
    await expect(page.getByRole('link', { name: /projects/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /requirements/i })).toBeVisible()
  })

  test('should maintain accessibility standards', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)
    
    // Check for alt text on images
    const images = await page.locator('img').all()
    for (const image of images) {
      await expect(image).toHaveAttribute('alt')
    }
    
    // Check for proper form labels
    const inputs = await page.locator('input[type="text"], input[type="email"], textarea').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      if (id) {
        await expect(page.locator(`label[for="${id}"]`)).toBeVisible()
      }
    }
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('/')
    
    // Check that error boundaries catch errors
    // This would depend on how error states are implemented
    await expect(page.getByText(/error/i).or(page.getByText(/something went wrong/i))).toBeVisible({ timeout: 5000 })
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    
    // Check that focus is visible
    const focusedElement = await page.locator(':focus').first()
    await expect(focusedElement).toBeVisible()
    
    // Test navigation with Enter key
    await page.keyboard.press('Enter')
    
    // Verify navigation occurred or action was triggered
    // This would depend on the specific focused element
  })

  test('should export compliance reports', async ({ page }) => {
    await page.goto('/compliance')
    
    // Check compliance dashboard
    await expect(page.getByText('Compliance Dashboard')).toBeVisible()
    
    // Look for export functionality
    const exportButton = page.getByRole('button', { name: /export/i })
    if (await exportButton.isVisible()) {
      // Set up download handler
      const downloadPromise = page.waitForEvent('download')
      
      await exportButton.click()
      
      // Verify download started
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/compliance.*\.(pdf|csv|xlsx)$/i)
    }
  })
})
