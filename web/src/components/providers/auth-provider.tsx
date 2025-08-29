'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { User } from '@/types/auth'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: { name?: string; photoURL?: string }) => Promise<void>
  resendVerificationEmail: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the ID token and set it as a cookie for server-side auth
          const token = await firebaseUser.getIdToken()
          document.cookie = `auth-token=${token}; path=/; secure; samesite=strict`

          // Convert Firebase user to our User type
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            image: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            roles: [], // Will be populated from custom claims
            organizationId: null, // Will be populated from custom claims
            createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            updatedAt: new Date(),
          }

          // Get custom claims for roles and organization
          const tokenResult = await firebaseUser.getIdTokenResult()
          if (tokenResult.claims.roles) {
            userData.roles = tokenResult.claims.roles as string[]
          }
          if (tokenResult.claims.organization_id) {
            userData.organizationId = tokenResult.claims.organization_id as string
          }

          setUser(userData)
        } catch (error) {
          console.error('Error processing user authentication:', error)
          setUser(null)
        }
      } else {
        // Clear the auth cookie
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Successfully signed in!')
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(getAuthErrorMessage(error.code))
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update the user's display name
      await updateProfile(firebaseUser, { displayName: name })
      
      // Send email verification
      await sendEmailVerification(firebaseUser)
      
      toast.success('Account created! Please check your email to verify your account.')
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast.error(getAuthErrorMessage(error.code))
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      await signInWithPopup(auth, provider)
      toast.success('Successfully signed in with Google!')
    } catch (error: any) {
      console.error('Google sign in error:', error)
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(getAuthErrorMessage(error.code))
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      toast.success('Successfully signed out!')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out. Please try again.')
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error: any) {
      console.error('Password reset error:', error)
      toast.error(getAuthErrorMessage(error.code))
      throw error
    }
  }

  const updateUserProfile = async (data: { name?: string; photoURL?: string }) => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user')
      
      await updateProfile(auth.currentUser, {
        displayName: data.name,
        photoURL: data.photoURL,
      })
      
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile. Please try again.')
      throw error
    }
  }

  const resendVerificationEmail = async () => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user')
      
      await sendEmailVerification(auth.currentUser)
      toast.success('Verification email sent! Check your inbox.')
    } catch (error: any) {
      console.error('Resend verification error:', error)
      toast.error(getAuthErrorMessage(error.code))
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateUserProfile,
    resendVerificationEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.'
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.'
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.'
    case 'auth/invalid-email':
      return 'Invalid email address format.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.'
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.'
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups and try again.'
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled. Please try again.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.'
    default:
      return 'An error occurred during authentication. Please try again.'
  }
}
