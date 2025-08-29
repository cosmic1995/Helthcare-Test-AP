import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { UserProfile } from '@/components/profile/user-profile'
import { Button } from '@/components/ui/button'
import { Settings, Shield, Bell } from 'lucide-react'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          heading="User Profile"
          text="Manage your account settings, preferences, and security configurations."
        >
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </DashboardHeader>
        
        <UserProfile />
      </div>
    </DashboardShell>
  )
}
