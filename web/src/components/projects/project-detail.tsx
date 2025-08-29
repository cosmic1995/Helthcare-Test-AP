'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { 
  ArrowLeft,
  Edit,
  Settings,
  Users,
  FileText,
  TestTube,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  GitBranch,
  Download,
  Upload
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface ProjectDetailProps {
  projectId: string
}

// Mock project data - in real app, this would come from API
const projectData = {
  id: 'proj_medtech_001',
  name: 'CardioMonitor Pro',
  description: 'Class II cardiac monitoring device with AI-powered arrhythmia detection and real-time patient monitoring capabilities. This device integrates advanced machine learning algorithms to provide accurate and timely detection of cardiac anomalies.',
  complianceStandards: ['FDA_QMSR', 'ISO_13485', 'IEC_62304', 'ISO_27001'],
  regulatoryClass: 'Class II',
  riskClassification: 'B',
  lifecycleStage: 'development',
  approvalStatus: 'approved',
  complianceScore: 87,
  requirementsCount: 156,
  testsCount: 203,
  passedTests: 178,
  failedTests: 12,
  pendingTests: 13,
  teamSize: 8,
  lastActivity: '2 hours ago',
  dueDate: '2024-12-15',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-08-29T13:24:00Z',
  organization: 'MedTech Innovations Inc.',
  projectManager: 'Sarah Johnson',
  qualityManager: 'Mike Chen',
  regulatoryContact: 'Dr. Emily Rodriguez',
  almIntegrations: [
    { type: 'jira', status: 'connected', lastSync: '2024-08-29T12:00:00Z' },
    { type: 'azure_devops', status: 'connected', lastSync: '2024-08-29T11:30:00Z' }
  ]
}

const complianceMetrics = [
  {
    title: 'Requirements Coverage',
    value: 94,
    description: 'Requirements with approved tests',
    icon: FileText,
    color: 'text-green-600'
  },
  {
    title: 'Test Execution',
    value: 87,
    description: 'Tests passed successfully',
    icon: TestTube,
    color: 'text-yellow-600'
  },
  {
    title: 'Documentation',
    value: 92,
    description: 'Required documents completed',
    icon: FileText,
    color: 'text-green-600'
  },
  {
    title: 'Risk Management',
    value: 89,
    description: 'Risk controls implemented',
    icon: AlertTriangle,
    color: 'text-yellow-600'
  }
]

const recentActivity = [
  {
    id: 1,
    type: 'requirement',
    title: 'Heart Rate Monitoring Accuracy requirement updated',
    user: 'Sarah Johnson',
    timestamp: '2024-08-29T13:00:00Z',
    status: 'completed'
  },
  {
    id: 2,
    type: 'test',
    title: 'Arrhythmia Detection Sensitivity test executed',
    user: 'Mike Chen',
    timestamp: '2024-08-29T12:30:00Z',
    status: 'passed'
  },
  {
    id: 3,
    type: 'sync',
    title: 'Jira synchronization completed',
    user: 'System',
    timestamp: '2024-08-29T12:00:00Z',
    status: 'success'
  }
]

function getApprovalStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge variant="approved">Approved</Badge>
    case 'under_review':
      return <Badge variant="under-review">Under Review</Badge>
    case 'draft':
      return <Badge variant="draft">Draft</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getRiskClassBadge(riskClass: string) {
  switch (riskClass.toLowerCase()) {
    case 'a':
      return <Badge variant="risk-a">Risk A</Badge>
    case 'b':
      return <Badge variant="risk-b">Risk B</Badge>
    case 'c':
      return <Badge variant="risk-c">Risk C</Badge>
    case 'd':
      return <Badge variant="risk-d">Risk D</Badge>
    default:
      return <Badge variant="outline">{riskClass}</Badge>
  }
}

function getLifecycleStageBadge(stage: string) {
  const stageMap: { [key: string]: string } = {
    'planning': 'Planning',
    'design_controls': 'Design Controls',
    'development': 'Development',
    'verification': 'Verification',
    'validation': 'Validation',
    'maintenance': 'Maintenance'
  }
  
  return <Badge variant="secondary">{stageMap[stage] || stage}</Badge>
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  
  // In real app, fetch project data based on projectId
  const project = projectData

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading={project.name}
        text={project.description}
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Project
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </DashboardHeader>

      {/* Project Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.complianceScore}%</div>
            <Progress value={project.complianceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requirements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.requirementsCount}</div>
            <p className="text-xs text-muted-foreground">Total requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.testsCount}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="text-green-600">{project.passedTests} passed</span>
              <span className="text-red-600">{project.failedTests} failed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.teamSize}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Regulatory Class</label>
                      <div className="mt-1">
                        <Badge variant="outline">{project.regulatoryClass}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Risk Classification</label>
                      <div className="mt-1">
                        {getRiskClassBadge(project.riskClassification)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lifecycle Stage</label>
                      <div className="mt-1">
                        {getLifecycleStageBadge(project.lifecycleStage)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Approval Status</label>
                      <div className="mt-1">
                        {getApprovalStatusBadge(project.approvalStatus)}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Compliance Standards</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.complianceStandards.map((standard) => (
                        <Badge key={standard} variant="secondary">
                          {standard.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                      <p className="mt-1 text-sm">{new Date(project.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="mt-1 text-sm">{formatRelativeTime(project.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {complianceMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <metric.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{metric.title}</p>
                            <span className={cn("text-sm font-bold", metric.color)}>
                              {metric.value}%
                            </span>
                          </div>
                          <Progress value={metric.value} className="mt-1 h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="requirements">
              <Card>
                <CardHeader>
                  <CardTitle>Requirements Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Requirements management interface coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tests">
              <Card>
                <CardHeader>
                  <CardTitle>Test Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Test management interface coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="compliance">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Compliance dashboard coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project Manager</label>
                <p className="text-sm">{project.projectManager}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quality Manager</label>
                <p className="text-sm">{project.qualityManager}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Regulatory Contact</label>
                <p className="text-sm">{project.regulatoryContact}</p>
              </div>
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Manage Team
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ALM Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.almIntegrations.map((integration, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{integration.type.replace('_', ' ')}</span>
                  </div>
                  <Badge variant={integration.status === 'connected' ? 'approved' : 'outline'}>
                    {integration.status}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="text-sm">
                  <p className="font-medium">{activity.title}</p>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{activity.user}</span>
                    <span>{formatRelativeTime(activity.timestamp)}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <Button variant="outline" className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
