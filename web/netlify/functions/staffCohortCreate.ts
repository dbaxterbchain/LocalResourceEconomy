import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv } from './utils'

type CohortPayload = {
  study_id?: string
  name?: string
  status?: 'draft' | 'open' | 'closed'
  starts_at?: string | null
  ends_at?: string | null
  notes?: string | null
}

export const handler = async (event: {
  httpMethod: string
  headers?: Record<string, string> | null
  body?: string | null
}) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
    }

    if (!authorizeAdmin(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const payload = event.body ? (JSON.parse(event.body) as CohortPayload) : {}
    if (!payload.study_id || !payload.name?.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'study_id and name are required' }) }
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from('study_cohorts')
      .insert({
        study_id: payload.study_id,
        name: payload.name.trim(),
        status: payload.status ?? 'draft',
        starts_at: payload.starts_at ?? null,
        ends_at: payload.ends_at ?? null,
        notes: payload.notes?.trim() || null,
      })
      .select('id')
      .single()

    if (error || !data) {
      return { statusCode: 500, body: JSON.stringify({ error: error?.message ?? 'Failed to create cohort' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ cohort_id: data.id }) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
