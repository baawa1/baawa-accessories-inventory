'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LogoutPage() {
  const { supabase, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      if (supabase) {
        console.log('Logging out user...')
        await supabase.auth.signOut()
      }
      
      // Redirect to login page after logout
      router.replace('/login')
    }

    // Only perform logout if user is authenticated
    if (user) {
      performLogout()
    } else {
      // If no user, redirect to login
      router.replace('/login')
    }
  }, [supabase, user, router])

  return (
    <div className='flex min-h-screen flex-col items-center justify-center py-2'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Logging out...</CardTitle>
        </CardHeader>
        <CardContent className='text-center'>
          <p>Please wait while we log you out.</p>
        </CardContent>
      </Card>
    </div>
  )
}
