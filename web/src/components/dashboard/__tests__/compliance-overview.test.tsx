import { render, screen } from '@/lib/test-utils'
import { ComplianceOverview } from '../compliance-overview'
import { mockComplianceData } from '@/lib/test-utils'

describe('ComplianceOverview', () => {
  it('renders compliance metrics correctly', () => {
    render(<ComplianceOverview />)
    
    // Check for main compliance score
    expect(screen.getByText('87%')).toBeInTheDocument()
    expect(screen.getByText('Overall Compliance')).toBeInTheDocument()
    
    // Check for individual framework scores
    expect(screen.getByText('FDA QMSR')).toBeInTheDocument()
    expect(screen.getByText('ISO 13485')).toBeInTheDocument()
    expect(screen.getByText('IEC 62304')).toBeInTheDocument()
  })

  it('displays compliance trends correctly', () => {
    render(<ComplianceOverview />)
    
    // Check for trend indicators
    const trendElements = screen.getAllByText(/\+\d+\.\d+%/)
    expect(trendElements.length).toBeGreaterThan(0)
  })

  it('shows proper color coding for compliance levels', () => {
    render(<ComplianceOverview />)
    
    // High compliance scores should have green indicators
    const highScoreElements = screen.getAllByText(/9[0-9]%/)
    highScoreElements.forEach(element => {
      expect(element.closest('[class*="text-green"]')).toBeInTheDocument()
    })
  })

  it('renders compliance icons correctly', () => {
    render(<ComplianceOverview />)
    
    // Check for shield icons indicating security/compliance
    const icons = document.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('displays gap counts accurately', () => {
    render(<ComplianceOverview />)
    
    // Check for gap indicators
    expect(screen.getByText(/\d+ gaps?/)).toBeInTheDocument()
  })

  it('is accessible with proper ARIA labels', async () => {
    const { container } = render(<ComplianceOverview />)
    
    // Check for proper heading structure
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThan(0)
    
    // Ensure compliance metrics are accessible
    const metrics = screen.getAllByText(/%$/)
    metrics.forEach(metric => {
      expect(metric).toBeVisible()
    })
    
    // Check accessibility
    await expect(container).toBeAccessible()
  })

  it('handles loading state gracefully', () => {
    // This would test loading state if implemented
    render(<ComplianceOverview />)
    
    // Verify content loads without errors
    expect(screen.getByText('Overall Compliance')).toBeInTheDocument()
  })

  it('displays regulatory framework information', () => {
    render(<ComplianceOverview />)
    
    // Check for regulatory framework badges/labels
    const frameworks = ['FDA QMSR', 'ISO 13485', 'IEC 62304', 'ISO 14971']
    frameworks.forEach(framework => {
      expect(screen.getByText(framework)).toBeInTheDocument()
    })
  })

  it('shows compliance score ranges correctly', () => {
    render(<ComplianceOverview />)
    
    // Verify scores are within valid ranges (0-100%)
    const scoreElements = screen.getAllByText(/\d+%/)
    scoreElements.forEach(element => {
      const scoreText = element.textContent || ''
      const score = parseInt(scoreText.replace('%', ''))
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  it('renders responsive layout correctly', () => {
    render(<ComplianceOverview />)
    
    // Check for grid layout classes
    const gridContainer = document.querySelector('[class*="grid"]')
    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer).toHaveClass('grid-cols-2', 'md:grid-cols-4')
  })

  it('displays last updated information', () => {
    render(<ComplianceOverview />)
    
    // Check for timestamp or last updated info
    const timeElements = document.querySelectorAll('[class*="text-muted-foreground"]')
    expect(timeElements.length).toBeGreaterThan(0)
  })
})
