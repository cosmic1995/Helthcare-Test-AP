'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loading } from '@/components/ui/loading'
import { 
  Shield, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  FileText,
  Target,
  Zap,
  Download,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Clock,
  Users,
  BookOpen
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ComplianceGap {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  framework: string
  category: string
  affectedAreas: string[]
  recommendation: string
  estimatedEffort: number
  priority: number
  status: 'open' | 'in-progress' | 'resolved'
  assignee?: string
  dueDate?: string
  confidence: number
}

interface ComplianceScore {
  framework: string
  overallScore: number
  categories: {
    name: string
    score: number
    maxScore: number
    gaps: number
  }[]
  trend: 'improving' | 'declining' | 'stable'
  lastAssessment: string
}

interface AIRecommendation {
  id: string
  type: 'process' | 'documentation' | 'training' | 'technology'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  frameworks: string[]
  expectedBenefit: string
  confidence: number
}

// Mock data
const mockComplianceScores: ComplianceScore[] = [
  {
    framework: 'FDA QMSR',
    overallScore: 87,
    categories: [
      { name: 'Design Controls', score: 92, maxScore: 100, gaps: 2 },
      { name: 'Risk Management', score: 85, maxScore: 100, gaps: 3 },
      { name: 'Document Control', score: 90, maxScore: 100, gaps: 1 },
      { name: 'Corrective Actions', score: 78, maxScore: 100, gaps: 4 }
    ],
    trend: 'improving',
    lastAssessment: '2024-01-15'
  },
  {
    framework: 'ISO 13485',
    overallScore: 91,
    categories: [
      { name: 'Quality Management', score: 95, maxScore: 100, gaps: 1 },
      { name: 'Management Responsibility', score: 88, maxScore: 100, gaps: 2 },
      { name: 'Resource Management', score: 90, maxScore: 100, gaps: 2 },
      { name: 'Product Realization', score: 92, maxScore: 100, gaps: 1 }
    ],
    trend: 'stable',
    lastAssessment: '2024-01-14'
  },
  {
    framework: 'IEC 62304',
    overallScore: 83,
    categories: [
      { name: 'Software Lifecycle', score: 88, maxScore: 100, gaps: 2 },
      { name: 'Risk Management', score: 80, maxScore: 100, gaps: 3 },
      { name: 'Configuration Management', score: 85, maxScore: 100, gaps: 2 },
      { name: 'Problem Resolution', score: 79, maxScore: 100, gaps: 4 }
    ],
    trend: 'improving',
    lastAssessment: '2024-01-13'
  }
]

const mockComplianceGaps: ComplianceGap[] = [
  {
    id: 'GAP-001',
    title: 'Incomplete Risk Management Documentation',
    description: 'Risk management file lacks comprehensive analysis for software-related risks according to ISO 14971 requirements.',
    severity: 'critical',
    framework: 'ISO 14971',
    category: 'Risk Management',
    affectedAreas: ['Software Development', 'Product Design', 'Quality Assurance'],
    recommendation: 'Conduct comprehensive software risk analysis and update risk management file with detailed risk control measures.',
    estimatedEffort: 40,
    priority: 1,
    status: 'open',
    assignee: 'Dr. Emily Rodriguez',
    dueDate: '2024-02-15',
    confidence: 92
  },
  {
    id: 'GAP-002',
    title: 'Missing Cybersecurity Controls',
    description: 'Device lacks adequate cybersecurity controls as required by FDA premarket cybersecurity guidance.',
    severity: 'high',
    framework: 'FDA QMSR',
    category: 'Cybersecurity',
    affectedAreas: ['Software Development', 'Network Security', 'Data Protection'],
    recommendation: 'Implement comprehensive cybersecurity framework including threat modeling, secure coding practices, and vulnerability management.',
    estimatedEffort: 60,
    priority: 2,
    status: 'in-progress',
    assignee: 'Mike Chen',
    dueDate: '2024-03-01',
    confidence: 88
  },
  {
    id: 'GAP-003',
    title: 'Insufficient User Training Documentation',
    description: 'User training materials do not meet ISO 13485 requirements for competency assessment and training records.',
    severity: 'medium',
    framework: 'ISO 13485',
    category: 'Training',
    affectedAreas: ['Training', 'Documentation', 'Quality Management'],
    recommendation: 'Develop comprehensive training program with competency assessments and maintain detailed training records.',
    estimatedEffort: 25,
    priority: 3,
    status: 'open',
    confidence: 85
  }
]

const mockAIRecommendations: AIRecommendation[] = [
  {
    id: 'REC-001',
    type: 'process',
    title: 'Implement Automated Compliance Monitoring',
    description: 'Deploy AI-powered continuous compliance monitoring to identify gaps in real-time and prevent regulatory issues.',
    impact: 'high',
    effort: 'medium',
    frameworks: ['FDA QMSR', 'ISO 13485', 'IEC 62304'],
    expectedBenefit: 'Reduce compliance gaps by 40% and improve audit readiness',
    confidence: 94
  },
  {
    id: 'REC-002',
    type: 'documentation',
    title: 'Standardize Risk Assessment Templates',
    description: 'Create standardized, AI-assisted risk assessment templates to ensure consistent risk analysis across all projects.',
    impact: 'high',
    effort: 'low',
    frameworks: ['ISO 14971', 'IEC 62304'],
    expectedBenefit: 'Improve risk assessment quality and reduce review time by 30%',
    confidence: 91
  },
  {
    id: 'REC-003',
    type: 'training',
    title: 'AI-Powered Compliance Training',
    description: 'Implement personalized, AI-driven compliance training program that adapts to individual learning needs and regulatory updates.',
    impact: 'medium',
    effort: 'medium',
    frameworks: ['FDA QMSR', 'ISO 13485'],
    expectedBenefit: 'Increase training effectiveness by 50% and ensure up-to-date compliance knowledge',
    confidence: 87
  }
]

export function AIComplianceAnalyzer() {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [selectedFramework, setSelectedFramework] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')

  const runComplianceAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate AI analysis with progress updates
    const progressSteps = [
      { progress: 20, message: 'Scanning documentation...' },
      { progress: 40, message: 'Analyzing regulatory requirements...' },
      { progress: 60, message: 'Identifying compliance gaps...' },
      { progress: 80, message: 'Generating recommendations...' },
      { progress: 100, message: 'Analysis complete' }
    ]

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setAnalysisProgress(step.progress)
    }

    setIsAnalyzing(false)
    toast({
      title: "Compliance analysis complete",
      description: "AI has identified 12 compliance gaps and generated 8 recommendations.",
    })
  }

  const filteredGaps = mockComplianceGaps.filter(gap => {
    const matchesFramework = selectedFramework === 'all' || gap.framework === selectedFramework
    const matchesSeverity = selectedSeverity === 'all' || gap.severity === selectedSeverity
    return matchesFramework && matchesSeverity
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      case 'stable': return <BarChart3 className="h-4 w-4 text-blue-600" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>AI Compliance Analyzer</span>
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Multi-Framework
              </Badge>
            </div>
            <Button onClick={runComplianceAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>AI Compliance Analysis</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="gaps">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Gaps
              </TabsTrigger>
              <TabsTrigger value="recommendations">
                <Target className="h-4 w-4 mr-2" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="trends">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {mockComplianceScores.map((score) => (
                  <Card key={score.framework}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{score.framework}</CardTitle>
                        {getTrendIcon(score.trend)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{score.overallScore}%</div>
                        <p className="text-sm text-muted-foreground">Overall Score</p>
                      </div>
                      
                      <div className="space-y-2">
                        {score.categories.map((category) => (
                          <div key={category.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{category.name}</span>
                              <span>{category.score}%</span>
                            </div>
                            <Progress value={category.score} className="h-1" />
                            {category.gaps > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {category.gaps} gap{category.gaps !== 1 ? 's' : ''} identified
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="text-xs text-muted-foreground text-center">
                        Last assessed: {new Date(score.lastAssessment).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Compliance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {mockComplianceGaps.filter(g => g.status === 'resolved').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Resolved</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {mockComplianceGaps.filter(g => g.status === 'in-progress').length}
                      </div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {mockComplianceGaps.filter(g => g.status === 'open').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Open</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {mockAIRecommendations.length}
                      </div>
                      <p className="text-sm text-muted-foreground">AI Recommendations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gaps Tab */}
            <TabsContent value="gaps" className="space-y-4">
              <div className="flex space-x-4 mb-4">
                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Frameworks</SelectItem>
                    <SelectItem value="FDA QMSR">FDA QMSR</SelectItem>
                    <SelectItem value="ISO 13485">ISO 13485</SelectItem>
                    <SelectItem value="IEC 62304">IEC 62304</SelectItem>
                    <SelectItem value="ISO 14971">ISO 14971</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredGaps.map((gap) => (
                  <Card key={gap.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{gap.id}</Badge>
                            <Badge variant={getSeverityColor(gap.severity) as any}>
                              {gap.severity}
                            </Badge>
                            <Badge variant="secondary">{gap.framework}</Badge>
                            <Badge variant="outline">{gap.category}</Badge>
                          </div>
                          <CardTitle className="text-base">{gap.title}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {gap.confidence}% confidence
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{gap.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-sm mb-2">Affected Areas</p>
                          <div className="flex flex-wrap gap-1">
                            {gap.affectedAreas.map((area, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-2">Assignment</p>
                          <div className="flex items-center space-x-2 text-sm">
                            {gap.assignee && (
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{gap.assignee}</span>
                              </div>
                            )}
                            {gap.dueDate && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(gap.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-sm mb-2">AI Recommendation</p>
                        <p className="text-sm text-muted-foreground">{gap.recommendation}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Estimated effort: {gap.estimatedEffort} hours</span>
                        <span>Priority: {gap.priority}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-4">
                {mockAIRecommendations.map((recommendation) => (
                  <Card key={recommendation.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="capitalize">{recommendation.type}</Badge>
                            <Badge variant={recommendation.impact === 'high' ? 'default' : 'secondary'}>
                              {recommendation.impact} impact
                            </Badge>
                            <Badge variant={recommendation.effort === 'high' ? 'destructive' : 'secondary'}>
                              {recommendation.effort} effort
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{recommendation.title}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.confidence}% confidence
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-sm mb-2">Applicable Frameworks</p>
                          <div className="flex flex-wrap gap-1">
                            {recommendation.frameworks.map((framework, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                {framework}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-2">Expected Benefit</p>
                          <p className="text-sm text-muted-foreground">{recommendation.expectedBenefit}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Implement
                        </Button>
                        <Button variant="outline" size="sm">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Learn More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4">
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Compliance trends and analytics</p>
                <p className="text-sm text-muted-foreground">Historical compliance data and predictive insights coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
