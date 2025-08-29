'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  FileText, 
  TestTube, 
  Upload,
  GitBranch,
  BarChart3,
  Settings,
  Users
} from 'lucide-react'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'outline' | 'secondary'
}

const quickActions: QuickAction[] = [
  {
    title: 'New Project',
    description: 'Start a new compliance project',
    href: '/projects/new',
    icon: Plus,
    variant: 'default'
  },
  {
    title: 'Add Requirement',
    description: 'Create a new requirement',
    href: '/requirements/new',
    icon: FileText,
    variant: 'outline'
  },
  {
    title: 'Generate Tests',
    description: 'AI-powered test generation',
    href: '/tests/generate',
    icon: TestTube,
    variant: 'outline'
  },
  {
    title: 'Upload Documents',
    description: 'Upload compliance documents',
    href: '/documents/upload',
    icon: Upload,
    variant: 'outline'
  },
  {
    title: 'Sync ALM Tools',
    description: 'Synchronize with Jira/ADO',
    href: '/integrations/sync',
    icon: GitBranch,
    variant: 'outline'
  },
  {
    title: 'Compliance Report',
    description: 'Generate compliance dashboard',
    href: '/reports/compliance',
    icon: BarChart3,
    variant: 'outline'
  },
  {
    title: 'Team Management',
    description: 'Manage team members',
    href: '/team',
    icon: Users,
    variant: 'outline'
  },
  {
    title: 'Settings',
    description: 'Configure organization settings',
    href: '/settings',
    icon: Settings,
    variant: 'outline'
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.href}
              variant={action.variant || 'outline'}
              className="h-auto p-4 flex flex-col items-start space-y-2"
              asChild
            >
              <Link href={action.href}>
                <div className="flex items-center space-x-2 w-full">
                  <action.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-sm">{action.title}</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  {action.description}
                </p>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
