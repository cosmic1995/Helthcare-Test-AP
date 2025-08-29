'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loading } from '@/components/ui/loading'
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  FileCheck,
  FileX,
  Zap,
  Shield,
  Search,
  Tag,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UploadedDocument {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
}

interface ParsedContent {
  documentId: string
  documentType: 'requirement' | 'specification' | 'standard' | 'procedure' | 'report'
  confidence: number
  extractedText: string
  structuredData: {
    title?: string
    version?: string
    author?: string
    date?: string
    sections: DocumentSection[]
    requirements: ExtractedRequirement[]
    tables: ExtractedTable[]
    figures: ExtractedFigure[]
  }
  regulatoryClassification: {
    frameworks: string[]
    riskLevel: 'high' | 'medium' | 'low'
    complianceAreas: string[]
  }
  aiInsights: {
    summary: string
    keyFindings: string[]
    suggestedActions: string[]
    qualityScore: number
  }
}

interface DocumentSection {
  id: string
  title: string
  content: string
  level: number
  pageNumber?: number
}

interface ExtractedRequirement {
  id: string
  text: string
  type: 'functional' | 'security' | 'performance' | 'compliance'
  priority: 'critical' | 'high' | 'medium' | 'low'
  section: string
  confidence: number
}

interface ExtractedTable {
  id: string
  title?: string
  headers: string[]
  rows: string[][]
  pageNumber?: number
}

interface ExtractedFigure {
  id: string
  title?: string
  description?: string
  pageNumber?: number
  type: 'diagram' | 'chart' | 'image'
}

export function DocumentAIParser() {
  const { toast } = useToast()
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [parsedContent, setParsedContent] = useState<ParsedContent[]>([])
  const [activeTab, setActiveTab] = useState('upload')
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newDocuments: UploadedDocument[] = acceptedFiles.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      progress: 0
    }))

    setUploadedDocuments(prev => [...prev, ...newDocuments])
    
    // Simulate upload and processing
    newDocuments.forEach(doc => {
      simulateDocumentProcessing(doc)
    })

    setActiveTab('processing')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const simulateDocumentProcessing = async (document: UploadedDocument) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setUploadedDocuments(prev => 
        prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, progress, status: progress === 100 ? 'processing' : 'uploading' }
            : doc
        )
      )
    }

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Generate mock parsed content
    const mockParsedContent: ParsedContent = {
      documentId: document.id,
      documentType: 'specification',
      confidence: 92,
      extractedText: `This is a medical device specification document for ${document.name}. The document contains detailed requirements for device safety, performance, and regulatory compliance...`,
      structuredData: {
        title: document.name.replace(/\.[^/.]+$/, ""),
        version: '1.2',
        author: 'Regulatory Affairs Team',
        date: '2024-01-15',
        sections: [
          {
            id: 'sec-1',
            title: 'Introduction',
            content: 'This document specifies the requirements for medical device safety and performance.',
            level: 1,
            pageNumber: 1
          },
          {
            id: 'sec-2',
            title: 'Safety Requirements',
            content: 'The device must meet all applicable safety standards including IEC 62304 and ISO 14971.',
            level: 1,
            pageNumber: 3
          },
          {
            id: 'sec-3',
            title: 'Performance Specifications',
            content: 'Device performance must meet the following criteria under normal operating conditions.',
            level: 1,
            pageNumber: 8
          }
        ],
        requirements: [
          {
            id: 'REQ-001',
            text: 'The device shall automatically shut down when critical safety parameters exceed defined thresholds.',
            type: 'functional',
            priority: 'critical',
            section: 'Safety Requirements',
            confidence: 95
          },
          {
            id: 'REQ-002',
            text: 'All user interfaces must be accessible to users with disabilities according to WCAG 2.1 AA standards.',
            type: 'compliance',
            priority: 'high',
            section: 'User Interface Requirements',
            confidence: 88
          },
          {
            id: 'REQ-003',
            text: 'System response time for critical operations must not exceed 2 seconds.',
            type: 'performance',
            priority: 'high',
            section: 'Performance Specifications',
            confidence: 92
          }
        ],
        tables: [
          {
            id: 'table-1',
            title: 'Safety Parameters',
            headers: ['Parameter', 'Normal Range', 'Critical Threshold', 'Action'],
            rows: [
              ['Temperature', '20-25°C', '>30°C', 'Shutdown'],
              ['Pressure', '1-5 bar', '>8 bar', 'Alert + Shutdown'],
              ['Voltage', '110-240V', '<90V or >260V', 'Switch to backup']
            ],
            pageNumber: 5
          }
        ],
        figures: [
          {
            id: 'fig-1',
            title: 'System Architecture Diagram',
            description: 'High-level overview of the medical device system architecture',
            pageNumber: 2,
            type: 'diagram'
          }
        ]
      },
      regulatoryClassification: {
        frameworks: ['FDA QMSR', 'ISO 13485', 'IEC 62304', 'ISO 14971'],
        riskLevel: 'high',
        complianceAreas: ['Device Safety', 'Software Lifecycle', 'Risk Management', 'Quality Management']
      },
      aiInsights: {
        summary: 'This specification document contains comprehensive safety and performance requirements for a Class II medical device. The document demonstrates good regulatory compliance practices.',
        keyFindings: [
          'Document contains 15 critical safety requirements',
          'Strong alignment with IEC 62304 software lifecycle processes',
          'Risk management approach follows ISO 14971 guidelines',
          'Performance specifications are well-defined and measurable'
        ],
        suggestedActions: [
          'Consider adding more detailed user interface requirements',
          'Include cybersecurity requirements per FDA guidance',
          'Add traceability matrix for requirements validation',
          'Consider environmental testing requirements'
        ],
        qualityScore: 87
      }
    }

    setParsedContent(prev => [...prev, mockParsedContent])
    setUploadedDocuments(prev => 
      prev.map(doc => 
        doc.id === document.id 
          ? { ...doc, status: 'completed' }
          : doc
      )
    )

    toast({
      title: "Document processed successfully",
      description: `AI has extracted ${mockParsedContent.structuredData.requirements.length} requirements and analyzed regulatory compliance.`,
    })

    setActiveTab('results')
  }

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId))
    setParsedContent(prev => prev.filter(content => content.documentId !== documentId))
    if (selectedDocument === documentId) {
      setSelectedDocument(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loading size="sm" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const selectedParsedContent = selectedDocument 
    ? parsedContent.find(content => content.documentId === selectedDocument)
    : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>Document AI Parser</span>
            <Badge variant="secondary" className="ml-2">
              <Zap className="h-3 w-3 mr-1" />
              Google Document AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="processing">
                <Brain className="h-4 w-4 mr-2" />
                Processing
              </TabsTrigger>
              <TabsTrigger value="results">
                <FileCheck className="h-4 w-4 mr-2" />
                Results
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <Search className="h-4 w-4 mr-2" />
                Analysis
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-lg">Drop the documents here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg">Drag & drop documents here, or click to select</p>
                    <p className="text-sm text-muted-foreground">
                      Supports PDF, DOC, DOCX, TXT files up to 50MB
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Supported Document Types</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Requirements specifications</li>
                    <li>• Design documents</li>
                    <li>• Regulatory standards</li>
                    <li>• Test procedures</li>
                    <li>• Compliance reports</li>
                  </ul>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2">AI Capabilities</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Automatic requirement extraction</li>
                    <li>• Regulatory framework detection</li>
                    <li>• Table and figure recognition</li>
                    <li>• Document structure analysis</li>
                    <li>• Compliance gap identification</li>
                  </ul>
                </Card>
              </div>
            </TabsContent>

            {/* Processing Tab */}
            <TabsContent value="processing" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Processing Status</h3>
                
                {uploadedDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uploadedDocuments.map((document) => (
                      <Card key={document.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(document.status)}
                              <div>
                                <p className="font-medium">{document.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(document.size)} • {new Date(document.uploadedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                document.status === 'completed' ? 'default' :
                                document.status === 'failed' ? 'destructive' : 'secondary'
                              }>
                                {document.status}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeDocument(document.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {(document.status === 'uploading' || document.status === 'processing') && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>
                                  {document.status === 'uploading' ? 'Uploading...' : 'AI Processing...'}
                                </span>
                                <span>{document.progress}%</span>
                              </div>
                              <Progress value={document.progress} className="h-2" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Processed Documents</h3>
                  {parsedContent.length > 0 && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export All Results
                    </Button>
                  )}
                </div>

                {parsedContent.length === 0 ? (
                  <div className="text-center py-8">
                    <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No processed documents yet</p>
                    <p className="text-sm text-muted-foreground">Upload documents to see AI analysis results here</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {parsedContent.map((content) => {
                      const document = uploadedDocuments.find(doc => doc.id === content.documentId)
                      return (
                        <Card key={content.documentId} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">{content.documentType}</Badge>
                                  <Badge variant="secondary">
                                    {content.confidence}% confidence
                                  </Badge>
                                  <Badge variant={content.regulatoryClassification.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                                    {content.regulatoryClassification.riskLevel} risk
                                  </Badge>
                                </div>
                                <h4 className="font-medium">{document?.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {content.structuredData.requirements.length} requirements • 
                                  {content.structuredData.sections.length} sections • 
                                  {content.structuredData.tables.length} tables
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {content.regulatoryClassification.frameworks.map((framework, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      {framework}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedDocument(content.documentId)
                                  setActiveTab('analysis')
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-4">
              {selectedParsedContent ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Document Analysis</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Analysis
                      </Button>
                      <Button variant="outline" size="sm">
                        <Tag className="h-4 w-4 mr-2" />
                        Create Requirements
                      </Button>
                    </div>
                  </div>

                  {/* Document Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Document Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Type</p>
                          <p className="text-muted-foreground capitalize">{selectedParsedContent.documentType}</p>
                        </div>
                        <div>
                          <p className="font-medium">Confidence</p>
                          <p className="text-muted-foreground">{selectedParsedContent.confidence}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Risk Level</p>
                          <p className="text-muted-foreground capitalize">{selectedParsedContent.regulatoryClassification.riskLevel}</p>
                        </div>
                        <div>
                          <p className="font-medium">Quality Score</p>
                          <p className="text-muted-foreground">{selectedParsedContent.aiInsights.qualityScore}/100</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium mb-2">AI Summary</p>
                        <p className="text-sm text-muted-foreground">{selectedParsedContent.aiInsights.summary}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium mb-2">Key Findings</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {selectedParsedContent.aiInsights.keyFindings.map((finding, index) => (
                              <li key={index}>• {finding}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium mb-2">Suggested Actions</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {selectedParsedContent.aiInsights.suggestedActions.map((action, index) => (
                              <li key={index}>• {action}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Extracted Requirements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Extracted Requirements ({selectedParsedContent.structuredData.requirements.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedParsedContent.structuredData.requirements.map((requirement) => (
                          <div key={requirement.id} className="border rounded p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{requirement.id}</Badge>
                                <Badge variant={requirement.priority === 'critical' ? 'destructive' : 'secondary'}>
                                  {requirement.priority}
                                </Badge>
                                <Badge variant="secondary">{requirement.type}</Badge>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {requirement.confidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm mb-2">{requirement.text}</p>
                            <p className="text-xs text-muted-foreground">Section: {requirement.section}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document Structure */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Document Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedParsedContent.structuredData.sections.map((section) => (
                          <div key={section.id} className="flex items-center space-x-2 text-sm">
                            <span className="font-medium">{section.title}</span>
                            <Badge variant="outline" className="text-xs">
                              Page {section.pageNumber}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a document to view detailed analysis</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
