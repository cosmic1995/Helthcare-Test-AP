'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComplianceMetric {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const complianceMetrics: ComplianceMetric[] = [
  {
    title: 'Overall Compliance',
    value: '87%',
    change: '+2.3%',
    changeType: 'positive',
    icon: CheckCircle,
    description: 'Projects meeting compliance requirements'
  },
  {
    title: 'Test Coverage',
    value: '92%',
    change: '+5.1%',
    changeType: 'positive',
    icon: CheckCircle,
    description: 'Requirements with approved test cases'
  },
  {
    title: 'Pending Reviews',
    value: '23',
    change: '-8',
    changeType: 'positive',
    icon: Clock,
    description: 'Items awaiting compliance review'
  },
  {
    title: 'Non-Compliant',
    value: '7',
    change: '+2',
    changeType: 'negative',
    icon: XCircle,
    description: 'Items requiring immediate attention'
  }
]

export function ComplianceOverview() {
  return (
    <>
      {complianceMetrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className={cn(
                "flex items-center space-x-1",
                metric.changeType === 'positive' && "text-green-600",
                metric.changeType === 'negative' && "text-red-600"
              )}>
                {metric.changeType === 'positive' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : metric.changeType === 'negative' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                <span>{metric.change}</span>
              </div>
              <span>from last month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
