import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { TestsList } from '@/components/tests/tests-list'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Download, Play, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function TestsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          heading="Test Case Management"
          text="Manage test cases, execute tests, track results, and maintain traceability to requirements."
        >
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Run Suite
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/tests/generate">
                <Zap className="h-4 w-4 mr-2" />
                AI Generate
              </Link>
            </Button>
            <Button asChild>
              <Link href="/tests/new">
                <Plus className="h-4 w-4 mr-2" />
                New Test
              </Link>
            </Button>
          </div>
        </DashboardHeader>
        
        <TestsList />
      </div>
    </DashboardShell>
  )
}
