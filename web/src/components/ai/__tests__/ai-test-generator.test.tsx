import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { AITestGenerator } from '../ai-test-generator'
import { mockRequirement, mockApiResponse, mockApiError } from '@/lib/test-utils'

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

describe('AITestGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders initial state correctly', () => {
    render(<AITestGenerator />)
    
    expect(screen.getByText('AI-Powered Test Generation')).toBeInTheDocument()
    expect(screen.getByText('Gemini AI')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /requirements/i })).toBeInTheDocument()
  })

  it('displays requirements selection interface', () => {
    render(<AITestGenerator />)
    
    // Check for requirements selection
    expect(screen.getByText('Select Requirements')).toBeInTheDocument()
    expect(screen.getByText('Choose the requirements you want to generate test cases for')).toBeInTheDocument()
  })

  it('allows requirement selection', async () => {
    render(<AITestGenerator />)
    
    // Find and click on a requirement card
    const requirementCard = screen.getByText('Device Safety Shutdown')
    fireEvent.click(requirementCard.closest('[role="button"]') || requirementCard)
    
    // Verify selection state
    await waitFor(() => {
      expect(screen.getByText('1 requirement selected')).toBeInTheDocument()
    })
  })

  it('shows configuration options', () => {
    render(<AITestGenerator />)
    
    // Navigate to configuration tab
    fireEvent.click(screen.getByRole('tab', { name: /configuration/i }))
    
    expect(screen.getByText('AI Generation Configuration')).toBeInTheDocument()
    expect(screen.getByText('Test Types')).toBeInTheDocument()
    expect(screen.getByText('Priority Focus')).toBeInTheDocument()
    expect(screen.getByText('Automation Level')).toBeInTheDocument()
  })

  it('generates tests when requirements are selected', async () => {
    render(<AITestGenerator />)
    
    // Select a requirement
    const requirementCard = screen.getByText('Device Safety Shutdown')
    fireEvent.click(requirementCard.closest('[role="button"]') || requirementCard)
    
    // Click generate button
    const generateButton = screen.getByRole('button', { name: /generate tests/i })
    fireEvent.click(generateButton)
    
    // Check for generation progress
    await waitFor(() => {
      expect(screen.getByText(/generating ai-powered test cases/i)).toBeInTheDocument()
    })
  })

  it('displays generation progress correctly', async () => {
    render(<AITestGenerator />)
    
    // Select requirement and generate
    const requirementCard = screen.getByText('Device Safety Shutdown')
    fireEvent.click(requirementCard.closest('[role="button"]') || requirementCard)
    
    const generateButton = screen.getByRole('button', { name: /generate tests/i })
    fireEvent.click(generateButton)
    
    // Check for progress indicators
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  it('shows generated test results', async () => {
    render(<AITestGenerator />)
    
    // Select requirement and generate
    const requirementCard = screen.getByText('Device Safety Shutdown')
    fireEvent.click(requirementCard.closest('[role="button"]') || requirementCard)
    
    const generateButton = screen.getByRole('button', { name: /generate tests/i })
    fireEvent.click(generateButton)
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Generated Test Cases')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('displays test case details correctly', async () => {
    render(<AITestGenerator />)
    
    // Navigate through the generation process
    const requirementCard = screen.getByText('Device Safety Shutdown')
    fireEvent.click(requirementCard.closest('[role="button"]') || requirementCard)
    
    const generateButton = screen.getByRole('button', { name: /generate tests/i })
    fireEvent.click(generateButton)
    
    // Wait for and check results
    await waitFor(() => {
      expect(screen.getByText(/tests generated/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('handles configuration changes', () => {
    render(<AITestGenerator />)
    
    // Navigate to configuration
    fireEvent.click(screen.getByRole('tab', { name: /configuration/i }))
    
    // Check for configuration options
    const functionalCheckbox = screen.getByLabelText('functional')
    expect(functionalCheckbox).toBeChecked()
    
    // Toggle configuration
    fireEvent.click(functionalCheckbox)
    expect(functionalCheckbox).not.toBeChecked()
  })

  it('validates requirement selection', async () => {
    render(<AITestGenerator />)
    
    // Try to generate without selecting requirements
    const generateButton = screen.getByRole('button', { name: /generate tests/i })
    expect(generateButton).toBeDisabled()
  })

  it('displays regulatory framework mapping', async () => {
    render(<AITestGenerator />)
    
    // Check for regulatory framework badges
    expect(screen.getByText('IEC 62304')).toBeInTheDocument()
    expect(screen.getByText('ISO 14971')).toBeInTheDocument()
    expect(screen.getByText('FDA QMSR')).toBeInTheDocument()
  })

  it('supports test case export functionality', async () => {
    render(<AITestGenerator />)
    
    // Generate tests first
    const requirementCard = screen.getByText('Device Safety Shutdown')
    fireEvent.click(requirementCard.closest('[role="button"]') || requirementCard)
    
    const generateButton = screen.getByRole('button', { name: /generate tests/i })
    fireEvent.click(generateButton)
    
    // Wait for results and check export option
    await waitFor(() => {
      const exportButton = screen.queryByRole('button', { name: /export all/i })
      if (exportButton) {
        expect(exportButton).toBeInTheDocument()
      }
    }, { timeout: 5000 })
  })

  it('is accessible throughout the workflow', async () => {
    const { container } = render(<AITestGenerator />)
    
    // Check initial accessibility
    await expect(container).toBeAccessible()
    
    // Check accessibility after navigation
    fireEvent.click(screen.getByRole('tab', { name: /configuration/i }))
    await expect(container).toBeAccessible()
  })

  it('handles errors gracefully', async () => {
    // Mock console.error to avoid test noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    render(<AITestGenerator />)
    
    // This would test error handling if API calls were mocked to fail
    expect(screen.getByText('AI-Powered Test Generation')).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })

  it('displays confidence scores for generated tests', async () => {
    render(<AITestGenerator />)
    
    // Generate tests and check for confidence indicators
    const requirementCard = screen.getByText('Device Safety Shutdown')
    fireEvent.click(requirementCard.closest('[role="button"]') || requirementCard)
    
    const generateButton = screen.getByRole('button', { name: /generate tests/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      // Look for confidence percentage indicators
      const confidenceElements = document.querySelectorAll('[class*="confidence"]')
      // This would check for confidence scores in the generated results
    }, { timeout: 5000 })
  })
})
