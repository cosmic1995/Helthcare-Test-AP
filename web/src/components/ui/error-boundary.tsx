'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { announceToScreenReader } from '@/lib/accessibility'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Announce error to screen readers
    announceToScreenReader(
      'An error has occurred. Please try refreshing the page or contact support if the problem persists.',
      'assertive'
    )
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // Log error for debugging
    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    announceToScreenReader('Error cleared. Page content restored.', 'polite')
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError, errorInfo }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div 
      className="min-h-[400px] flex items-center justify-center p-4"
      role="alert"
      aria-live="assertive"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            We encountered an unexpected error. This has been logged and our team has been notified.
          </p>
          
          {isDevelopment && error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Error Details (Development)
              </summary>
              <div className="bg-muted p-3 rounded text-xs font-mono overflow-auto max-h-32">
                <div className="text-red-600 font-bold mb-2">{error.name}: {error.message}</div>
                <pre className="whitespace-pre-wrap">{error.stack}</pre>
                {errorInfo && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="font-bold mb-1">Component Stack:</div>
                    <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={resetError} className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex items-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            If this problem persists, please{' '}
            <a 
              href="mailto:support@healthcompliance.com" 
              className="underline hover:no-underline"
            >
              contact support
            </a>
            {' '}with the error details.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Simplified error boundary for smaller components
export function SimpleErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <div 
          className="p-4 border border-red-200 rounded-lg bg-red-50"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Component Error
            </span>
          </div>
          <p className="text-sm text-red-700 mb-3">
            This component encountered an error and couldn't render properly.
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={resetError}
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
    announceToScreenReader('Error cleared', 'polite')
  }, [])

  const handleError = React.useCallback((error: Error) => {
    setError(error)
    announceToScreenReader(
      'An error occurred. Please check the error message and try again.',
      'assertive'
    )
    console.error('Component error:', error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError, error }
}

export type { ErrorBoundaryProps, ErrorFallbackProps }
