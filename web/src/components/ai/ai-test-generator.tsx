'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loading } from '@/components/ui/loading'
import { 
  Sparkles, 
  FileText, 
  TestTube, 
  Brain, 
  CheckCircle, 
  AlertCircle,
  Download,
  Copy,
  RefreshCw,
  Settings,
  Zap,
  Target,
  Shield,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Requirement {
  id: string
  title: string
  description: string
  type: 'functional' | 'security' | 'performance' | 'compliance'
  priority: 'critical' | 'high' | 'medium' | 'low'
  regulatoryReferences: string[]
}

interface GeneratedTest {
  id: string
  title: string
  description: string
  type: 'manual' | 'automated' | 'semi-automated'
  priority: 'critical' | 'high' | 'medium' | 'low'
  steps: TestStep[]
  expectedResult: string
  regulatoryMapping: string[]
  riskLevel: 'high' | 'medium' | 'low'
  estimatedDuration: number
  prerequisites: string[]
  confidence: number
}

interface TestStep {
  step: number
  action: string
  expectedResult: string
  notes?: string
}

interface AIGenerationConfig {
  testTypes: string[]
  priorityFocus: string
  regulatoryFramework: string[]
  automationLevel: string
  riskBasedApproach: boolean
  includeNegativeTests: boolean
  includeEdgeCases: boolean
}

// Mock requirements data
const mockRequirements: Requirement[] = [
  {
    id: 'REQ-001',
    title: 'Device Safety Shutdown',
    description: 'The device must automatically shut down when critical safety parameters exceed defined thresholds to prevent patient harm.',
    type: 'safety' as 'functional',
    priority: 'critical',
    regulatoryReferences: ['IEC 62304', 'ISO 14971', 'FDA QMSR']
  },
  {
    id: 'REQ-002', 
    title: 'User Authentication',
    description: 'System must authenticate users using multi-factor authentication before allowing access to patient data.',
    type: 'security',
    priority: 'high',
    regulatoryReferences: ['21 CFR Part 11', 'HIPAA', 'ISO 27001']
  },
  {
    id: 'REQ-003',
    title: 'Data Encryption',
    description: 'All patient data must be encrypted at rest and in transit using AES-256 encryption.',
    type: 'security',
    priority: 'critical',
    regulatoryReferences: ['HIPAA', 'GDPR', 'ISO 27001']
  }
]

export function AITestGenerator() {
  const { toast } = useToast()
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([])
  const [generatedTests, setGeneratedTests] = useState<GeneratedTest[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('requirements')
  
  const [config, setConfig] = useState<AIGenerationConfig>({
    testTypes: ['functional', 'security', 'performance'],
    priorityFocus: 'risk-based',
    regulatoryFramework: ['FDA QMSR', 'ISO 13485', 'IEC 62304'],
    automationLevel: 'mixed',
    riskBasedApproach: true,
    includeNegativeTests: true,
    includeEdgeCases: true
  })

  // Simulate AI test generation
  const generateTests = async () => {
    if (selectedRequirements.length === 0) {
      toast({
        title: "No requirements selected",
        description: "Please select at least one requirement to generate tests.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setActiveTab('generation')

    // Simulate AI processing with progress updates
    const progressSteps = [
      { progress: 20, message: 'Analyzing requirements...' },
      { progress: 40, message: 'Identifying test scenarios...' },
      { progress: 60, message: 'Generating test cases...' },
      { progress: 80, message: 'Applying regulatory mappings...' },
      { progress: 100, message: 'Finalizing test suite...' }
    ]

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setGenerationProgress(step.progress)
    }

    // Generate mock test cases
    const mockGeneratedTests: GeneratedTest[] = selectedRequirements.map((reqId, index) => {
      const requirement = mockRequirements.find(r => r.id === reqId)!
      return {
        id: `TC-AI-${Date.now()}-${index}`,
        title: `Automated Test: ${requirement.title}`,
        description: `AI-generated comprehensive test case for ${requirement.title} covering functional, security, and compliance aspects.`,
        type: config.automationLevel === 'automated' ? 'automated' : 'manual',
        priority: requirement.priority,
        steps: [
          {
            step: 1,
            action: `Set up test environment for ${requirement.title}`,
            expectedResult: 'Test environment is properly configured and ready'
          },
          {
            step: 2,
            action: `Execute primary test scenario for requirement ${reqId}`,
            expectedResult: 'System behaves according to requirement specification'
          },
          {
            step: 3,
            action: 'Verify regulatory compliance aspects',
            expectedResult: 'All regulatory requirements are met'
          },
          {
            step: 4,
            action: 'Test edge cases and boundary conditions',
            expectedResult: 'System handles edge cases gracefully'
          }
        ],
        expectedResult: `System successfully implements ${requirement.title} according to specification and regulatory requirements`,
        regulatoryMapping: requirement.regulatoryReferences,
        riskLevel: requirement.priority === 'critical' ? 'high' : 'medium',
        estimatedDuration: 30 + (index * 15),
        prerequisites: ['Test environment setup', 'Test data preparation', 'Regulatory documentation review'],
        confidence: 85 + Math.floor(Math.random() * 10)
      }
    })

    setGeneratedTests(mockGeneratedTests)
    setIsGenerating(false)
    setActiveTab('results')

    toast({
      title: "Tests generated successfully",
      description: `Generated ${mockGeneratedTests.length} AI-powered test cases with regulatory compliance mapping.`,
    })
  }

  const copyTestToClipboard = (test: GeneratedTest) => {
    const testText = `
Test Case: ${test.title}
ID: ${test.id}
Priority: ${test.priority}
Type: ${test.type}
Risk Level: ${test.riskLevel}
Estimated Duration: ${test.estimatedDuration} minutes
Confidence: ${test.confidence}%

Description:
${test.description}

Prerequisites:
${test.prerequisites.map(p => `- ${p}`).join('\n')}

Test Steps:
${test.steps.map(s => `${s.step}. ${s.action}\n   Expected: ${s.expectedResult}`).join('\n')}

Expected Result:
${test.expectedResult}

Regulatory Mapping:
${test.regulatoryMapping.join(', ')}
    `.trim()

    navigator.clipboard.writeText(testText)
    toast({
      title: "Test copied",
      description: "Test case has been copied to clipboard.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>AI-Powered Test Generation</span>
            <Badge variant="secondary" className="ml-2">
              <Brain className="h-3 w-3 mr-1" />
              Gemini AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="requirements">
                <FileText className="h-4 w-4 mr-2" />
                Requirements
              </TabsTrigger>
              <TabsTrigger value="config">
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="generation">
                <Zap className="h-4 w-4 mr-2" />
                Generation
              </TabsTrigger>
              <TabsTrigger value="results">
                <TestTube className="h-4 w-4 mr-2" />
                Results
              </TabsTrigger>
            </TabsList>

            {/* Requirements Selection */}
            <TabsContent value="requirements" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Requirements</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the requirements you want to generate test cases for. AI will analyze each requirement and create comprehensive test scenarios.
                </p>
                
                <div className="grid gap-4">
                  {mockRequirements.map((requirement) => (
                    <Card 
                      key={requirement.id} 
                      className={`cursor-pointer transition-all ${
                        selectedRequirements.includes(requirement.id) 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        if (selectedRequirements.includes(requirement.id)) {
                          setSelectedRequirements(prev => prev.filter(id => id !== requirement.id))
                        } else {
                          setSelectedRequirements(prev => [...prev, requirement.id])
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{requirement.id}</Badge>
                              <Badge variant={requirement.priority === 'critical' ? 'destructive' : 'secondary'}>
                                {requirement.priority}
                              </Badge>
                              <Badge variant="secondary">{requirement.type}</Badge>
                            </div>
                            <h4 className="font-medium">{requirement.title}</h4>
                            <p className="text-sm text-muted-foreground">{requirement.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {requirement.regulatoryReferences.map((ref, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {ref}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {selectedRequirements.includes(requirement.id) && (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedRequirements.length} requirement{selectedRequirements.length !== 1 ? 's' : ''} selected
                  </p>
                  <Button 
                    onClick={generateTests} 
                    disabled={selectedRequirements.length === 0}
                    className="flex items-center space-x-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Tests</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Configuration */}
            <TabsContent value="config" className="space-y-4">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">AI Generation Configuration</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Test Types</label>
                      <div className="space-y-2">
                        {['functional', 'security', 'performance', 'usability'].map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={type}
                              checked={config.testTypes.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConfig(prev => ({...prev, testTypes: [...prev.testTypes, type]}))
                                } else {
                                  setConfig(prev => ({...prev, testTypes: prev.testTypes.filter(t => t !== type)}))
                                }
                              }}
                            />
                            <label htmlFor={type} className="text-sm capitalize">{type}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority Focus</label>
                      <Select value={config.priorityFocus} onValueChange={(value) => setConfig(prev => ({...prev, priorityFocus: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="risk-based">Risk-Based</SelectItem>
                          <SelectItem value="critical-first">Critical First</SelectItem>
                          <SelectItem value="balanced">Balanced Coverage</SelectItem>
                          <SelectItem value="comprehensive">Comprehensive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Automation Level</label>
                      <Select value={config.automationLevel} onValueChange={(value) => setConfig(prev => ({...prev, automationLevel: value}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Only</SelectItem>
                          <SelectItem value="mixed">Mixed (Recommended)</SelectItem>
                          <SelectItem value="automated">Automated Preferred</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Advanced Options</label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Risk-Based Approach</label>
                          <input
                            type="checkbox"
                            checked={config.riskBasedApproach}
                            onChange={(e) => setConfig(prev => ({...prev, riskBasedApproach: e.target.checked}))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Include Negative Tests</label>
                          <input
                            type="checkbox"
                            checked={config.includeNegativeTests}
                            onChange={(e) => setConfig(prev => ({...prev, includeNegativeTests: e.target.checked}))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Include Edge Cases</label>
                          <input
                            type="checkbox"
                            checked={config.includeEdgeCases}
                            onChange={(e) => setConfig(prev => ({...prev, includeEdgeCases: e.target.checked}))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Regulatory Frameworks</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {['FDA QMSR', 'ISO 13485', 'IEC 62304', 'ISO 14971', 'ISO 27001', 'GDPR', '21 CFR Part 11'].map(framework => (
                          <div key={framework} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={framework}
                              checked={config.regulatoryFramework.includes(framework)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConfig(prev => ({...prev, regulatoryFramework: [...prev.regulatoryFramework, framework]}))
                                } else {
                                  setConfig(prev => ({...prev, regulatoryFramework: prev.regulatoryFramework.filter(f => f !== framework)}))
                                }
                              }}
                            />
                            <label htmlFor={framework} className="text-sm">{framework}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Generation Progress */}
            <TabsContent value="generation" className="space-y-4">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">AI Test Generation in Progress</h3>
                
                {isGenerating ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Loading size="lg" />
                      <div className="flex-1">
                        <p className="font-medium">Generating AI-powered test cases...</p>
                        <p className="text-sm text-muted-foreground">
                          Analyzing {selectedRequirements.length} requirements with regulatory compliance mapping
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{generationProgress}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="font-medium">AI Processing Steps:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li className={generationProgress >= 20 ? 'text-foreground' : ''}>
                            {generationProgress >= 20 ? '✓' : '○'} Analyzing requirements
                          </li>
                          <li className={generationProgress >= 40 ? 'text-foreground' : ''}>
                            {generationProgress >= 40 ? '✓' : '○'} Identifying test scenarios
                          </li>
                          <li className={generationProgress >= 60 ? 'text-foreground' : ''}>
                            {generationProgress >= 60 ? '✓' : '○'} Generating test cases
                          </li>
                          <li className={generationProgress >= 80 ? 'text-foreground' : ''}>
                            {generationProgress >= 80 ? '✓' : '○'} Applying regulatory mappings
                          </li>
                          <li className={generationProgress >= 100 ? 'text-foreground' : ''}>
                            {generationProgress >= 100 ? '✓' : '○'} Finalizing test suite
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium">Configuration:</p>
                        <ul className="space-y-1 text-muted-foreground text-xs">
                          <li>Test Types: {config.testTypes.join(', ')}</li>
                          <li>Priority: {config.priorityFocus}</li>
                          <li>Automation: {config.automationLevel}</li>
                          <li>Frameworks: {config.regulatoryFramework.length} selected</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Ready to generate AI-powered test cases</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Results */}
            <TabsContent value="results" className="space-y-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Generated Test Cases</h3>
                  {generatedTests.length > 0 && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => generateTests()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  )}
                </div>

                {generatedTests.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <Card className="p-4">
                        <div className="flex items-center space-x-2">
                          <TestTube className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium">{generatedTests.length}</p>
                            <p className="text-muted-foreground">Tests Generated</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium">
                              {Math.round(generatedTests.reduce((acc, test) => acc + test.confidence, 0) / generatedTests.length)}%
                            </p>
                            <p className="text-muted-foreground">Avg Confidence</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="font-medium">
                              {generatedTests.reduce((acc, test) => acc + test.estimatedDuration, 0)}m
                            </p>
                            <p className="text-muted-foreground">Total Duration</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="font-medium">
                              {new Set(generatedTests.flatMap(test => test.regulatoryMapping)).size}
                            </p>
                            <p className="text-muted-foreground">Standards Covered</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      {generatedTests.map((test) => (
                        <Card key={test.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">{test.id}</Badge>
                                  <Badge variant={test.priority === 'critical' ? 'destructive' : 'secondary'}>
                                    {test.priority}
                                  </Badge>
                                  <Badge variant="secondary">{test.type}</Badge>
                                  <Badge variant={test.riskLevel === 'high' ? 'destructive' : 'outline'}>
                                    {test.riskLevel} risk
                                  </Badge>
                                </div>
                                <CardTitle className="text-base">{test.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">{test.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="flex items-center space-x-1">
                                  <Target className="h-3 w-3" />
                                  <span>{test.confidence}%</span>
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={() => copyTestToClipboard(test)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium mb-2">Prerequisites:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                  {test.prerequisites.map((prereq, index) => (
                                    <li key={index}>• {prereq}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium mb-2">Regulatory Mapping:</p>
                                <div className="flex flex-wrap gap-1">
                                  {test.regulatoryMapping.map((mapping, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      {mapping}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="font-medium mb-2">Test Steps:</p>
                              <div className="space-y-2">
                                {test.steps.map((step) => (
                                  <div key={step.step} className="border rounded p-3 text-sm">
                                    <p className="font-medium">Step {step.step}: {step.action}</p>
                                    <p className="text-muted-foreground mt-1">Expected: {step.expectedResult}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border-t pt-4">
                              <p className="font-medium mb-2">Expected Result:</p>
                              <p className="text-sm text-muted-foreground">{test.expectedResult}</p>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Estimated Duration: {test.estimatedDuration} minutes</span>
                              <span>AI Confidence: {test.confidence}%</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No test cases generated yet</p>
                    <p className="text-sm text-muted-foreground">Select requirements and generate tests to see results here</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
