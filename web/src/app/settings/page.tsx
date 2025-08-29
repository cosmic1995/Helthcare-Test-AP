import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { SettingsForm } from '@/components/settings/settings-form'

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

export default async function SettingsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your organization settings, integrations, and compliance configurations."
      />
      <SettingsForm />
    </DashboardShell>
  )
}
