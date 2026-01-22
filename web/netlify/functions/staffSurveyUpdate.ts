import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv } from './utils'

type UpdatePayload = {
  survey_id?: string
  name?: string
  contact_info_mode?: 'optional' | 'required'
  contact_info_placement?: 'start' | 'end'
  is_template?: boolean
}

export const handler = async (event: {
  httpMethod: string
  headers?: Record<string, string> | null
  body?: string | null
}) => {
  try {
    if (event.httpMethod !== 'PATCH') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
    }

    if (!authorizeAdmin(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const payload = event.body ? (JSON.parse(event.body) as UpdatePayload) : {}
    if (!payload.survey_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing survey_id' }) }
    }

    const updateFields: Record<string, unknown> = {}
    if (payload.name !== undefined) {
      updateFields.name = payload.name
    }
    if (payload.contact_info_mode !== undefined) {
      updateFields.contact_info_mode = payload.contact_info_mode
    }
    if (payload.contact_info_placement !== undefined) {
      updateFields.contact_info_placement = payload.contact_info_placement
    }
    if (payload.is_template !== undefined) {
      updateFields.is_template = payload.is_template
    }

    if (Object.keys(updateFields).length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No fields to update' }) }
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    const { error } = await supabase
      .from('surveys')
      .update(updateFields)
      .eq('id', payload.survey_id)

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    return { statusCode: 200, body: JSON.stringify({ survey_id: payload.survey_id }) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
