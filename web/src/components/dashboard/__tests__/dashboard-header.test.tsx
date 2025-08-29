import { render, screen } from '@/lib/test-utils'
import { DashboardHeader } from '../dashboard-header'

describe('DashboardHeader', () => {
  it('renders heading correctly', () => {
    render(<DashboardHeader heading="Test Dashboard" />)
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Dashboard')
  })

  it('renders optional text when provided', () => {
    const text = 'This is a test dashboard description'
    render(<DashboardHeader heading="Test Dashboard" text={text} />)
    
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('renders children when provided', () => {
    render(
      <DashboardHeader heading="Test Dashboard">
        <button>Test Button</button>
      </DashboardHeader>
    )
    
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    render(<DashboardHeader heading="Test Dashboard" text="Test description" />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveClass('text-3xl', 'font-bold', 'tracking-tight')
  })

  it('applies correct styling classes', () => {
    render(<DashboardHeader heading="Test Dashboard" />)
    
    const headerContainer = screen.getByRole('banner')
    expect(headerContainer).toHaveClass('flex', 'items-center', 'justify-between', 'space-y-2')
  })

  it('is accessible', async () => {
    const { container } = render(
      <DashboardHeader 
        heading="Healthcare Compliance Dashboard" 
        text="Monitor your organization's compliance status and metrics"
      />
    )
    
    // Check for proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveAccessibleName('Healthcare Compliance Dashboard')
    
    // Ensure no accessibility violations
    await expect(container).toBeAccessible()
  })

  it('handles long text gracefully', () => {
    const longHeading = 'This is a very long dashboard heading that should wrap properly and maintain readability'
    const longText = 'This is a very long description that provides detailed information about the dashboard functionality and should wrap appropriately without breaking the layout'
    
    render(<DashboardHeader heading={longHeading} text={longText} />)
    
    expect(screen.getByText(longHeading)).toBeInTheDocument()
    expect(screen.getByText(longText)).toBeInTheDocument()
  })

  it('supports custom className through children', () => {
    render(
      <DashboardHeader heading="Test Dashboard">
        <div className="custom-class">Custom content</div>
      </DashboardHeader>
    )
    
    expect(screen.getByText('Custom content')).toHaveClass('custom-class')
  })
})
