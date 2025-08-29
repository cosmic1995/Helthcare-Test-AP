import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { ComplianceOverview } from '@/components/dashboard/compliance-overview'
import { ProjectsOverview } from '@/components/dashboard/projects-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Healthcare compliance dashboard with project overview and compliance metrics.',
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          heading="Healthcare Compliance Dashboard"
          text="Monitor compliance status, manage projects, and track regulatory requirements."
        />
        
        {/* Compliance Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ComplianceOverview />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Projects Overview - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ProjectsOverview />
          </div>
          
          {/* Sidebar Content */}
          <div className="space-y-6">
            <RecentActivity />
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
