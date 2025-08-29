import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard'
import { Button } from '@/components/ui/button'
import { Download, FileText, BarChart3, Calendar } from 'lucide-react'

export default async function CompliancePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          heading="Compliance Dashboard"
          text="Monitor regulatory compliance status, track audit readiness, and generate compliance reports across all projects."
        >
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Audit Report
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </DashboardHeader>
        
        <ComplianceDashboard />
      </div>
    </DashboardShell>
  )
}
