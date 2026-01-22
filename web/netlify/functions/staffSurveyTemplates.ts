import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv, getQueryParams } from './utils'

export const handler = async (event: {
  httpMethod: string
  headers?: Record<string, string> | null
  queryStringParameters?: Record<string, string> | null
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

    const queryParams = getQueryParams(event)
    const studyId = queryParams.study_id

    let query = supabase
      .from('surveys')
      .select('id, study_id, name, contact_info_mode, contact_info_placement, is_template')
      .eq('is_template', true)
      .order('created_at', { ascending: true })

    if (studyId) {
      query = query.eq('study_id', studyId)
    }

    const { data, error } = await query

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    return { statusCode: 200, body: JSON.stringify({ templates: data ?? [] }) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
