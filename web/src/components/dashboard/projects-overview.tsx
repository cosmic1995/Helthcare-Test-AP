'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  TestTube,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

// Mock data - in real app, this would come from API
const projects: Project[] = [
  {
    id: 'proj_medtech_001',
    name: 'CardioMonitor Pro',
    description: 'Class II cardiac monitoring device with AI-powered arrhythmia detection',
    complianceStandards: ['FDA_QMSR', 'ISO_13485', 'IEC_62304'],
    regulatoryClass: 'Class II',
    riskClassification: 'B',
    lifecycleStage: 'development',
    approvalStatus: 'approved',
    complianceScore: 87,
    requirementsCount: 156,
    testsCount: 203,
    teamSize: 8,
    lastActivity: '2 hours ago',
    dueDate: '2024-12-15'
  },
  {
    id: 'proj_dighealth_001',
    name: 'TherapyTracker Mobile',
    description: 'SaMD Class IIa mobile app for therapy compliance tracking',
    complianceStandards: ['FDA_QMSR', 'IEC_62304', 'GDPR'],
    regulatoryClass: 'Class IIa',
    riskClassification: 'B',
    lifecycleStage: 'validation',
    approvalStatus: 'under_review',
    complianceScore: 92,
    requirementsCount: 89,
    testsCount: 127,
    teamSize: 5,
    lastActivity: '1 day ago',
    dueDate: '2024-11-30'
  },
  {
    id: 'proj_biotech_001',
    name: 'GenomeSeq Analyzer',
    description: 'Class I laboratory equipment for genetic sequencing analysis',
    complianceStandards: ['FDA_QMSR', 'ISO_13485', 'ISO_15189'],
    regulatoryClass: 'Class I',
    riskClassification: 'A',
    lifecycleStage: 'planning',
    approvalStatus: 'draft',
    complianceScore: 65,
    requirementsCount: 42,
    testsCount: 18,
    teamSize: 3,
    lastActivity: '3 days ago',
    dueDate: '2025-03-01'
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

export function ProjectsOverview() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Projects</CardTitle>
          <Button size="sm" asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/projects/${project.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {project.name}
                    </Link>
                    <Badge variant="outline" className="text-xs">
                      {project.regulatoryClass}
                    </Badge>
                    {getRiskClassBadge(project.riskClassification)}
                  </div>
                  {getApprovalStatusBadge(project.approvalStatus)}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>{project.requirementsCount} requirements</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TestTube className="h-3 w-3" />
                    <span>{project.testsCount} tests</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{project.teamSize} team members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Compliance:</span>
                  <div className="flex-1 max-w-[200px]">
                    <Progress value={project.complianceScore} className="h-2" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    getComplianceScoreColor(project.complianceScore)
                  )}>
                    {project.complianceScore}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {project.complianceStandards.slice(0, 3).map((standard) => (
                      <Badge key={standard} variant="secondary" className="text-xs">
                        {standard.replace('_', ' ')}
                      </Badge>
                    ))}
                    {project.complianceStandards.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.complianceStandards.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Updated {project.lastActivity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/projects">
              View All Projects
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
