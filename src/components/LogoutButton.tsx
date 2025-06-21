'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const { supabase, user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <Button variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  )
}
