export interface User {
  id: string
  email: string
  name: string
  image?: string | null
  emailVerified: boolean
  roles: string[]
  organizationId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  name: string
  organizationName?: string
}

export interface ResetPasswordCredentials {
  email: string
}

export interface UpdateProfileData {
  name?: string
  photoURL?: string
}

export type UserRole = 
  | 'admin'
  | 'system_admin'
  | 'compliance_officer'
  | 'quality_manager'
  | 'project_manager'
  | 'technical_lead'
  | 'test_reviewer'
  | 'user'

export interface Organization {
  id: string
  name: string
  domain: string
  settings: {
    complianceStandards: string[]
    dataResidency: string
    requireMFA: boolean
    allowedDomains: string[]
  }
  createdAt: Date
  updatedAt: Date
}

export interface AuthError {
  code: string
  message: string
}
