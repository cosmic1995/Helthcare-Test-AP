'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search,
  Filter,
  TestTube,
  FileText,
  Link as LinkIcon,
  Calendar,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface TestCase {
  id: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  executionStatus: string
  projectId: string
  projectName: string
  requirementId: string
  requirementTitle: string
  assignee: string
  createdBy: string
  createdAt: string
  updatedAt: string
  lastExecuted: string | null
  executionTime: number | null
  automationLevel: string
  testSuite: string
  tags: string[]
  steps: number
  expectedResult: string
  actualResult: string | null
  defects: number
}

// Mock data for test cases
const testCases: TestCase[] = [
  {
    id: 'test_001',
    title: 'Heart Rate Accuracy - Normal Range',
    description: 'Verify heart rate measurement accuracy within normal physiological range (60-100 BPM) using calibrated simulator.',
    type: 'functional',
    priority: 'high',
    status: 'approved',
    executionStatus: 'passed',
    projectId: 'proj_medtech_001',
    projectName: 'CardioMonitor Pro',
    requirementId: 'req_001',
    requirementTitle: 'Heart Rate Monitoring Accuracy',
    assignee: 'Sarah Johnson',
    createdBy: 'Mike Chen',
    createdAt: '2024-08-20T10:00:00Z',
    updatedAt: '2024-08-29T14:30:00Z',
    lastExecuted: '2024-08-29T10:00:00Z',
    executionTime: 45,
    automationLevel: 'manual',
    testSuite: 'Heart Rate Validation',
    tags: ['accuracy', 'heart-rate', 'normal-range'],
    steps: 8,
    expectedResult: 'Heart rate measured within ±2 BPM accuracy',
    actualResult: 'Accuracy within ±1.5 BPM - PASS',
    defects: 0
  },
  {
    id: 'test_002',
    title: 'Arrhythmia Detection - Atrial Fibrillation',
    description: 'Validate AI algorithm sensitivity and specificity for atrial fibrillation detection using clinical test dataset.',
    type: 'functional',
    priority: 'critical',
    status: 'approved',
    executionStatus: 'failed',
    projectId: 'proj_medtech_001',
    projectName: 'CardioMonitor Pro',
    requirementId: 'req_002',
    requirementTitle: 'Arrhythmia Detection Sensitivity',
    assignee: 'Dr. Emily Rodriguez',
    createdBy: 'Sarah Johnson',
    createdAt: '2024-08-22T14:15:00Z',
    updatedAt: '2024-08-29T11:45:00Z',
    lastExecuted: '2024-08-29T09:30:00Z',
    executionTime: 120,
    automationLevel: 'automated',
    testSuite: 'AI Algorithm Validation',
    tags: ['ai', 'arrhythmia', 'atrial-fibrillation'],
    steps: 12,
    expectedResult: 'Sensitivity ≥95%, Specificity ≥90%',
    actualResult: 'Sensitivity 92%, Specificity 88% - FAIL',
    defects: 2
  },
  {
    id: 'test_003',
    title: 'Data Encryption Validation',
    description: 'Verify AES-256 encryption implementation for patient data at rest with FIPS 140-2 compliance.',
    type: 'security',
    priority: 'critical',
    status: 'approved',
    executionStatus: 'passed',
    projectId: 'proj_medtech_001',
    projectName: 'CardioMonitor Pro',
    requirementId: 'req_003',
    requirementTitle: 'Data Encryption at Rest',
    assignee: 'Alex Thompson',
    createdBy: 'Anna Mueller',
    createdAt: '2024-08-18T09:20:00Z',
    updatedAt: '2024-08-28T16:10:00Z',
    lastExecuted: '2024-08-28T14:00:00Z',
    executionTime: 30,
    automationLevel: 'automated',
    testSuite: 'Security Validation',
    tags: ['encryption', 'security', 'fips-140-2'],
    steps: 6,
    expectedResult: 'Data encrypted with AES-256, FIPS validated',
    actualResult: 'Encryption verified, FIPS compliance confirmed - PASS',
    defects: 0
  },
  {
    id: 'test_004',
    title: 'Multi-Factor Authentication Flow',
    description: 'Test complete MFA workflow including biometric and SMS verification with fallback scenarios.',
    type: 'security',
    priority: 'high',
    status: 'draft',
    executionStatus: 'not_executed',
    projectId: 'proj_dighealth_001',
    projectName: 'TherapyTracker Mobile',
    requirementId: 'req_004',
    requirementTitle: 'User Authentication Multi-Factor',
    assignee: 'Lisa Park',
    createdBy: 'David Kim',
    createdAt: '2024-08-25T11:30:00Z',
    updatedAt: '2024-08-29T09:15:00Z',
    lastExecuted: null,
    executionTime: null,
    automationLevel: 'manual',
    testSuite: 'Authentication Tests',
    tags: ['authentication', 'mfa', 'biometric'],
    steps: 15,
    expectedResult: 'Successful authentication with multiple factors',
    actualResult: null,
    defects: 0
  },
  {
    id: 'test_005',
    title: 'Therapy Adherence Tracking Accuracy',
    description: 'Validate therapy adherence tracking accuracy and notification delivery timing.',
    type: 'functional',
    priority: 'high',
    status: 'approved',
    executionStatus: 'passed',
    projectId: 'proj_dighealth_001',
    projectName: 'TherapyTracker Mobile',
    requirementId: 'req_005',
    requirementTitle: 'Therapy Adherence Tracking',
    assignee: 'Maria Garcia',
    createdBy: 'Lisa Park',
    createdAt: '2024-08-15T13:45:00Z',
    updatedAt: '2024-08-29T12:20:00Z',
    lastExecuted: '2024-08-29T08:00:00Z',
    executionTime: 60,
    automationLevel: 'semi-automated',
    testSuite: 'Adherence Tracking',
    tags: ['adherence', 'tracking', 'notifications'],
    steps: 10,
    expectedResult: '99.5% tracking accuracy, real-time notifications',
    actualResult: '99.7% accuracy achieved, notifications within 30s - PASS',
    defects: 0
  },
  {
    id: 'test_006',
    title: 'Audit Trail Immutability Verification',
    description: 'Verify audit trail immutability and 21 CFR Part 11 compliance for all system actions.',
    type: 'compliance',
    priority: 'critical',
    status: 'approved',
    executionStatus: 'in_progress',
    projectId: 'proj_biotech_001',
    projectName: 'GenomeSeq Analyzer',
    requirementId: 'req_006',
    requirementTitle: 'Audit Trail Immutability',
    assignee: 'Robert Chen',
    createdBy: 'Dr. Jennifer Liu',
    createdAt: '2024-08-10T08:00:00Z',
    updatedAt: '2024-08-29T10:30:00Z',
    lastExecuted: '2024-08-29T10:30:00Z',
    executionTime: null,
    automationLevel: 'automated',
    testSuite: 'Compliance Validation',
    tags: ['audit', 'immutable', 'cfr-part-11'],
    steps: 8,
    expectedResult: 'Immutable audit trail, CFR Part 11 compliant',
    actualResult: 'Test in progress...',
    defects: 0
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

function getExecutionStatusBadge(status: string) {
  switch (status) {
    case 'passed':
      return <Badge variant="approved" className="text-xs">Passed</Badge>
    case 'failed':
      return <Badge variant="destructive" className="text-xs">Failed</Badge>
    case 'in_progress':
      return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">In Progress</Badge>
    case 'not_executed':
      return <Badge variant="outline" className="text-xs">Not Executed</Badge>
    case 'blocked':
      return <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">Blocked</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>
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

function getAutomationBadge(level: string) {
  switch (level) {
    case 'automated':
      return <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Automated</Badge>
    case 'semi-automated':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Semi-Auto</Badge>
    case 'manual':
      return <Badge variant="outline" className="text-xs">Manual</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{level}</Badge>
  }
}

function getExecutionIcon(status: string) {
  switch (status) {
    case 'passed':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-500" />
    case 'blocked':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

export function TestsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [executionFilter, setExecutionFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [filteredTests, setFilteredTests] = useState(testCases)

  const applyFilters = () => {
    let filtered = testCases

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(test =>
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter)
    }

    // Execution status filter
    if (executionFilter !== 'all') {
      filtered = filtered.filter(test => test.executionStatus === executionFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(test => test.priority === priorityFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(test => test.type === typeFilter)
    }

    setFilteredTests(filtered)
  }

  // Apply filters whenever any filter changes
  React.useEffect(() => {
    applyFilters()
  }, [searchQuery, statusFilter, executionFilter, priorityFilter, typeFilter])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={executionFilter} onValueChange={setExecutionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Execution Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Executions</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_executed">Not Executed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="functional">Functional</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="usability">Usability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Test Cases List */}
      <div className="space-y-4">
        {filteredTests.map((testCase) => (
          <Card key={testCase.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={`/tests/${testCase.id}`}
                          className="font-semibold text-lg hover:text-primary transition-colors"
                        >
                          {testCase.title}
                        </Link>
                        {getExecutionIcon(testCase.executionStatus)}
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        {getStatusBadge(testCase.status)}
                        {getExecutionStatusBadge(testCase.executionStatus)}
                        {getPriorityBadge(testCase.priority)}
                        {getTypeBadge(testCase.type)}
                        {getAutomationBadge(testCase.automationLevel)}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {testCase.description}
                  </p>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <TestTube className="h-3 w-3" />
                      <span>ID: {testCase.id}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{testCase.steps} steps</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <LinkIcon className="h-3 w-3" />
                      <Link 
                        href={`/requirements/${testCase.requirementId}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {testCase.requirementTitle}
                      </Link>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{testCase.assignee}</span>
                    </div>
                    {testCase.lastExecuted && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Executed {formatRelativeTime(testCase.lastExecuted)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-muted-foreground">Expected Result:</label>
                      <p className="text-foreground">{testCase.expectedResult}</p>
                    </div>
                    {testCase.actualResult && (
                      <div>
                        <label className="font-medium text-muted-foreground">Actual Result:</label>
                        <p className={cn(
                          "text-foreground",
                          testCase.executionStatus === 'passed' && "text-green-700",
                          testCase.executionStatus === 'failed' && "text-red-700"
                        )}>
                          {testCase.actualResult}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {testCase.testSuite}
                      </Badge>
                      <Link 
                        href={`/projects/${testCase.projectId}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {testCase.projectName}
                      </Link>
                      {testCase.defects > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {testCase.defects} defects
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {testCase.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {testCase.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{testCase.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created by {testCase.createdBy} • {formatRelativeTime(testCase.createdAt)}</span>
                    <span>Updated {formatRelativeTime(testCase.updatedAt)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/tests/${testCase.id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/tests/${testCase.id}/edit`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Play className="h-3 w-3 mr-1" />
                      Execute
                    </Button>
                    {testCase.executionStatus === 'failed' && (
                      <Button size="sm" variant="outline">
                        <Zap className="h-3 w-3 mr-1" />
                        Debug
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No test cases found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search criteria or create a new test case.</p>
        </div>
      )}
    </div>
  )
}
