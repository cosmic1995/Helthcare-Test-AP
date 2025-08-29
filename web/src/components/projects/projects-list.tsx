'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  Search,
  Filter,
  Calendar, 
  Users, 
  FileText, 
  TestTube,
  MoreHorizontal,
  Eye,
  Edit,
  Archive
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description: string
  complianceStandards: string[]
  regulatoryClass: string
  riskClassification: string
  lifecycleStage: string
  approvalStatus: string
  complianceScore: number
  requirementsCount: number
  testsCount: number
  teamSize: number
  lastActivity: string
  dueDate: string
  createdAt: string
  updatedAt: string
}

// Extended mock data for projects list
const projects: Project[] = [
  {
    id: 'proj_medtech_001',
    name: 'CardioMonitor Pro',
    description: 'Class II cardiac monitoring device with AI-powered arrhythmia detection and real-time patient monitoring capabilities',
    complianceStandards: ['FDA_QMSR', 'ISO_13485', 'IEC_62304', 'ISO_27001'],
    regulatoryClass: 'Class II',
    riskClassification: 'B',
    lifecycleStage: 'development',
    approvalStatus: 'approved',
    complianceScore: 87,
    requirementsCount: 156,
    testsCount: 203,
    teamSize: 8,
    lastActivity: '2 hours ago',
    dueDate: '2024-12-15',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-08-29T13:24:00Z'
  },
  {
    id: 'proj_dighealth_001',
    name: 'TherapyTracker Mobile',
    description: 'SaMD Class IIa mobile application for therapy compliance tracking with patient engagement features',
    complianceStandards: ['FDA_QMSR', 'IEC_62304', 'GDPR', 'ISO_27001'],
    regulatoryClass: 'Class IIa',
    riskClassification: 'B',
    lifecycleStage: 'validation',
    approvalStatus: 'under_review',
    complianceScore: 92,
    requirementsCount: 89,
    testsCount: 127,
    teamSize: 5,
    lastActivity: '1 day ago',
    dueDate: '2024-11-30',
    createdAt: '2024-02-20T14:30:00Z',
    updatedAt: '2024-08-28T16:45:00Z'
  },
  {
    id: 'proj_biotech_001',
    name: 'GenomeSeq Analyzer',
    description: 'Class I laboratory equipment for genetic sequencing analysis with automated reporting',
    complianceStandards: ['FDA_QMSR', 'ISO_13485', 'ISO_15189', 'CLIA'],
    regulatoryClass: 'Class I',
    riskClassification: 'A',
    lifecycleStage: 'planning',
    approvalStatus: 'draft',
    complianceScore: 65,
    requirementsCount: 42,
    testsCount: 18,
    teamSize: 3,
    lastActivity: '3 days ago',
    dueDate: '2025-03-01',
    createdAt: '2024-07-10T09:15:00Z',
    updatedAt: '2024-08-26T11:20:00Z'
  },
  {
    id: 'proj_aihealth_001',
    name: 'DiagnosticAI Assistant',
    description: 'Class III AI-powered diagnostic assistance software for radiology with deep learning algorithms',
    complianceStandards: ['FDA_QMSR', 'IEC_62304', 'ISO_13485', 'ISO_14155'],
    regulatoryClass: 'Class III',
    riskClassification: 'C',
    lifecycleStage: 'design_controls',
    approvalStatus: 'under_review',
    complianceScore: 78,
    requirementsCount: 234,
    testsCount: 156,
    teamSize: 12,
    lastActivity: '4 hours ago',
    dueDate: '2025-06-30',
    createdAt: '2024-03-05T11:45:00Z',
    updatedAt: '2024-08-29T11:20:00Z'
  },
  {
    id: 'proj_wearable_001',
    name: 'VitalWatch Continuous',
    description: 'Class II wearable device for continuous vital signs monitoring with cloud connectivity',
    complianceStandards: ['FDA_QMSR', 'ISO_13485', 'IEC_62304', 'FCC_Part_15'],
    regulatoryClass: 'Class II',
    riskClassification: 'B',
    lifecycleStage: 'verification',
    approvalStatus: 'approved',
    complianceScore: 94,
    requirementsCount: 178,
    testsCount: 267,
    teamSize: 9,
    lastActivity: '6 hours ago',
    dueDate: '2024-10-15',
    createdAt: '2024-01-30T16:20:00Z',
    updatedAt: '2024-08-29T09:36:00Z'
  },
  {
    id: 'proj_telehealth_001',
    name: 'RemoteCare Platform',
    description: 'Class I telehealth platform for remote patient monitoring and consultation services',
    complianceStandards: ['HIPAA', 'GDPR', 'ISO_27001', 'SOC_2'],
    regulatoryClass: 'Class I',
    riskClassification: 'A',
    lifecycleStage: 'maintenance',
    approvalStatus: 'approved',
    complianceScore: 96,
    requirementsCount: 67,
    testsCount: 89,
    teamSize: 6,
    lastActivity: '2 days ago',
    dueDate: '2024-09-30',
    createdAt: '2023-11-15T08:30:00Z',
    updatedAt: '2024-08-27T14:15:00Z'
  }
]

function getComplianceScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-yellow-600'
  if (score >= 70) return 'text-orange-600'
  return 'text-red-600'
}

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

export function ProjectsList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProjects, setFilteredProjects] = useState(projects)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredProjects(projects)
      return
    }
    
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.description.toLowerCase().includes(query.toLowerCase()) ||
      project.complianceStandards.some(standard => 
        standard.toLowerCase().includes(query.toLowerCase())
      )
    )
    setFilteredProjects(filtered)
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">
                    <Link 
                      href={`/projects/${project.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {project.name}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {project.regulatoryClass}
                    </Badge>
                    {getRiskClassBadge(project.riskClassification)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {project.description}
              </p>
              
              <div className="flex items-center justify-between">
                {getApprovalStatusBadge(project.approvalStatus)}
                {getLifecycleStageBadge(project.lifecycleStage)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Compliance</span>
                  <span className={cn(
                    "font-medium",
                    getComplianceScoreColor(project.complianceScore)
                  )}>
                    {project.complianceScore}%
                  </span>
                </div>
                <Progress value={project.complianceScore} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>{project.requirementsCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TestTube className="h-3 w-3" />
                  <span>{project.testsCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{project.teamSize}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
                <span>•</span>
                <span>Updated {formatRelativeTime(project.updatedAt)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {project.complianceStandards.slice(0, 2).map((standard) => (
                  <Badge key={standard} variant="secondary" className="text-xs">
                    {standard.replace('_', ' ')}
                  </Badge>
                ))}
                {project.complianceStandards.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.complianceStandards.length - 2}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href={`/projects/${project.id}`}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href={`/projects/${project.id}/edit`}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found matching your search.</p>
        </div>
      )}
    </div>
  )
}
