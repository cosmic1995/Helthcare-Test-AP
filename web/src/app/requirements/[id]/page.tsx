import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { RequirementDetail } from '@/components/requirements/requirement-detail'

interface RequirementPageProps {
  params: {
    id: string
  }
}

export default async function RequirementPage({ params }: RequirementPageProps) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <RequirementDetail requirementId={params.id} />
    </DashboardShell>
  )
}
