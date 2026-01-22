import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export const getSupabaseClient = () => {
  if (client) {
    return client
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY',
    )
  }

  client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false },
  })

  return client
}
