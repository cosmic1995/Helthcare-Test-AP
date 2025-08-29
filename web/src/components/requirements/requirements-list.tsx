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
  FileText,
  TestTube,
  Link as LinkIcon,
  Calendar,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface Requirement {
  id: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  complianceStandard: string
  projectId: string
  projectName: string
  assignee: string
  createdBy: string
  createdAt: string
  updatedAt: string
  dueDate: string
  testCasesCount: number
  traceabilityLinks: number
  riskLevel: string
  approvalStatus: string
  tags: string[]
}

// Mock data for requirements
const requirements: Requirement[] = [
  {
    id: 'req_001',
    title: 'Heart Rate Monitoring Accuracy',
    description: 'The device shall measure heart rate with an accuracy of ±2 BPM for heart rates between 30-300 BPM under normal operating conditions.',
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
    tags: ['accuracy', 'heart-rate', 'measurement']
  },
  {
    id: 'req_002',
    title: 'Arrhythmia Detection Sensitivity',
    description: 'The AI algorithm shall detect atrial fibrillation with a sensitivity of ≥95% and specificity of ≥90% as validated against clinical gold standard.',
    type: 'functional',
    priority: 'critical',
    status: 'under_review',
    complianceStandard: 'FDA_QMSR',
    projectId: 'proj_medtech_001',
    projectName: 'CardioMonitor Pro',
    assignee: 'Dr. Emily Rodriguez',
    createdBy: 'Sarah Johnson',
    createdAt: '2024-08-20T14:15:00Z',
    updatedAt: '2024-08-29T11:45:00Z',
    dueDate: '2024-10-01',
    testCasesCount: 12,
    traceabilityLinks: 5,
    riskLevel: 'high',
    approvalStatus: 'under_review',
    tags: ['ai', 'arrhythmia', 'detection', 'sensitivity']
  },
  {
    id: 'req_003',
    title: 'Data Encryption at Rest',
    description: 'All patient data stored on the device shall be encrypted using AES-256 encryption with FIPS 140-2 Level 3 validated cryptographic modules.',
    type: 'security',
    priority: 'critical',
    status: 'approved',
    complianceStandard: 'ISO_27001',
    projectId: 'proj_medtech_001',
    projectName: 'CardioMonitor Pro',
    assignee: 'Alex Thompson',
    createdBy: 'Anna Mueller',
    createdAt: '2024-07-30T09:20:00Z',
    updatedAt: '2024-08-28T16:10:00Z',
    dueDate: '2024-09-30',
    testCasesCount: 6,
    traceabilityLinks: 4,
    riskLevel: 'high',
    approvalStatus: 'approved',
    tags: ['encryption', 'security', 'data-protection']
  },
  {
    id: 'req_004',
    title: 'User Authentication Multi-Factor',
    description: 'The mobile application shall implement multi-factor authentication with support for biometric (fingerprint/face) and SMS-based verification.',
    type: 'security',
    priority: 'high',
    status: 'draft',
    complianceStandard: 'GDPR',
    projectId: 'proj_dighealth_001',
    projectName: 'TherapyTracker Mobile',
    assignee: 'Lisa Park',
    createdBy: 'David Kim',
    createdAt: '2024-08-25T11:30:00Z',
    updatedAt: '2024-08-29T09:15:00Z',
    dueDate: '2024-11-15',
    testCasesCount: 4,
    traceabilityLinks: 2,
    riskLevel: 'medium',
    approvalStatus: 'draft',
    tags: ['authentication', 'mfa', 'biometric']
  },
  {
    id: 'req_005',
    title: 'Therapy Adherence Tracking',
    description: 'The system shall track patient therapy adherence with 99.5% accuracy and provide real-time notifications for missed doses.',
    type: 'functional',
    priority: 'high',
    status: 'approved',
    complianceStandard: 'FDA_QMSR',
    projectId: 'proj_dighealth_001',
    projectName: 'TherapyTracker Mobile',
    assignee: 'Maria Garcia',
    createdBy: 'Lisa Park',
    createdAt: '2024-08-10T13:45:00Z',
    updatedAt: '2024-08-29T12:20:00Z',
    dueDate: '2024-10-30',
    testCasesCount: 10,
    traceabilityLinks: 6,
    riskLevel: 'medium',
    approvalStatus: 'approved',
    tags: ['adherence', 'tracking', 'notifications']
  },
  {
    id: 'req_006',
    title: 'Audit Trail Immutability',
    description: 'All system actions shall be logged in an immutable audit trail compliant with 21 CFR Part 11 requirements for electronic records.',
    type: 'compliance',
    priority: 'critical',
    status: 'approved',
    complianceStandard: 'CFR_PART_11',
    projectId: 'proj_biotech_001',
    projectName: 'GenomeSeq Analyzer',
    assignee: 'Robert Chen',
    createdBy: 'Dr. Jennifer Liu',
    createdAt: '2024-08-05T08:00:00Z',
    updatedAt: '2024-08-29T10:30:00Z',
    dueDate: '2024-12-01',
    testCasesCount: 5,
    traceabilityLinks: 8,
    riskLevel: 'high',
    approvalStatus: 'approved',
    tags: ['audit', 'immutable', 'cfr-part-11']
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

export function RequirementsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [filteredRequirements, setFilteredRequirements] = useState(requirements)

  const applyFilters = () => {
    let filtered = requirements

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(req => req.priority === priorityFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(req => req.type === typeFilter)
    }

    setFilteredRequirements(filtered)
  }

  // Apply filters whenever any filter changes
  React.useEffect(() => {
    applyFilters()
  }, [searchQuery, statusFilter, priorityFilter, typeFilter])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search requirements..."
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

      {/* Requirements List */}
      <div className="space-y-4">
        {filteredRequirements.map((requirement) => (
          <Card key={requirement.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={`/requirements/${requirement.id}`}
                          className="font-semibold text-lg hover:text-primary transition-colors"
                        >
                          {requirement.title}
                        </Link>
                        {getRiskLevelIcon(requirement.riskLevel)}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(requirement.status)}
                        {getPriorityBadge(requirement.priority)}
                        {getTypeBadge(requirement.type)}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {requirement.description}
                  </p>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>ID: {requirement.id}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TestTube className="h-3 w-3" />
                      <span>{requirement.testCasesCount} tests</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <LinkIcon className="h-3 w-3" />
                      <span>{requirement.traceabilityLinks} links</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{requirement.assignee}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due {new Date(requirement.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {requirement.complianceStandard.replace('_', ' ')}
                      </Badge>
                      <Link 
                        href={`/projects/${requirement.projectId}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {requirement.projectName}
                      </Link>
                    </div>
                    <div className="flex items-center space-x-2">
                      {requirement.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {requirement.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{requirement.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created by {requirement.createdBy} • {formatRelativeTime(requirement.createdAt)}</span>
                    <span>Updated {formatRelativeTime(requirement.updatedAt)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/requirements/${requirement.id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/requirements/${requirement.id}/edit`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline">
                      <TestTube className="h-3 w-3 mr-1" />
                      Generate Tests
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredRequirements.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No requirements found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search criteria or create a new requirement.</p>
        </div>
      )}
    </div>
  )
}
