'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  FileText, 
  TestTube, 
  CheckCircle, 
  AlertTriangle,
  MessageSquare,
  Upload,
  GitBranch,
  Clock
} from 'lucide-react'
import { formatRelativeTime, getInitials } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'requirement' | 'test' | 'review' | 'comment' | 'upload' | 'sync'
  title: string
  description: string
  user: {
    name: string
    email: string
    image?: string
  }
  project: {
    id: string
    name: string
  }
  timestamp: string
  status?: string
  metadata?: Record<string, any>
}

// Mock data - in real app, this would come from API
const activities: ActivityItem[] = [
  {
    id: 'act_001',
    type: 'requirement',
    title: 'New requirement added',
    description: 'Heart Rate Monitoring Accuracy requirement created',
    user: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@medtechinnovations.com',
      image: '/avatars/sarah.jpg'
    },
    project: {
      id: 'proj_medtech_001',
      name: 'CardioMonitor Pro'
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: 'draft'
  },
  {
    id: 'act_002',
    type: 'test',
    title: 'Test case approved',
    description: 'Atrial Fibrillation Detection Sensitivity test approved',
    user: {
      name: 'Mike Chen',
      email: 'mike.chen@medtechinnovations.com'
    },
    project: {
      id: 'proj_medtech_001',
      name: 'CardioMonitor Pro'
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    status: 'approved'
  },
  {
    id: 'act_003',
    type: 'review',
    title: 'Compliance review completed',
    description: 'ISO 13485 compliance review for TherapyTracker requirements',
    user: {
      name: 'Anna Mueller',
      email: 'anna.mueller@digitalhealthsolutions.eu'
    },
    project: {
      id: 'proj_dighealth_001',
      name: 'TherapyTracker Mobile'
    },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    status: 'completed'
  },
  {
    id: 'act_004',
    type: 'sync',
    title: 'Jira sync completed',
    description: '23 requirements synchronized with Jira project',
    user: {
      name: 'System',
      email: 'system@healthcompliance.com'
    },
    project: {
      id: 'proj_medtech_001',
      name: 'CardioMonitor Pro'
    },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    status: 'success'
  },
  {
    id: 'act_005',
    type: 'upload',
    title: 'Document uploaded',
    description: 'Risk Management Plan v2.1 uploaded for review',
    user: {
      name: 'David Kim',
      email: 'david.kim@biotechresearch.com'
    },
    project: {
      id: 'proj_biotech_001',
      name: 'GenomeSeq Analyzer'
    },
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    status: 'pending_review'
  },
  {
    id: 'act_006',
    type: 'comment',
    title: 'Comment added',
    description: 'Feedback on GDPR compliance implementation',
    user: {
      name: 'Anna Mueller',
      email: 'anna.mueller@digitalhealthsolutions.eu'
    },
    project: {
      id: 'proj_dighealth_001',
      name: 'TherapyTracker Mobile'
    },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'open'
  }
]

function getActivityIcon(type: string) {
  switch (type) {
    case 'requirement':
      return <FileText className="h-4 w-4" />
    case 'test':
      return <TestTube className="h-4 w-4" />
    case 'review':
      return <CheckCircle className="h-4 w-4" />
    case 'comment':
      return <MessageSquare className="h-4 w-4" />
    case 'upload':
      return <Upload className="h-4 w-4" />
    case 'sync':
      return <GitBranch className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
    case 'completed':
    case 'success':
      return <Badge variant="approved" className="text-xs">{status}</Badge>
    case 'pending_review':
    case 'open':
      return <Badge variant="under-review" className="text-xs">{status.replace('_', ' ')}</Badge>
    case 'draft':
      return <Badge variant="draft" className="text-xs">{status}</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  {activity.status && getStatusBadge(activity.status)}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {activity.description}
                </p>
                
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={activity.user.image} alt={activity.user.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(activity.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{activity.user.name}</span>
                  </div>
                  <span>•</span>
                  <Link 
                    href={`/projects/${activity.project.id}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {activity.project.name}
                  </Link>
                  <span>•</span>
                  <span>{formatRelativeTime(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/activity">
              View All Activity
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
