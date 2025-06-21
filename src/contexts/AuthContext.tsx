'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  role: string | null
  supabase: SupabaseClient | null
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  role: null,
  supabase: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  useEffect(() => {
    console.log('Initializing AuthContext...')

    const handleAuthStateChange = async (event: string, session: any) => {
      console.log('Auth state changed:', event, session?.user?.id)

      if (session?.user) {
        const authUser = {
          id: session.user.id,
          email: session.user.email || '',
        }

        // Get role from user metadata (instant, no DB query needed)
        let userRole =
          session.user.user_metadata?.role ||
          session.user.raw_user_meta_data?.role

        console.log('User role from metadata:', userRole)

        // Fallback: if no role in metadata, fetch from database (one time only)
        if (!userRole && event !== 'TOKEN_REFRESHED') {
          console.log(
            'No role in metadata, fetching from database as fallback...'
          )
          setLoading(true)
          try {
            const { data: userRoleData } = await supabase
              .from('user_roles')
              .select(
                `
                role_id,
                roles!inner(name)
              `
              )
              .eq('user_id', session.user.id)
              .single()

            userRole = userRoleData?.roles?.name || 'Pending'
            console.log('Fetched role from database:', userRole)

            // Refresh the metadata for next time
            await supabase.rpc('refresh_user_role_metadata', {
              user_id_param: session.user.id,
            })
          } catch (error) {
            console.error('Error fetching role fallback:', error)
            userRole = 'Pending'
          }
        }

        setUser(authUser)
        setRole(userRole || 'Pending')
        setLoading(false)
      } else {
        console.log('No session, clearing user state')
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    }

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // Check initial session
    const checkInitialSession = async () => {
      try {
        console.log('Checking for initial session...')
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        console.log('Initial session check:', { session: !!session, error })
        handleAuthStateChange('INITIAL_SESSION', session)
      } catch (error) {
        console.error('Error checking initial session:', error)
        setLoading(false)
      }
    }

    checkInitialSession()

    return () => {
      console.log('Cleaning up AuthContext listener...')
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, loading, role, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
