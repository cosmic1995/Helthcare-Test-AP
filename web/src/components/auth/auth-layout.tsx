import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  showBackButton?: boolean
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  showBackButton = false 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="mx-auto max-w-md">
          <div className="flex items-center space-x-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Healthcare Compliance
              </h1>
              <p className="text-sm text-muted-foreground">SaaS Platform</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Production-grade compliance platform
              </h2>
              <p className="text-muted-foreground">
                Automate regulatory requirements into traceable, compliant test cases 
                with enterprise ALM integrations and AI-powered generation.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">
                  FDA QMSR, ISO 13485, IEC 62304 compliant
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">
                  Enterprise ALM integrations (Jira, Azure DevOps, Polarion)
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">
                  AI-powered test generation with RAG pipelines
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">
                  Secure, scalable, serverless architecture on Google Cloud
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2 lg:hidden">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Healthcare Compliance</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Back button */}
          {showBackButton && (
            <div className="mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to sign in</span>
                </Link>
              </Button>
            </div>
          )}

          {/* Title and subtitle */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          {/* Auth form */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
