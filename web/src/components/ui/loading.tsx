import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "text-primary",
        secondary: "text-muted-foreground",
        destructive: "text-destructive",
        success: "text-green-600",
      },
      size: {
        default: "h-4 w-4",
        sm: "h-3 w-3",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string
  showText?: boolean
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, variant, size, text = "Loading", showText = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center space-x-2", className)}
        role="status"
        aria-live="polite"
        aria-label={text}
        {...props}
      >
        <div className={cn(loadingVariants({ variant, size }))}>
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        {showText && (
          <span className="text-sm text-muted-foreground">{text}</span>
        )}
        <span className="sr-only">{text}</span>
      </div>
    )
  }
)
Loading.displayName = "Loading"

// Skeleton loading component for content placeholders
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
  avatar?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, lines = 1, avatar = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("animate-pulse", className)}
        role="status"
        aria-label="Loading content"
        {...props}
      >
        {avatar && (
          <div className="flex items-center space-x-4 mb-4">
            <div className="rounded-full bg-muted h-10 w-10" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-4 bg-muted rounded",
                index === lines - 1 ? "w-3/4" : "w-full"
              )}
            />
          ))}
        </div>
        <span className="sr-only">Loading content</span>
      </div>
    )
  }
)
Skeleton.displayName = "Skeleton"

// Full page loading component
export interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = "Loading page content" }: PageLoadingProps) {
  return (
    <div
      className="flex items-center justify-center min-h-[400px] w-full"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="text-center space-y-4">
        <Loading size="xl" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <span className="sr-only">{message}</span>
      </div>
    </div>
  )
}

// Button loading state
export interface ButtonLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
}

export function ButtonLoading({ 
  isLoading, 
  children, 
  loadingText = "Loading..." 
}: ButtonLoadingProps) {
  return (
    <>
      {isLoading ? (
        <>
          <Loading size="sm" className="mr-2" />
          {loadingText}
          <span className="sr-only">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </>
  )
}

export { Loading, Skeleton, loadingVariants }
