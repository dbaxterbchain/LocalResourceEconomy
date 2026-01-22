import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv, getQueryParams } from './utils'
import { fetchSurveyDefinition } from './surveyDefinition'

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

    const queryParams = getQueryParams(event)
    const surveyId = queryParams.survey_id
    if (!surveyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing survey_id' }) }
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    const definition = await fetchSurveyDefinition(supabase, surveyId)
    return { statusCode: 200, body: JSON.stringify(definition) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
