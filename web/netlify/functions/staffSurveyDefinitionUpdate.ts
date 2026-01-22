import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv } from './utils'
import { insertSurveyStructure, type SurveyDefinition } from './surveyDefinition'

type SurveyDefinitionUpdatePayload = {
  survey_id?: string
  sections?: SurveyDefinition['sections']
}

export const handler = async (event: {
  httpMethod: string
  headers?: Record<string, string> | null
  body?: string | null
}) => {
  try {
    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
    }

    if (!authorizeAdmin(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const payload = event.body ? (JSON.parse(event.body) as SurveyDefinitionUpdatePayload) : {}
    if (!payload.survey_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing survey_id' }) }
    }

    const sections = payload.sections ?? []

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    const { count, error: countError } = await supabase
      .from('responses')
      .select('id', { count: 'exact', head: true })
      .eq('survey_id', payload.survey_id)

    if (countError) {
      return { statusCode: 500, body: JSON.stringify({ error: countError.message }) }
    }

    if (count && count > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Survey structure cannot be edited after responses exist.',
        }),
      }
    }

    const { error: deleteError } = await supabase
      .from('survey_sections')
      .delete()
      .eq('survey_id', payload.survey_id)

    if (deleteError) {
      return { statusCode: 500, body: JSON.stringify({ error: deleteError.message }) }
    }

    await insertSurveyStructure(supabase, payload.survey_id, sections)

    return { statusCode: 200, body: JSON.stringify({ survey_id: payload.survey_id }) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
