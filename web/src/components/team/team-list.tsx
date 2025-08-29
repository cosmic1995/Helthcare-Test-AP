'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  department: string
  status: 'active' | 'inactive' | 'pending'
  phone?: string
  location?: string
  joinDate: string
  lastActive: string
  permissions: string[]
  projects: string[]
}

// Mock team data - in real app, this would come from API
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@medtechinnovations.com',
    avatar: '/avatars/sarah.jpg',
    role: 'Compliance Manager',
    department: 'Regulatory Affairs',
    status: 'active',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    joinDate: '2023-01-15',
    lastActive: '2024-01-15T10:30:00Z',
    permissions: ['admin', 'compliance_review', 'project_management'],
    projects: ['Cardiac Monitor Device', 'Insulin Pump System', 'Blood Glucose Monitor']
  },
  {
    id: '2',
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@medtechinnovations.com',
    avatar: '/avatars/emily.jpg',
    role: 'Senior QA Engineer',
    department: 'Quality Assurance',
    status: 'active',
    phone: '+1 (555) 234-5678',
    location: 'Boston, MA',
    joinDate: '2022-08-20',
    lastActive: '2024-01-15T09:15:00Z',
    permissions: ['qa_review', 'test_execution', 'requirements_review'],
    projects: ['Cardiac Monitor Device', 'Ventilator Control System']
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@medtechinnovations.com',
    avatar: '/avatars/mike.jpg',
    role: 'Test Automation Engineer',
    department: 'Engineering',
    status: 'active',
    phone: '+1 (555) 345-6789',
    location: 'Austin, TX',
    joinDate: '2023-03-10',
    lastActive: '2024-01-14T16:45:00Z',
    permissions: ['test_automation', 'ci_cd_management'],
    projects: ['Blood Glucose Monitor', 'Insulin Pump System']
  },
  {
    id: '4',
    name: 'Lisa Wang',
    email: 'lisa.wang@medtechinnovations.com',
    role: 'Regulatory Specialist',
    department: 'Regulatory Affairs',
    status: 'pending',
    location: 'Seattle, WA',
    joinDate: '2024-01-10',
    lastActive: '2024-01-10T14:20:00Z',
    permissions: ['regulatory_review'],
    projects: []
  },
  {
    id: '5',
    name: 'David Thompson',
    email: 'david.thompson@medtechinnovations.com',
    role: 'Project Manager',
    department: 'Project Management',
    status: 'inactive',
    phone: '+1 (555) 456-7890',
    location: 'New York, NY',
    joinDate: '2021-11-05',
    lastActive: '2023-12-20T11:30:00Z',
    permissions: ['project_management', 'team_coordination'],
    projects: ['Legacy System Migration']
  }
]

const roleColors = {
  'Compliance Manager': 'bg-purple-100 text-purple-800',
  'Senior QA Engineer': 'bg-blue-100 text-blue-800',
  'Test Automation Engineer': 'bg-green-100 text-green-800',
  'Regulatory Specialist': 'bg-orange-100 text-orange-800',
  'Project Manager': 'bg-indigo-100 text-indigo-800'
}

const statusIcons = {
  active: CheckCircle,
  inactive: XCircle,
  pending: Clock
}

const statusColors = {
  active: 'text-green-600',
  inactive: 'text-red-600',
  pending: 'text-yellow-600'
}

export function TeamList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  // Filter team members based on search and filters
  const filteredMembers = mockTeamMembers.filter(member => {
    const matchesSearch = !searchQuery || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment
  })

  // Get unique values for filters
  const uniqueRoles = Array.from(new Set(mockTeamMembers.map(m => m.role)))
  const uniqueDepartments = Array.from(new Set(mockTeamMembers.map(m => m.department)))

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Active now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button className="flex items-center">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {uniqueRoles.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {uniqueDepartments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredMembers.length} of {mockTeamMembers.length} team members
        </p>
      </div>

      {/* Team Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => {
          const StatusIcon = statusIcons[member.status]
          
          return (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status and Department */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-4 w-4 ${statusColors[member.status]}`} />
                    <span className="text-sm capitalize">{member.status}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {member.department}
                  </Badge>
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.location && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{member.location}</span>
                    </div>
                  )}
                </div>

                {/* Projects */}
                {member.projects.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Active Projects</p>
                    <div className="flex flex-wrap gap-1">
                      {member.projects.slice(0, 2).map((project, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {project}
                        </Badge>
                      ))}
                      {member.projects.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.projects.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <p className="text-sm font-medium mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {member.permissions.slice(0, 2).map((permission, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                    {member.permissions.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{member.permissions.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Last Active */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatLastActive(member.lastActive)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mail className="h-3 w-3 mr-1" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No team members found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all'
                ? "Try adjusting your search criteria or filters"
                : "Get started by inviting your first team member"}
            </p>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
