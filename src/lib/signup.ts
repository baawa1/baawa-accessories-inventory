import type { SupabaseClient } from '@supabase/supabase-js'

export const signUp = async (
  supabase: SupabaseClient,
  email: string,
  password: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { data: null, error }
  }

  return { data, error: null }
}
