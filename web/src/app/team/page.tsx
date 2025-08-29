import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { TeamList } from '@/components/team/team-list'

// Mock auth check - in real app, this would use your auth system
async function getCurrentUser() {
  // Simulate auth check
  return {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@medtechinnovations.com',
    role: 'Compliance Manager'
  }
}

export default async function TeamPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Team Management"
        text="Manage team members, roles, and permissions for your organization."
      />
      <TeamList />
    </DashboardShell>
  )
}
