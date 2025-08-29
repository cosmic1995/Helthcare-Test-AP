import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { RequirementsList } from '@/components/requirements/requirements-list'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Download } from 'lucide-react'
import Link from 'next/link'

export default async function RequirementsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          heading="Requirements Management"
          text="Manage regulatory requirements, track compliance, and maintain traceability across your projects."
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
            <Button asChild>
              <Link href="/requirements/new">
                <Plus className="h-4 w-4 mr-2" />
                New Requirement
              </Link>
            </Button>
          </div>
        </DashboardHeader>
        
        <RequirementsList />
      </div>
    </DashboardShell>
  )
}
