import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Healthcare compliance specific variants
        compliant:
          "border-transparent bg-compliance-compliant/10 text-compliance-compliant hover:bg-compliance-compliant/20",
        "mostly-compliant":
          "border-transparent bg-compliance-mostly-compliant/10 text-compliance-mostly-compliant hover:bg-compliance-mostly-compliant/20",
        "non-compliant":
          "border-transparent bg-compliance-non-compliant/10 text-compliance-non-compliant hover:bg-compliance-non-compliant/20",
        "not-executed":
          "border-transparent bg-compliance-not-executed/10 text-compliance-not-executed hover:bg-compliance-not-executed/20",
        "no-tests":
          "border-transparent bg-compliance-no-tests/10 text-compliance-no-tests hover:bg-compliance-no-tests/20",
        // Risk classification variants
        "risk-a":
          "border-transparent bg-risk-class-a/10 text-risk-class-a hover:bg-risk-class-a/20",
        "risk-b":
          "border-transparent bg-risk-class-b/10 text-risk-class-b hover:bg-risk-class-b/20",
        "risk-c":
          "border-transparent bg-risk-class-c/10 text-risk-class-c hover:bg-risk-class-c/20",
        "risk-d":
          "border-transparent bg-risk-class-d/10 text-risk-class-d hover:bg-risk-class-d/20",
        // Status variants
        draft:
          "border-transparent bg-status-draft/10 text-status-draft hover:bg-status-draft/20",
        "under-review":
          "border-transparent bg-status-under-review/10 text-status-under-review hover:bg-status-under-review/20",
        approved:
          "border-transparent bg-status-approved/10 text-status-approved hover:bg-status-approved/20",
        rejected:
          "border-transparent bg-status-rejected/10 text-status-rejected hover:bg-status-rejected/20",
        archived:
          "border-transparent bg-status-archived/10 text-status-archived hover:bg-status-archived/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
