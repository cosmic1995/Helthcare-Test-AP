'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Lock,
  Key,
  Users,
  Activity,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Wifi,
  Database,
  FileText,
  Download,
  RefreshCw,
  Bell,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SecurityAlert {
  id: string
  type: 'authentication' | 'access' | 'data' | 'system' | 'compliance'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  timestamp: string
  source: string
  status: 'active' | 'investigating' | 'resolved'
  affectedUsers?: string[]
  location?: string
  deviceInfo?: string
}

interface SecurityMetric {
  name: string
  value: number
  maxValue: number
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  description: string
}

interface UserSession {
  id: string
  userId: string
  userName: string
  email: string
  loginTime: string
  lastActivity: string
  location: string
  device: string
  ipAddress: string
  status: 'active' | 'idle' | 'expired'
  riskScore: number
}

interface AccessAttempt {
  id: string
  type: 'login' | 'failed_login' | 'logout' | 'password_reset' | 'mfa_challenge'
  userId?: string
  email: string
  timestamp: string
  location: string
  device: string
  ipAddress: string
  success: boolean
  riskScore: number
  details?: string
}

// Mock data
const mockSecurityAlerts: SecurityAlert[] = [
  {
    id: 'ALERT-001',
    type: 'authentication',
    severity: 'high',
    title: 'Multiple Failed Login Attempts',
    description: 'User account sarah.johnson@medtechinnovations.com has 5 failed login attempts in the last 10 minutes from IP 192.168.1.100',
    timestamp: '2024-01-15T14:30:00Z',
    source: 'Authentication Service',
    status: 'active',
    affectedUsers: ['sarah.johnson@medtechinnovations.com'],
    location: 'San Francisco, CA',
    deviceInfo: 'Chrome on Windows 11'
  },
  {
    id: 'ALERT-002',
    type: 'access',
    severity: 'medium',
    title: 'Unusual Access Pattern',
    description: 'User mike.chen@medtechinnovations.com accessed sensitive compliance documents outside normal business hours',
    timestamp: '2024-01-15T02:15:00Z',
    source: 'Access Control',
    status: 'investigating',
    affectedUsers: ['mike.chen@medtechinnovations.com'],
    location: 'Austin, TX',
    deviceInfo: 'Safari on macOS'
  },
  {
    id: 'ALERT-003',
    type: 'compliance',
    severity: 'critical',
    title: 'Data Retention Policy Violation',
    description: 'System detected patient data older than 7 years that should have been automatically purged according to HIPAA requirements',
    timestamp: '2024-01-14T16:45:00Z',
    source: 'Compliance Monitor',
    status: 'active',
    location: 'Data Center',
    deviceInfo: 'Automated System'
  }
]

const mockSecurityMetrics: SecurityMetric[] = [
  {
    name: 'Authentication Success Rate',
    value: 98.5,
    maxValue: 100,
    status: 'good',
    trend: 'stable',
    description: 'Percentage of successful authentication attempts'
  },
  {
    name: 'MFA Adoption',
    value: 87,
    maxValue: 100,
    status: 'warning',
    trend: 'up',
    description: 'Percentage of users with multi-factor authentication enabled'
  },
  {
    name: 'Session Security Score',
    value: 92,
    maxValue: 100,
    status: 'good',
    trend: 'stable',
    description: 'Overall security score of active user sessions'
  },
  {
    name: 'Data Encryption Coverage',
    value: 100,
    maxValue: 100,
    status: 'good',
    trend: 'stable',
    description: 'Percentage of sensitive data encrypted at rest and in transit'
  },
  {
    name: 'Vulnerability Score',
    value: 15,
    maxValue: 100,
    status: 'good',
    trend: 'down',
    description: 'Lower scores indicate fewer security vulnerabilities'
  },
  {
    name: 'Compliance Score',
    value: 94,
    maxValue: 100,
    status: 'good',
    trend: 'up',
    description: 'Overall compliance with security policies and regulations'
  }
]

const mockUserSessions: UserSession[] = [
  {
    id: 'SESSION-001',
    userId: 'user-001',
    userName: 'Sarah Johnson',
    email: 'sarah.johnson@medtechinnovations.com',
    loginTime: '2024-01-15T08:30:00Z',
    lastActivity: '2024-01-15T14:25:00Z',
    location: 'San Francisco, CA',
    device: 'Chrome on Windows 11',
    ipAddress: '192.168.1.100',
    status: 'active',
    riskScore: 25
  },
  {
    id: 'SESSION-002',
    userId: 'user-002',
    userName: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@medtechinnovations.com',
    loginTime: '2024-01-15T09:15:00Z',
    lastActivity: '2024-01-15T14:20:00Z',
    location: 'Boston, MA',
    device: 'Safari on macOS',
    ipAddress: '10.0.0.45',
    status: 'active',
    riskScore: 15
  },
  {
    id: 'SESSION-003',
    userId: 'user-003',
    userName: 'Mike Chen',
    email: 'mike.chen@medtechinnovations.com',
    loginTime: '2024-01-15T02:10:00Z',
    lastActivity: '2024-01-15T02:30:00Z',
    location: 'Austin, TX',
    device: 'Mobile Safari on iOS',
    ipAddress: '172.16.0.23',
    status: 'idle',
    riskScore: 65
  }
]

const mockAccessAttempts: AccessAttempt[] = [
  {
    id: 'ACCESS-001',
    type: 'login',
    userId: 'user-001',
    email: 'sarah.johnson@medtechinnovations.com',
    timestamp: '2024-01-15T08:30:00Z',
    location: 'San Francisco, CA',
    device: 'Chrome on Windows 11',
    ipAddress: '192.168.1.100',
    success: true,
    riskScore: 20
  },
  {
    id: 'ACCESS-002',
    type: 'failed_login',
    email: 'unknown@suspicious.com',
    timestamp: '2024-01-15T14:25:00Z',
    location: 'Unknown',
    device: 'Automated Script',
    ipAddress: '203.0.113.42',
    success: false,
    riskScore: 95,
    details: 'Brute force attempt detected'
  },
  {
    id: 'ACCESS-003',
    type: 'mfa_challenge',
    userId: 'user-002',
    email: 'emily.rodriguez@medtechinnovations.com',
    timestamp: '2024-01-15T09:15:00Z',
    location: 'Boston, MA',
    device: 'Safari on macOS',
    ipAddress: '10.0.0.45',
    success: true,
    riskScore: 10
  }
]

export function SecurityMonitor() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)

  const refreshSecurityData = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast({
      title: "Security data refreshed",
      description: "Latest security metrics and alerts have been updated.",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-green-600'
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Security Monitoring Dashboard</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={refreshSecurityData} disabled={isRefreshing}>
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">
                <Activity className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <Users className="h-4 w-4 mr-2" />
                Sessions
              </TabsTrigger>
              <TabsTrigger value="access">
                <Key className="h-4 w-4 mr-2" />
                Access Log
              </TabsTrigger>
              <TabsTrigger value="compliance">
                <FileText className="h-4 w-4 mr-2" />
                Compliance
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {mockSecurityMetrics.map((metric) => (
                  <Card key={metric.name}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{metric.name}</h4>
                        <Badge variant={metric.status === 'good' ? 'default' : metric.status === 'warning' ? 'secondary' : 'destructive'}>
                          {metric.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">
                          {metric.value}
                          {metric.name.includes('Rate') || metric.name.includes('Coverage') || metric.name.includes('Adoption') || metric.name.includes('Score') ? '%' : ''}
                        </div>
                        <Progress 
                          value={metric.name === 'Vulnerability Score' ? 100 - metric.value : metric.value} 
                          className="h-2" 
                        />
                        <p className="text-xs text-muted-foreground">{metric.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Security Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockSecurityAlerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded">
                          <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'high' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{alert.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(alert.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Active User Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockUserSessions.filter(s => s.status === 'active').map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{session.userName}</p>
                              <p className="text-xs text-muted-foreground">{session.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={session.riskScore > 50 ? 'destructive' : 'secondary'} className="text-xs">
                              Risk: {session.riskScore}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getTimeAgo(session.lastActivity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Security Alerts</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4 mr-2" />
                    Configure Alerts
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Alert Rules
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {mockSecurityAlerts.map((alert) => (
                  <Card key={alert.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{alert.id}</Badge>
                            <Badge variant={getSeverityColor(alert.severity) as any}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">{alert.type}</Badge>
                            <Badge variant={alert.status === 'active' ? 'destructive' : alert.status === 'investigating' ? 'default' : 'secondary'}>
                              {alert.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(alert.timestamp)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Database className="h-3 w-3" />
                              <span>{alert.source}</span>
                            </div>
                            {alert.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{alert.location}</span>
                              </div>
                            )}
                            {alert.deviceInfo && (
                              <div className="flex items-center space-x-1">
                                <Monitor className="h-3 w-3" />
                                <span>{alert.deviceInfo}</span>
                              </div>
                            )}
                          </div>
                          {alert.affectedUsers && (
                            <div>
                              <p className="text-xs font-medium mb-1">Affected Users:</p>
                              <div className="flex flex-wrap gap-1">
                                {alert.affectedUsers.map((user, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {user}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Investigate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Active User Sessions</h3>
                <div className="text-sm text-muted-foreground">
                  {mockUserSessions.filter(s => s.status === 'active').length} active sessions
                </div>
              </div>

              <div className="space-y-4">
                {mockUserSessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium">{session.userName}</h4>
                              <p className="text-sm text-muted-foreground">{session.email}</p>
                            </div>
                            <Badge variant={session.status === 'active' ? 'default' : session.status === 'idle' ? 'secondary' : 'destructive'}>
                              {session.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Login: {formatTimestamp(session.loginTime)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <span>Last Activity: {getTimeAgo(session.lastActivity)}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{session.location}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                <span>{session.device}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Wifi className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{session.ipAddress}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">Risk Score:</span>
                              <Badge variant={session.riskScore > 50 ? 'destructive' : session.riskScore > 30 ? 'default' : 'secondary'}>
                                {session.riskScore}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {session.status === 'active' && (
                            <Button variant="destructive" size="sm">
                              <Lock className="h-4 w-4 mr-2" />
                              Terminate
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Access Log Tab */}
            <TabsContent value="access" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Access Attempts Log</h3>
                <div className="text-sm text-muted-foreground">
                  Last 24 hours
                </div>
              </div>

              <div className="space-y-3">
                {mockAccessAttempts.map((attempt) => (
                  <Card key={attempt.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            attempt.success ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {attempt.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="capitalize">{attempt.type.replace('_', ' ')}</Badge>
                              <span className="text-sm font-medium">{attempt.email}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              <span>{formatTimestamp(attempt.timestamp)}</span>
                              <span>{attempt.location}</span>
                              <span>{attempt.device}</span>
                              <span>{attempt.ipAddress}</span>
                            </div>
                            {attempt.details && (
                              <p className="text-xs text-muted-foreground mt-1">{attempt.details}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={attempt.riskScore > 70 ? 'destructive' : attempt.riskScore > 40 ? 'default' : 'secondary'}>
                          Risk: {attempt.riskScore}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Security compliance monitoring</p>
                <p className="text-sm text-muted-foreground">HIPAA, SOX, and regulatory compliance tracking coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
