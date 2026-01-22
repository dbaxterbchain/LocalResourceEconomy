import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv } from './utils'
import { fetchSurveyDefinition, insertSurveyStructure } from './surveyDefinition'

type SurveyCreatePayload = {
  study_id?: string
  name?: string
  contact_info_mode?: 'optional' | 'required'
  contact_info_placement?: 'start' | 'end'
  is_template?: boolean
  source_survey_id?: string
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

    const payload = event.body ? (JSON.parse(event.body) as SurveyCreatePayload) : {}
    if (!payload.study_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing study_id' }) }
    }

    const name = payload.name?.trim()
    if (!name) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing survey name' }) }
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    const { data: surveyRow, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        study_id: payload.study_id,
        name,
        status: 'draft',
        contact_info_mode: payload.contact_info_mode ?? 'optional',
        contact_info_placement: payload.contact_info_placement ?? 'end',
        is_template: Boolean(payload.is_template),
      })
      .select('id')
      .single()

    if (surveyError || !surveyRow) {
      return { statusCode: 500, body: JSON.stringify({ error: surveyError?.message ?? 'Failed to create survey' }) }
    }

    if (payload.source_survey_id) {
      const definition = await fetchSurveyDefinition(supabase, payload.source_survey_id)
      await insertSurveyStructure(supabase, surveyRow.id, definition.sections)
    }

    return { statusCode: 200, body: JSON.stringify({ survey_id: surveyRow.id }) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
