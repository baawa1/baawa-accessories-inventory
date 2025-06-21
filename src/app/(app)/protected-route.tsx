import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    } else if (role === 'Pending') {
      router.replace('/waiting')
    }
  }, [user, loading, role, router])

  if (loading || !user) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <span>Loading...</span>
      </div>
    )
  }

  return <>{children}</>
}
