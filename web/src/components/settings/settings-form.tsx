'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Building2,
  Shield,
  Bell,
  Palette,
  Database,
  Link,
  Key,
  Users,
  FileText,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Plus,
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OrganizationSettings {
  name: string
  domain: string
  industry: string
  regulatoryFrameworks: string[]
  complianceOfficer: string
  auditFrequency: string
  dataRetention: string
}

interface SecuritySettings {
  twoFactorRequired: boolean
  sessionTimeout: number
  passwordPolicy: {
    minLength: number
    requireSpecialChars: boolean
    requireNumbers: boolean
    requireUppercase: boolean
  }
  ipWhitelist: string[]
  auditLogging: boolean
  encryptionAtRest: boolean
}

interface NotificationSettings {
  emailNotifications: boolean
  complianceAlerts: boolean
  testFailures: boolean
  requirementChanges: boolean
  teamUpdates: boolean
  weeklyReports: boolean
  monthlyReports: boolean
}

interface IntegrationSettings {
  jira: {
    enabled: boolean
    url: string
    username: string
    apiToken: string
  }
  azureDevOps: {
    enabled: boolean
    organization: string
    project: string
    personalAccessToken: string
  }
  polarion: {
    enabled: boolean
    url: string
    username: string
    password: string
  }
}

export function SettingsForm() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('organization')
  const [isLoading, setIsLoading] = useState(false)

  // Mock current settings - in real app, this would come from API
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    name: 'MedTech Innovations',
    domain: 'medtechinnovations.com',
    industry: 'Medical Devices',
    regulatoryFrameworks: ['FDA QMSR', 'ISO 13485', 'IEC 62304'],
    complianceOfficer: 'Sarah Johnson',
    auditFrequency: 'quarterly',
    dataRetention: '7-years'
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorRequired: true,
    sessionTimeout: 480, // 8 hours in minutes
    passwordPolicy: {
      minLength: 12,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true
    },
    ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
    auditLogging: true,
    encryptionAtRest: true
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    complianceAlerts: true,
    testFailures: true,
    requirementChanges: true,
    teamUpdates: false,
    weeklyReports: true,
    monthlyReports: true
  })

  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    jira: {
      enabled: true,
      url: 'https://medtech.atlassian.net',
      username: 'integration@medtechinnovations.com',
      apiToken: '••••••••••••••••'
    },
    azureDevOps: {
      enabled: false,
      organization: '',
      project: '',
      personalAccessToken: ''
    },
    polarion: {
      enabled: false,
      url: '',
      username: '',
      password: ''
    }
  })

  const handleSave = async (section: string) => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: "Settings saved",
      description: `${section} settings have been updated successfully.`,
    })
    
    setIsLoading(false)
  }

  const availableFrameworks = [
    'FDA QMSR (21 CFR Part 820)',
    'ISO 13485',
    'IEC 62304',
    'ISO 14971',
    'ISO 27001',
    'GDPR',
    '21 CFR Part 11',
    'HIPAA',
    'SOX'
  ]

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organization" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Organization</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Link className="h-4 w-4" />
            <span>Integrations</span>
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Organization Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgSettings.name}
                    onChange={(e) => setOrgSettings({...orgSettings, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-domain">Domain</Label>
                  <Input
                    id="org-domain"
                    value={orgSettings.domain}
                    onChange={(e) => setOrgSettings({...orgSettings, domain: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={orgSettings.industry} onValueChange={(value) => setOrgSettings({...orgSettings, industry: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medical Devices">Medical Devices</SelectItem>
                    <SelectItem value="Pharmaceuticals">Pharmaceuticals</SelectItem>
                    <SelectItem value="Biotechnology">Biotechnology</SelectItem>
                    <SelectItem value="Healthcare Software">Healthcare Software</SelectItem>
                    <SelectItem value="Diagnostics">Diagnostics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Regulatory Frameworks</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {orgSettings.regulatoryFrameworks.map((framework, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{framework}</span>
                      <button
                        onClick={() => {
                          const updated = orgSettings.regulatoryFrameworks.filter((_, i) => i !== index)
                          setOrgSettings({...orgSettings, regulatoryFrameworks: updated})
                        }}
                        className="ml-1 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => {
                  if (!orgSettings.regulatoryFrameworks.includes(value)) {
                    setOrgSettings({...orgSettings, regulatoryFrameworks: [...orgSettings.regulatoryFrameworks, value]})
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add regulatory framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFrameworks.filter(f => !orgSettings.regulatoryFrameworks.includes(f)).map((framework) => (
                      <SelectItem key={framework} value={framework}>{framework}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="compliance-officer">Compliance Officer</Label>
                  <Input
                    id="compliance-officer"
                    value={orgSettings.complianceOfficer}
                    onChange={(e) => setOrgSettings({...orgSettings, complianceOfficer: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audit-frequency">Audit Frequency</Label>
                  <Select value={orgSettings.auditFrequency} onValueChange={(value) => setOrgSettings({...orgSettings, auditFrequency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={() => handleSave('Organization')} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Organization Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Authentication */}
              <div className="space-y-4">
                <h4 className="font-medium">Authentication</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">All users must enable 2FA</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorRequired}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorRequired: checked})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              {/* Password Policy */}
              <div className="space-y-4">
                <h4 className="font-medium">Password Policy</h4>
                <div className="space-y-2">
                  <Label htmlFor="min-length">Minimum Length</Label>
                  <Input
                    id="min-length"
                    type="number"
                    value={securitySettings.passwordPolicy.minLength}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {...securitySettings.passwordPolicy, minLength: parseInt(e.target.value)}
                    })}
                  />
                </div>
                
                <div className="space-y-3">
                  {[
                    { key: 'requireSpecialChars', label: 'Require Special Characters' },
                    { key: 'requireNumbers', label: 'Require Numbers' },
                    { key: 'requireUppercase', label: 'Require Uppercase Letters' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label>{label}</Label>
                      <Switch
                        checked={securitySettings.passwordPolicy[key as keyof typeof securitySettings.passwordPolicy] as boolean}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          passwordPolicy: {...securitySettings.passwordPolicy, [key]: checked}
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Features */}
              <div className="space-y-4">
                <h4 className="font-medium">Security Features</h4>
                {[
                  { key: 'auditLogging', label: 'Audit Logging', description: 'Log all user actions and system events' },
                  { key: 'encryptionAtRest', label: 'Encryption at Rest', description: 'Encrypt all stored data' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label>{label}</Label>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      checked={securitySettings[key as keyof SecuritySettings] as boolean}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, [key]: checked})}
                    />
                  </div>
                ))}
              </div>

              <Button onClick={() => handleSave('Security')} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                { key: 'complianceAlerts', label: 'Compliance Alerts', description: 'Critical compliance issues and deadlines' },
                { key: 'testFailures', label: 'Test Failures', description: 'Failed test executions and validation issues' },
                { key: 'requirementChanges', label: 'Requirement Changes', description: 'Updates to requirements and specifications' },
                { key: 'teamUpdates', label: 'Team Updates', description: 'Team member activities and assignments' },
                { key: 'weeklyReports', label: 'Weekly Reports', description: 'Weekly compliance and progress summaries' },
                { key: 'monthlyReports', label: 'Monthly Reports', description: 'Monthly compliance dashboards and metrics' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={notificationSettings[key as keyof NotificationSettings]}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, [key]: checked})}
                  />
                </div>
              ))}

              <Button onClick={() => handleSave('Notifications')} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Jira Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-5 w-5" />
                  <span>Jira Integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={integrationSettings.jira.enabled}
                    onCheckedChange={(checked) => setIntegrationSettings({
                      ...integrationSettings,
                      jira: {...integrationSettings.jira, enabled: checked}
                    })}
                  />
                  {integrationSettings.jira.enabled && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Connected</span>
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            {integrationSettings.jira.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-url">Jira URL</Label>
                  <Input
                    id="jira-url"
                    value={integrationSettings.jira.url}
                    onChange={(e) => setIntegrationSettings({
                      ...integrationSettings,
                      jira: {...integrationSettings.jira, url: e.target.value}
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jira-username">Username/Email</Label>
                    <Input
                      id="jira-username"
                      value={integrationSettings.jira.username}
                      onChange={(e) => setIntegrationSettings({
                        ...integrationSettings,
                        jira: {...integrationSettings.jira, username: e.target.value}
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jira-token">API Token</Label>
                    <Input
                      id="jira-token"
                      type="password"
                      value={integrationSettings.jira.apiToken}
                      onChange={(e) => setIntegrationSettings({
                        ...integrationSettings,
                        jira: {...integrationSettings.jira, apiToken: e.target.value}
                      })}
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Test Connection
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Azure DevOps Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-5 w-5" />
                  <span>Azure DevOps Integration</span>
                </div>
                <Switch
                  checked={integrationSettings.azureDevOps.enabled}
                  onCheckedChange={(checked) => setIntegrationSettings({
                    ...integrationSettings,
                    azureDevOps: {...integrationSettings.azureDevOps, enabled: checked}
                  })}
                />
              </CardTitle>
            </CardHeader>
            {integrationSettings.azureDevOps.enabled && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ado-org">Organization</Label>
                    <Input
                      id="ado-org"
                      placeholder="your-organization"
                      value={integrationSettings.azureDevOps.organization}
                      onChange={(e) => setIntegrationSettings({
                        ...integrationSettings,
                        azureDevOps: {...integrationSettings.azureDevOps, organization: e.target.value}
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ado-project">Project</Label>
                    <Input
                      id="ado-project"
                      placeholder="your-project"
                      value={integrationSettings.azureDevOps.project}
                      onChange={(e) => setIntegrationSettings({
                        ...integrationSettings,
                        azureDevOps: {...integrationSettings.azureDevOps, project: e.target.value}
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ado-pat">Personal Access Token</Label>
                  <Input
                    id="ado-pat"
                    type="password"
                    value={integrationSettings.azureDevOps.personalAccessToken}
                    onChange={(e) => setIntegrationSettings({
                      ...integrationSettings,
                      azureDevOps: {...integrationSettings.azureDevOps, personalAccessToken: e.target.value}
                    })}
                  />
                </div>
                <Button variant="outline" size="sm">
                  Test Connection
                </Button>
              </CardContent>
            )}
          </Card>

          <Button onClick={() => handleSave('Integrations')} disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Integration Settings
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
