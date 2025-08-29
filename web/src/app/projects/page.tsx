import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { ProjectsList } from '@/components/projects/projects-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          heading="Projects"
          text="Manage your healthcare compliance projects and track their progress."
        >
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </DashboardHeader>
        
        <ProjectsList />
      </div>
    </DashboardShell>
  )
}
