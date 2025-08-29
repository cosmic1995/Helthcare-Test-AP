'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { 
  ArrowLeft,
  Edit,
  TestTube,
  Link as LinkIcon,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  MessageSquare,
  History,
  Download,
  Share
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface RequirementDetailProps {
  requirementId: string
}

// Mock requirement data - in real app, this would come from API
const requirementData = {
  id: 'req_001',
  title: 'Heart Rate Monitoring Accuracy',
  description: 'The device shall measure heart rate with an accuracy of ±2 BPM for heart rates between 30-300 BPM under normal operating conditions. This requirement ensures that the cardiac monitoring device provides clinically acceptable accuracy for patient safety and diagnostic reliability.',
  type: 'functional',
  priority: 'high',
  status: 'approved',
  complianceStandard: 'IEC_62304',
  projectId: 'proj_medtech_001',
  projectName: 'CardioMonitor Pro',
  assignee: 'Sarah Johnson',
  createdBy: 'Mike Chen',
  createdAt: '2024-08-15T10:00:00Z',
  updatedAt: '2024-08-29T14:30:00Z',
  dueDate: '2024-09-15',
  testCasesCount: 8,
  traceabilityLinks: 3,
  riskLevel: 'medium',
  approvalStatus: 'approved',
  tags: ['accuracy', 'heart-rate', 'measurement'],
  rationale: 'Clinical accuracy is critical for patient safety and regulatory approval. The ±2 BPM tolerance aligns with FDA guidance for cardiac monitoring devices.',
  acceptanceCriteria: [
    'Device measures heart rate within ±2 BPM accuracy',
    'Accuracy maintained across 30-300 BPM range',
    'Performance verified under normal operating conditions',
    'Validation against clinical gold standard ECG'
  ],
  verificationMethod: 'Testing against calibrated heart rate simulator and clinical validation',
  validationMethod: 'Clinical study with 100+ patients comparing device readings to ECG',
  regulatoryReferences: [
    'FDA Guidance: Clinical Evaluation of Cardiac Rhythm Management Devices',
    'IEC 60601-2-47: Medical electrical equipment - Particular requirements for ambulatory electrocardiographic systems',
    'ISO 80601-2-61: Medical electrical equipment - Particular requirements for pulse oximeter equipment'
  ]
}

const testCases = [
  {
    id: 'test_001',
    title: 'Heart Rate Accuracy - Normal Range',
    status: 'passed',
    lastExecuted: '2024-08-29T10:00:00Z',
    result: 'PASS - Accuracy within ±1.5 BPM'
  },
  {
    id: 'test_002',
    title: 'Heart Rate Accuracy - Bradycardia Range',
    status: 'passed',
    lastExecuted: '2024-08-29T10:15:00Z',
    result: 'PASS - Accuracy within ±1.8 BPM'
  },
  {
    id: 'test_003',
    title: 'Heart Rate Accuracy - Tachycardia Range',
    status: 'failed',
    lastExecuted: '2024-08-29T10:30:00Z',
    result: 'FAIL - Accuracy ±2.3 BPM (exceeds tolerance)'
  },
  {
    id: 'test_004',
    title: 'Environmental Conditions Test',
    status: 'pending',
    lastExecuted: null,
    result: 'Pending execution'
  }
]

const traceabilityLinks = [
  {
    id: 'link_001',
    type: 'derives_from',
    targetId: 'req_parent_001',
    targetTitle: 'Cardiac Monitoring System Requirements',
    targetType: 'requirement'
  },
  {
    id: 'link_002',
    type: 'implements',
    targetId: 'design_001',
    targetTitle: 'Heart Rate Algorithm Design Specification',
    targetType: 'design'
  },
  {
    id: 'link_003',
    type: 'verified_by',
    targetId: 'test_suite_001',
    targetTitle: 'Heart Rate Accuracy Test Suite',
    targetType: 'test_suite'
  }
]

const activityHistory = [
  {
    id: 1,
    type: 'status_change',
    description: 'Status changed from "Under Review" to "Approved"',
    user: 'Dr. Emily Rodriguez',
    timestamp: '2024-08-29T14:30:00Z'
  },
  {
    id: 2,
    type: 'test_execution',
    description: 'Test case "Heart Rate Accuracy - Tachycardia Range" failed',
    user: 'Sarah Johnson',
    timestamp: '2024-08-29T10:30:00Z'
  },
  {
    id: 3,
    type: 'comment',
    description: 'Added comment regarding clinical validation approach',
    user: 'Mike Chen',
    timestamp: '2024-08-28T16:45:00Z'
  },
  {
    id: 4,
    type: 'edit',
    description: 'Updated acceptance criteria and verification method',
    user: 'Sarah Johnson',
    timestamp: '2024-08-28T14:20:00Z'
  }
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge variant="approved">Approved</Badge>
    case 'under_review':
      return <Badge variant="under-review">Under Review</Badge>
    case 'draft':
      return <Badge variant="draft">Draft</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>
    case 'high':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">High</Badge>
    case 'medium':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>
    case 'low':
      return <Badge variant="outline">Low</Badge>
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'functional':
      return <Badge variant="secondary">Functional</Badge>
    case 'security':
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Security</Badge>
    case 'performance':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Performance</Badge>
    case 'compliance':
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Compliance</Badge>
    case 'usability':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Usability</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function getRiskLevelIcon(riskLevel: string) {
  switch (riskLevel) {
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'medium':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'low':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

function getTestStatusBadge(status: string) {
  switch (status) {
    case 'passed':
      return <Badge variant="approved" className="text-xs">Passed</Badge>
    case 'failed':
      return <Badge variant="destructive" className="text-xs">Failed</Badge>
    case 'pending':
      return <Badge variant="outline" className="text-xs">Pending</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>
  }
}

export function RequirementDetail({ requirementId }: RequirementDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  
  // In real app, fetch requirement data based on requirementId
  const requirement = requirementData

  return (
    <div className="space-y-6">
      <DashboardHeader
        heading={requirement.title}
        text={`${requirement.id} • ${requirement.complianceStandard.replace('_', ' ')}`}
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/requirements">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requirements
            </Link>
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </DashboardHeader>

      {/* Requirement Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {getRiskLevelIcon(requirement.riskLevel)}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getStatusBadge(requirement.status)}
              <p className="text-xs text-muted-foreground">Risk: {requirement.riskLevel}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority & Type</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getPriorityBadge(requirement.priority)}
              {getTypeBadge(requirement.type)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requirement.testCasesCount}</div>
            <p className="text-xs text-muted-foreground">Test cases linked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traceability</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requirement.traceabilityLinks}</div>
            <p className="text-xs text-muted-foreground">Trace links</p>
          </CardContent>
        </Card>
      </div>

      {/* Requirement Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="traceability">Traceability</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{requirement.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rationale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{requirement.rationale}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Acceptance Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requirement.acceptanceCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Verification Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{requirement.verificationMethod}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Validation Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{requirement.validationMethod}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Regulatory References</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {requirement.regulatoryReferences.map((reference, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {reference}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tests" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Linked Test Cases</h3>
                <Button size="sm">
                  <TestTube className="h-4 w-4 mr-2" />
                  Generate Tests
                </Button>
              </div>
              
              {testCases.map((testCase) => (
                <Card key={testCase.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/tests/${testCase.id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {testCase.title}
                          </Link>
                          {getTestStatusBadge(testCase.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{testCase.result}</p>
                        {testCase.lastExecuted && (
                          <p className="text-xs text-muted-foreground">
                            Last executed: {formatRelativeTime(testCase.lastExecuted)}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <TestTube className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="traceability" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Traceability Links</h3>
                <Button size="sm">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
              
              {traceabilityLinks.map((link) => (
                <Card key={link.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {link.type.replace('_', ' ')}
                          </Badge>
                          <Link 
                            href={`/${link.targetType}s/${link.targetId}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {link.targetTitle}
                          </Link>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {link.targetType} • {link.targetId}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <h3 className="text-lg font-semibold">Activity History</h3>
              
              {activityHistory.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <History className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assignee</label>
                <p className="text-sm">{requirement.assignee}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created By</label>
                <p className="text-sm">{requirement.createdBy}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <p className="text-sm">{new Date(requirement.dueDate).toLocaleDateString()}</p>
              </div>
              <Button variant="outline" className="w-full">
                <User className="h-4 w-4 mr-2" />
                Reassign
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project</label>
                <Link 
                  href={`/projects/${requirement.projectId}`}
                  className="text-sm hover:text-primary transition-colors block"
                >
                  {requirement.projectName}
                </Link>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Compliance Standard</label>
                <Badge variant="outline" className="text-xs">
                  {requirement.complianceStandard.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {requirement.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <TestTube className="h-4 w-4 mr-2" />
                Generate Tests
              </Button>
              <Button variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
              <Button variant="outline" className="w-full">
                <LinkIcon className="h-4 w-4 mr-2" />
                Add Trace Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
