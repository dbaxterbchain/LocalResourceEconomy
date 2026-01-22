import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv, getQueryParams } from './utils'

export const handler = async (event: {
  httpMethod: string
  queryStringParameters?: Record<string, string> | null
  headers?: Record<string, string> | null
}) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
    }

    if (!authorizeAdmin(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const queryParams = getQueryParams(event)
    const studyId = queryParams.study_id

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    let query = supabase
      .from('surveys')
      .select('id, study_id, name, status, is_template, created_at, studies(name)')
      .order('created_at', { ascending: false })

    if (studyId) {
      query = query.eq('study_id', studyId)
    }

    const { data, error } = await query

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    const surveys =
      data?.map((row) => ({
        id: row.id,
        study_id: row.study_id,
        name: row.name,
        status: row.status,
        is_template: row.is_template,
        created_at: row.created_at,
        study_name: row.studies?.name ?? null,
      })) ?? []

    return { statusCode: 200, body: JSON.stringify({ surveys }) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
