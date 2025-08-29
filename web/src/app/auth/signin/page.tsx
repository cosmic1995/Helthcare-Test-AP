import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { SignInForm } from '@/components/auth/signin-form'
import { AuthLayout } from '@/components/auth/auth-layout'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Healthcare Compliance SaaS account',
}

export default async function SignInPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/')
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <SignInForm />
    </AuthLayout>
  )
}
