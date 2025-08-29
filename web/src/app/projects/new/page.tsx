import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { NewProjectForm } from '@/components/projects/new-project-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewProjectPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          heading="Create New Project"
          text="Set up a new healthcare compliance project with regulatory requirements and team configuration."
        >
          <Button variant="outline" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </DashboardHeader>
        
        <div className="max-w-4xl">
          <NewProjectForm />
        </div>
      </div>
    </DashboardShell>
  )
}
