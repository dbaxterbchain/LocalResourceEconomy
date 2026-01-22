import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv } from './utils'

export const handler = async (event: {
  httpMethod: string
  headers?: Record<string, string> | null
}) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
    }

    if (!authorizeAdmin(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from('studies')
      .select('id, name, host_name')
      .order('created_at', { ascending: true })

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    return { statusCode: 200, body: JSON.stringify({ studies: data ?? [] }) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
