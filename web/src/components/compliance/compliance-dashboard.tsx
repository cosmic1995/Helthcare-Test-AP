'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TestTube,
  Shield,
  Calendar,
  Users,
  Target,
  Award,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComplianceMetric {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  description: string
  target?: string
  status: 'compliant' | 'mostly-compliant' | 'non-compliant' | 'not-assessed'
}

interface ProjectCompliance {
  id: string
  name: string
  overallScore: number
  standards: {
    name: string
    score: number
    status: string
    lastAssessed: string
  }[]
  riskLevel: string
  auditReadiness: number
  gaps: number
  dueDate: string
}

const complianceMetrics: ComplianceMetric[] = [
  {
    title: 'Overall Compliance',
    value: '87%',
    change: '+2.3%',
    changeType: 'positive',
    icon: Award,
    description: 'Organization-wide compliance score',
    target: '≥90%',
    status: 'mostly-compliant'
  },
  {
    title: 'Requirements Coverage',
    value: '94%',
    change: '+5.1%',
    changeType: 'positive',
    icon: FileText,
    description: 'Requirements with approved tests',
    target: '100%',
    status: 'compliant'
  },
  {
    title: 'Test Execution Rate',
    value: '78%',
    change: '-3.2%',
    changeType: 'negative',
    icon: TestTube,
    description: 'Tests executed vs planned',
    target: '≥85%',
    status: 'non-compliant'
  },
  {
    title: 'Audit Readiness',
    value: '82%',
    change: '+1.8%',
    changeType: 'positive',
    icon: Shield,
    description: 'Projects ready for audit',
    target: '≥90%',
    status: 'mostly-compliant'
  },
  {
    title: 'Documentation Quality',
    value: '91%',
    change: '+4.2%',
    changeType: 'positive',
    icon: FileText,
    description: 'Complete and up-to-date docs',
    target: '≥95%',
    status: 'compliant'
  },
  {
    title: 'Risk Mitigation',
    value: '85%',
    change: '0%',
    changeType: 'neutral',
    icon: AlertTriangle,
    description: 'High-risk items addressed',
    target: '≥90%',
    status: 'mostly-compliant'
  }
]

const projectCompliance: ProjectCompliance[] = [
  {
    id: 'proj_medtech_001',
    name: 'CardioMonitor Pro',
    overallScore: 87,
    standards: [
      { name: 'FDA QMSR', score: 89, status: 'compliant', lastAssessed: '2024-08-29' },
      { name: 'ISO 13485', score: 92, status: 'compliant', lastAssessed: '2024-08-28' },
      { name: 'IEC 62304', score: 85, status: 'mostly-compliant', lastAssessed: '2024-08-27' },
      { name: 'ISO 27001', score: 82, status: 'mostly-compliant', lastAssessed: '2024-08-26' }
    ],
    riskLevel: 'medium',
    auditReadiness: 85,
    gaps: 7,
    dueDate: '2024-12-15'
  },
  {
    id: 'proj_dighealth_001',
    name: 'TherapyTracker Mobile',
    overallScore: 92,
    standards: [
      { name: 'FDA QMSR', score: 94, status: 'compliant', lastAssessed: '2024-08-29' },
      { name: 'IEC 62304', score: 91, status: 'compliant', lastAssessed: '2024-08-28' },
      { name: 'GDPR', score: 95, status: 'compliant', lastAssessed: '2024-08-27' },
      { name: 'ISO 27001', score: 88, status: 'mostly-compliant', lastAssessed: '2024-08-26' }
    ],
    riskLevel: 'low',
    auditReadiness: 93,
    gaps: 3,
    dueDate: '2024-11-30'
  },
  {
    id: 'proj_biotech_001',
    name: 'GenomeSeq Analyzer',
    overallScore: 65,
    standards: [
      { name: 'FDA QMSR', score: 68, status: 'non-compliant', lastAssessed: '2024-08-25' },
      { name: 'ISO 13485', score: 72, status: 'non-compliant', lastAssessed: '2024-08-24' },
      { name: 'ISO 15189', score: 58, status: 'non-compliant', lastAssessed: '2024-08-23' },
      { name: 'CLIA', score: 62, status: 'non-compliant', lastAssessed: '2024-08-22' }
    ],
    riskLevel: 'high',
    auditReadiness: 45,
    gaps: 23,
    dueDate: '2025-03-01'
  }
]

const complianceGaps = [
  {
    id: 'gap_001',
    title: 'Missing Risk Analysis Documentation',
    project: 'CardioMonitor Pro',
    standard: 'ISO 14971',
    severity: 'high',
    dueDate: '2024-09-15',
    assignee: 'Dr. Emily Rodriguez',
    status: 'in_progress'
  },
  {
    id: 'gap_002',
    title: 'Incomplete Software Verification Records',
    project: 'TherapyTracker Mobile',
    standard: 'IEC 62304',
    severity: 'medium',
    dueDate: '2024-09-30',
    assignee: 'Lisa Park',
    status: 'open'
  },
  {
    id: 'gap_003',
    title: 'Outdated Quality Manual',
    project: 'GenomeSeq Analyzer',
    standard: 'ISO 13485',
    severity: 'critical',
    dueDate: '2024-09-10',
    assignee: 'Robert Chen',
    status: 'overdue'
  }
]

function getComplianceStatusColor(status: string): string {
  switch (status) {
    case 'compliant':
      return 'text-green-600'
    case 'mostly-compliant':
      return 'text-yellow-600'
    case 'non-compliant':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

function getComplianceStatusBadge(status: string) {
  switch (status) {
    case 'compliant':
      return <Badge variant="compliant">Compliant</Badge>
    case 'mostly-compliant':
      return <Badge variant="mostly-compliant">Mostly Compliant</Badge>
    case 'non-compliant':
      return <Badge variant="non-compliant">Non-Compliant</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>
    case 'high':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">High</Badge>
    case 'medium':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>
    case 'low':
      return <Badge variant="outline">Low</Badge>
    default:
      return <Badge variant="outline">{severity}</Badge>
  }
}

function getGapStatusBadge(status: string) {
  switch (status) {
    case 'resolved':
      return <Badge variant="approved">Resolved</Badge>
    case 'in_progress':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>
    case 'open':
      return <Badge variant="outline">Open</Badge>
    case 'overdue':
      return <Badge variant="destructive">Overdue</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {complianceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                <div className={cn(
                  "flex items-center space-x-1",
                  metric.changeType === 'positive' && "text-green-600",
                  metric.changeType === 'negative' && "text-red-600"
                )}>
                  {metric.changeType === 'positive' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : metric.changeType === 'negative' ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  <span>{metric.change}</span>
                </div>
                <span>from last month</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">{metric.description}</p>
                {getComplianceStatusBadge(metric.status)}
              </div>
              {metric.target && (
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>Target: {metric.target}</span>
                  <Target className="h-3 w-3" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="gaps">Compliance Gaps</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compliant (≥90%)</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '35%' }} />
                      </div>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mostly Compliant (70-89%)</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Non-Compliant (&lt;70%)</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }} />
                      </div>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Standards Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['FDA QMSR', 'ISO 13485', 'IEC 62304', 'ISO 27001', 'GDPR'].map((standard, index) => {
                    const scores = [89, 85, 88, 82, 91]
                    const score = scores[index]
                    return (
                      <div key={standard} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{standard}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={score} className="w-20 h-2" />
                          <span className={cn(
                            "text-sm font-medium w-8",
                            score >= 90 ? "text-green-600" : score >= 80 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {score}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Compliance Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Compliance assessment completed', project: 'CardioMonitor Pro', time: '2 hours ago', status: 'completed' },
                  { action: 'Gap analysis updated', project: 'TherapyTracker Mobile', time: '4 hours ago', status: 'updated' },
                  { action: 'Audit preparation started', project: 'GenomeSeq Analyzer', time: '1 day ago', status: 'started' },
                  { action: 'Documentation review completed', project: 'CardioMonitor Pro', time: '2 days ago', status: 'completed' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 pb-3 border-b last:border-b-0">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{activity.project}</span>
                        <span>•</span>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4">
            {projectCompliance.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={project.riskLevel === 'high' ? 'destructive' : project.riskLevel === 'medium' ? 'secondary' : 'outline'}>
                        Risk: {project.riskLevel}
                      </Badge>
                      <span className={cn(
                        "text-lg font-bold",
                        getComplianceStatusColor(
                          project.overallScore >= 90 ? 'compliant' : 
                          project.overallScore >= 80 ? 'mostly-compliant' : 'non-compliant'
                        )
                      )}>
                        {project.overallScore}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-3">Standards Compliance</h4>
                      <div className="space-y-2">
                        {project.standards.map((standard) => (
                          <div key={standard.name} className="flex items-center justify-between">
                            <span className="text-sm">{standard.name}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={standard.score} className="w-16 h-2" />
                              <span className={cn(
                                "text-xs font-medium w-8",
                                getComplianceStatusColor(standard.status)
                              )}>
                                {standard.score}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Audit Readiness</span>
                        <span className="font-medium">{project.auditReadiness}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Open Gaps</span>
                        <Badge variant={project.gaps > 10 ? 'destructive' : project.gaps > 5 ? 'secondary' : 'outline'}>
                          {project.gaps}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Due Date</span>
                        <span className="text-sm">{new Date(project.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="gaps" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Compliance Gaps</h3>
            <Button size="sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Generate Gap Analysis
            </Button>
          </div>
          
          <div className="space-y-4">
            {complianceGaps.map((gap) => (
              <Card key={gap.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{gap.title}</h4>
                        {getSeverityBadge(gap.severity)}
                        {getGapStatusBadge(gap.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{gap.project}</span>
                        <span>•</span>
                        <span>{gap.standard}</span>
                        <span>•</span>
                        <span>Due: {new Date(gap.dueDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Assigned: {gap.assignee}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Compliance Trends Coming Soon</p>
                <p className="text-sm text-muted-foreground">Historical compliance data and trend analysis will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
