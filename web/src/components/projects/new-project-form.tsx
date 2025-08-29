'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Save, 
  Plus, 
  X,
  Calendar,
  Users,
  Shield,
  FileText,
  AlertTriangle
} from 'lucide-react'

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
  regulatoryClass: z.string().min(1, 'Regulatory class is required'),
  riskClassification: z.string().min(1, 'Risk classification is required'),
  lifecycleStage: z.string().min(1, 'Lifecycle stage is required'),
  complianceStandards: z.array(z.string()).min(1, 'At least one compliance standard is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  projectManager: z.string().min(1, 'Project manager is required'),
  qualityManager: z.string().optional(),
  regulatoryContact: z.string().optional(),
  almIntegrations: z.array(z.string()).optional(),
  organization: z.string().min(1, 'Organization is required')
})

type ProjectFormData = z.infer<typeof projectSchema>

const regulatoryClasses = [
  { value: 'class_i', label: 'Class I' },
  { value: 'class_ii', label: 'Class II' },
  { value: 'class_iia', label: 'Class IIa' },
  { value: 'class_iib', label: 'Class IIb' },
  { value: 'class_iii', label: 'Class III' }
]

const riskClassifications = [
  { value: 'a', label: 'Risk A - Low Risk' },
  { value: 'b', label: 'Risk B - Medium Risk' },
  { value: 'c', label: 'Risk C - High Risk' },
  { value: 'd', label: 'Risk D - Very High Risk' }
]

const lifecycleStages = [
  { value: 'planning', label: 'Planning' },
  { value: 'design_controls', label: 'Design Controls' },
  { value: 'development', label: 'Development' },
  { value: 'verification', label: 'Verification' },
  { value: 'validation', label: 'Validation' },
  { value: 'maintenance', label: 'Maintenance' }
]

const complianceStandards = [
  { value: 'FDA_QMSR', label: 'FDA QMSR (21 CFR Part 820)' },
  { value: 'ISO_13485', label: 'ISO 13485 (Medical Devices QMS)' },
  { value: 'IEC_62304', label: 'IEC 62304 (Medical Device Software)' },
  { value: 'ISO_14971', label: 'ISO 14971 (Risk Management)' },
  { value: 'ISO_27001', label: 'ISO 27001 (Information Security)' },
  { value: 'GDPR', label: 'GDPR (Data Protection)' },
  { value: 'HIPAA', label: 'HIPAA (Healthcare Privacy)' },
  { value: 'CFR_PART_11', label: '21 CFR Part 11 (Electronic Records)' },
  { value: 'ISO_15189', label: 'ISO 15189 (Medical Laboratories)' },
  { value: 'CLIA', label: 'CLIA (Clinical Laboratory)' },
  { value: 'FCC_PART_15', label: 'FCC Part 15 (Radio Frequency)' },
  { value: 'SOC_2', label: 'SOC 2 (Service Organization Controls)' }
]

const almIntegrations = [
  { value: 'jira', label: 'Atlassian Jira' },
  { value: 'azure_devops', label: 'Azure DevOps' },
  { value: 'polarion', label: 'Polarion ALM' }
]

export function NewProjectForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      complianceStandards: [],
      almIntegrations: []
    }
  })

  const handleStandardToggle = (standardValue: string) => {
    const updated = selectedStandards.includes(standardValue)
      ? selectedStandards.filter(s => s !== standardValue)
      : [...selectedStandards, standardValue]
    
    setSelectedStandards(updated)
    setValue('complianceStandards', updated)
  }

  const handleIntegrationToggle = (integrationValue: string) => {
    const updated = selectedIntegrations.includes(integrationValue)
      ? selectedIntegrations.filter(i => i !== integrationValue)
      : [...selectedIntegrations, integrationValue]
    
    setSelectedIntegrations(updated)
    setValue('almIntegrations', updated)
  }

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    
    try {
      // In real app, this would call the API
      console.log('Creating project:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Project created successfully!')
      router.push('/projects')
    } catch (error) {
      toast.error('Failed to create project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., CardioMonitor Pro"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">Organization *</Label>
              <Input
                id="organization"
                {...register('organization')}
                placeholder="e.g., MedTech Innovations Inc."
              />
              {errors.organization && (
                <p className="text-sm text-red-600">{errors.organization.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the project, its purpose, and key features..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Regulatory Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Regulatory Classification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regulatoryClass">Regulatory Class *</Label>
              <Select onValueChange={(value) => setValue('regulatoryClass', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {regulatoryClasses.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.regulatoryClass && (
                <p className="text-sm text-red-600">{errors.regulatoryClass.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="riskClassification">Risk Classification *</Label>
              <Select onValueChange={(value) => setValue('riskClassification', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  {riskClassifications.map((risk) => (
                    <SelectItem key={risk.value} value={risk.value}>
                      {risk.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.riskClassification && (
                <p className="text-sm text-red-600">{errors.riskClassification.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lifecycleStage">Lifecycle Stage *</Label>
              <Select onValueChange={(value) => setValue('lifecycleStage', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {lifecycleStages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.lifecycleStage && (
                <p className="text-sm text-red-600">{errors.lifecycleStage.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Compliance Standards</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {complianceStandards.map((standard) => (
              <div key={standard.value} className="flex items-center space-x-2">
                <Checkbox
                  id={standard.value}
                  checked={selectedStandards.includes(standard.value)}
                  onCheckedChange={() => handleStandardToggle(standard.value)}
                />
                <Label htmlFor={standard.value} className="text-sm">
                  {standard.label}
                </Label>
              </div>
            ))}
          </div>
          
          {selectedStandards.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Standards:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedStandards.map((standardValue) => {
                  const standard = complianceStandards.find(s => s.value === standardValue)
                  return (
                    <Badge key={standardValue} variant="secondary" className="flex items-center space-x-1">
                      <span>{standard?.label}</span>
                      <button
                        type="button"
                        onClick={() => handleStandardToggle(standardValue)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
          
          {errors.complianceStandards && (
            <p className="text-sm text-red-600">{errors.complianceStandards.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Team & Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team & Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectManager">Project Manager *</Label>
              <Input
                id="projectManager"
                {...register('projectManager')}
                placeholder="e.g., Sarah Johnson"
              />
              {errors.projectManager && (
                <p className="text-sm text-red-600">{errors.projectManager.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="qualityManager">Quality Manager</Label>
              <Input
                id="qualityManager"
                {...register('qualityManager')}
                placeholder="e.g., Mike Chen"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="regulatoryContact">Regulatory Contact</Label>
              <Input
                id="regulatoryContact"
                {...register('regulatoryContact')}
                placeholder="e.g., Dr. Emily Rodriguez"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ALM Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>ALM Integrations (Optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {almIntegrations.map((integration) => (
              <div key={integration.value} className="flex items-center space-x-2">
                <Checkbox
                  id={integration.value}
                  checked={selectedIntegrations.includes(integration.value)}
                  onCheckedChange={() => handleIntegrationToggle(integration.value)}
                />
                <Label htmlFor={integration.value} className="text-sm">
                  {integration.label}
                </Label>
              </div>
            ))}
          </div>
          
          {selectedIntegrations.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Integrations:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedIntegrations.map((integrationValue) => {
                  const integration = almIntegrations.find(i => i.value === integrationValue)
                  return (
                    <Badge key={integrationValue} variant="outline" className="flex items-center space-x-1">
                      <span>{integration?.label}</span>
                      <button
                        type="button"
                        onClick={() => handleIntegrationToggle(integrationValue)}
                        className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Project
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
