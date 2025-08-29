'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  Eye,
  Clock,
  User,
  Activity,
  Shield,
  Database,
  Settings,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Calendar,
  MapPin,
  Monitor
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AuditEvent {
  id: string
  timestamp: string
  userId: string
  userName: string
  userEmail: string
  action: string
  resource: string
  resourceId: string
  resourceType: 'project' | 'requirement' | 'test' | 'document' | 'user' | 'system'
  category: 'access' | 'modification' | 'creation' | 'deletion' | 'authentication' | 'configuration'
  severity: 'info' | 'warning' | 'critical'
  details: string
  ipAddress: string
  userAgent: string
  location: string
  sessionId: string
  outcome: 'success' | 'failure' | 'partial'
  complianceRelevant: boolean
  regulatoryFrameworks: string[]
  metadata?: Record<string, any>
}

interface AuditFilter {
  dateRange: string
  userId: string
  action: string
  resourceType: string
  category: string
  severity: string
  complianceOnly: boolean
}

// Mock audit events
const mockAuditEvents: AuditEvent[] = [
  {
    id: 'AUDIT-001',
    timestamp: '2024-01-15T14:30:25Z',
    userId: 'user-001',
    userName: 'Sarah Johnson',
    userEmail: 'sarah.johnson@medtechinnovations.com',
    action: 'Updated requirement status',
    resource: 'REQ-001: Device Safety Shutdown',
    resourceId: 'req-001',
    resourceType: 'requirement',
    category: 'modification',
    severity: 'info',
    details: 'Changed requirement status from "Draft" to "Under Review" and updated acceptance criteria',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    location: 'San Francisco, CA',
    sessionId: 'session-001',
    outcome: 'success',
    complianceRelevant: true,
    regulatoryFrameworks: ['FDA QMSR', 'IEC 62304'],
    metadata: {
      previousStatus: 'Draft',
      newStatus: 'Under Review',
      changedFields: ['status', 'acceptanceCriteria']
    }
  },
  {
    id: 'AUDIT-002',
    timestamp: '2024-01-15T13:45:12Z',
    userId: 'user-002',
    userName: 'Dr. Emily Rodriguez',
    userEmail: 'emily.rodriguez@medtechinnovations.com',
    action: 'Executed test case',
    resource: 'TC-045: Power Supply Validation',
    resourceId: 'tc-045',
    resourceType: 'test',
    category: 'access',
    severity: 'info',
    details: 'Executed automated test case and recorded results: PASSED with 98.5% success rate',
    ipAddress: '10.0.0.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    location: 'Boston, MA',
    sessionId: 'session-002',
    outcome: 'success',
    complianceRelevant: true,
    regulatoryFrameworks: ['ISO 13485', 'IEC 62304'],
    metadata: {
      testResult: 'PASSED',
      successRate: 98.5,
      executionTime: 45,
      automationLevel: 'automated'
    }
  },
  {
    id: 'AUDIT-003',
    timestamp: '2024-01-15T12:20:08Z',
    userId: 'user-003',
    userName: 'Mike Chen',
    userEmail: 'mike.chen@medtechinnovations.com',
    action: 'Failed login attempt',
    resource: 'Authentication System',
    resourceId: 'auth-system',
    resourceType: 'system',
    category: 'authentication',
    severity: 'warning',
    details: 'Multiple failed login attempts detected from unusual location',
    ipAddress: '203.0.113.42',
    userAgent: 'curl/7.68.0',
    location: 'Unknown Location',
    sessionId: '',
    outcome: 'failure',
    complianceRelevant: true,
    regulatoryFrameworks: ['HIPAA', 'SOX'],
    metadata: {
      attemptCount: 5,
      timeWindow: 300,
      riskScore: 85
    }
  },
  {
    id: 'AUDIT-004',
    timestamp: '2024-01-15T11:15:33Z',
    userId: 'user-001',
    userName: 'Sarah Johnson',
    userEmail: 'sarah.johnson@medtechinnovations.com',
    action: 'Created new project',
    resource: 'Insulin Pump System v2.0',
    resourceId: 'proj-004',
    resourceType: 'project',
    category: 'creation',
    severity: 'info',
    details: 'Created new Class II medical device project with FDA QMSR and ISO 13485 compliance requirements',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    location: 'San Francisco, CA',
    sessionId: 'session-001',
    outcome: 'success',
    complianceRelevant: true,
    regulatoryFrameworks: ['FDA QMSR', 'ISO 13485'],
    metadata: {
      projectType: 'Medical Device',
      riskClass: 'Class II',
      complianceStandards: ['FDA QMSR', 'ISO 13485', 'IEC 62304']
    }
  },
  {
    id: 'AUDIT-005',
    timestamp: '2024-01-15T10:30:17Z',
    userId: 'system',
    userName: 'System Administrator',
    userEmail: 'system@medtechinnovations.com',
    action: 'Automated data backup',
    resource: 'Compliance Database',
    resourceId: 'db-compliance',
    resourceType: 'system',
    category: 'configuration',
    severity: 'info',
    details: 'Scheduled backup of compliance database completed successfully with encryption verification',
    ipAddress: '127.0.0.1',
    userAgent: 'System/1.0',
    location: 'Data Center',
    sessionId: 'system-session',
    outcome: 'success',
    complianceRelevant: true,
    regulatoryFrameworks: ['HIPAA', 'GDPR', '21 CFR Part 11'],
    metadata: {
      backupSize: '2.3GB',
      encryptionStatus: 'verified',
      retentionPeriod: '7 years'
    }
  }
]

export function AuditTrail() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<AuditFilter>({
    dateRange: 'last-7-days',
    userId: 'all',
    action: 'all',
    resourceType: 'all',
    category: 'all',
    severity: 'all',
    complianceOnly: false
  })
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('events')

  // Filter audit events
  const filteredEvents = mockAuditEvents.filter(event => {
    const matchesSearch = !searchQuery || 
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.details.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesUser = filters.userId === 'all' || event.userId === filters.userId
    const matchesResourceType = filters.resourceType === 'all' || event.resourceType === filters.resourceType
    const matchesCategory = filters.category === 'all' || event.category === filters.category
    const matchesSeverity = filters.severity === 'all' || event.severity === filters.severity
    const matchesCompliance = !filters.complianceOnly || event.complianceRelevant

    return matchesSearch && matchesUser && matchesResourceType && matchesCategory && matchesSeverity && matchesCompliance
  })

  const exportAuditLog = () => {
    toast({
      title: "Audit log exported",
      description: "Audit trail has been exported to CSV format for compliance reporting.",
    })
  }

  const getActionIcon = (category: string) => {
    switch (category) {
      case 'access': return <Eye className="h-4 w-4" />
      case 'modification': return <Edit className="h-4 w-4" />
      case 'creation': return <Plus className="h-4 w-4" />
      case 'deletion': return <Trash2 className="h-4 w-4" />
      case 'authentication': return <Lock className="h-4 w-4" />
      case 'configuration': return <Settings className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'warning': return 'default'
      case 'info': return 'secondary'
      default: return 'secondary'
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return 'text-green-600'
      case 'failure': return 'text-red-600'
      case 'partial': return 'text-yellow-600'
      default: return 'text-muted-foreground'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const selectedEventData = selectedEvent 
    ? mockAuditEvents.find(event => event.id === selectedEvent)
    : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Audit Trail</span>
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                21 CFR Part 11 Compliant
              </Badge>
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportAuditLog}>
                <Download className="h-4 w-4 mr-2" />
                Export Log
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="events">
                <Activity className="h-4 w-4 mr-2" />
                Audit Events
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <Database className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="compliance">
                <Shield className="h-4 w-4 mr-2" />
                Compliance
              </TabsTrigger>
            </TabsList>

            {/* Audit Events Tab */}
            <TabsContent value="events" className="space-y-4">
              {/* Search and Filters */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search audit events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </Button>
                </div>

                <div className="grid grid-cols-6 gap-4">
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-24-hours">Last 24 Hours</SelectItem>
                      <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="access">Access</SelectItem>
                      <SelectItem value="modification">Modification</SelectItem>
                      <SelectItem value="creation">Creation</SelectItem>
                      <SelectItem value="deletion">Deletion</SelectItem>
                      <SelectItem value="authentication">Authentication</SelectItem>
                      <SelectItem value="configuration">Configuration</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.resourceType} onValueChange={(value) => setFilters({...filters, resourceType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Resource" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      <SelectItem value="project">Projects</SelectItem>
                      <SelectItem value="requirement">Requirements</SelectItem>
                      <SelectItem value="test">Tests</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="user">Users</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.severity} onValueChange={(value) => setFilters({...filters, severity: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="compliance-only"
                      checked={filters.complianceOnly}
                      onChange={(e) => setFilters({...filters, complianceOnly: e.target.checked})}
                    />
                    <label htmlFor="compliance-only" className="text-sm">Compliance Only</label>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredEvents.length} of {mockAuditEvents.length} audit events
                </p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{filteredEvents.filter(e => e.complianceRelevant).length} compliance-relevant</span>
                  <span>{filteredEvents.filter(e => e.outcome === 'failure').length} failures</span>
                </div>
              </div>

              {/* Audit Events List */}
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedEvent === event.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{event.id}</Badge>
                            <Badge variant={getSeverityColor(event.severity) as any}>
                              {event.severity}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">{event.category}</Badge>
                            <Badge variant="outline" className="capitalize">{event.resourceType}</Badge>
                            {event.complianceRelevant && (
                              <Badge variant="default">
                                <Shield className="h-3 w-3 mr-1" />
                                Compliance
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {getActionIcon(event.category)}
                            <span className="font-medium">{event.action}</span>
                            <span className="text-muted-foreground">on</span>
                            <span className="font-medium">{event.resource}</span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{event.details}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{event.userName} ({event.userEmail})</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimestamp(event.timestamp)} ({getTimeAgo(event.timestamp)})</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location} ({event.ipAddress})</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Monitor className="h-3 w-3" />
                                <span className={getOutcomeColor(event.outcome)}>
                                  {event.outcome.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {event.regulatoryFrameworks.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {event.regulatoryFrameworks.map((framework, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {framework}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Expanded Details */}
                      {selectedEvent === event.id && event.metadata && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Additional Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredEvents.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No audit events found</h3>
                    <p className="text-muted-foreground text-center">
                      Try adjusting your search criteria or date range
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="text-center py-8">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Audit analytics and reporting</p>
                <p className="text-sm text-muted-foreground">Usage patterns, trends, and compliance metrics coming soon</p>
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Compliance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {mockAuditEvents.filter(e => e.complianceRelevant).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Compliance Events</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {new Set(mockAuditEvents.flatMap(e => e.regulatoryFrameworks)).size}
                        </div>
                        <p className="text-sm text-muted-foreground">Frameworks Covered</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Regulatory Frameworks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.from(new Set(mockAuditEvents.flatMap(e => e.regulatoryFrameworks))).map((framework) => (
                        <div key={framework} className="flex items-center justify-between">
                          <span className="text-sm">{framework}</span>
                          <Badge variant="outline" className="text-xs">
                            {mockAuditEvents.filter(e => e.regulatoryFrameworks.includes(framework)).length} events
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
