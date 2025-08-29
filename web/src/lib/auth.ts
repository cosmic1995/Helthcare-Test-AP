import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@/types/auth'

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  
  if (!privateKey || !process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    console.warn('Firebase Admin SDK not configured. Authentication will not work.')
  } else {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    })
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)

    // Get additional user data from your database here
    // This is a simplified version - you'd typically fetch from BigQuery
    const user: User = {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      image: decodedToken.picture || null,
      emailVerified: decodedToken.email_verified || false,
      roles: decodedToken.roles || ['user'],
      organizationId: decodedToken.organization_id || null,
      createdAt: new Date(decodedToken.auth_time * 1000),
      updatedAt: new Date(),
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return user
}

export async function requireRole(requiredRoles: string[]): Promise<User> {
  const user = await requireAuth()
  
  const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role))
  
  if (!hasRequiredRole) {
    redirect('/unauthorized')
  }
  
  return user
}

export async function requireOrganization(organizationId: string): Promise<User> {
  const user = await requireAuth()
  
  if (user.organizationId !== organizationId) {
    redirect('/unauthorized')
  }
  
  return user
}

export function hasRole(user: User, role: string): boolean {
  return user.roles.includes(role)
}

export function hasAnyRole(user: User, roles: string[]): boolean {
  return roles.some(role => user.roles.includes(role))
}

export function isAdmin(user: User): boolean {
  return hasAnyRole(user, ['admin', 'system_admin'])
}

export function isComplianceOfficer(user: User): boolean {
  return hasAnyRole(user, ['compliance_officer', 'quality_manager'])
}

export function canManageProject(user: User): boolean {
  return hasAnyRole(user, ['admin', 'project_manager', 'technical_lead'])
}

export function canReviewTests(user: User): boolean {
  return hasAnyRole(user, ['admin', 'quality_manager', 'test_reviewer', 'compliance_officer'])
}

export function canApproveRequirements(user: User): boolean {
  return hasAnyRole(user, ['admin', 'quality_manager', 'compliance_officer'])
}

export async function signOut(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete('auth-token')
  redirect('/auth/signin')
}
