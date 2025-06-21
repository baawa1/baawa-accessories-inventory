// Script to refresh user role metadata for existing users
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function refreshAllUserMetadata() {
  try {
    console.log('Fetching all users with roles...')
    
    // Get all users with their roles
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles!inner(name)
      `)
    
    if (error) {
      console.error('Error fetching user roles:', error)
      return
    }
    
    console.log(`Found ${userRoles.length} users with roles`)
    
    // Update each user's metadata
    for (const userRole of userRoles) {
      console.log(`Updating metadata for user ${userRole.user_id} with role ${userRole.roles.name}`)
      
      const { error: updateError } = await supabase.rpc('refresh_user_role_metadata', {
        user_id_param: userRole.user_id
      })
      
      if (updateError) {
        console.error(`Error updating user ${userRole.user_id}:`, updateError)
      } else {
        console.log(`✅ Updated user ${userRole.user_id}`)
      }
    }
    
    console.log('✅ All user metadata refreshed!')
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

refreshAllUserMetadata().then(() => process.exit(0))
