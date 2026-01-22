import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv, getQueryParams } from './utils'

export const handler = async (event: {
  httpMethod: string
  queryStringParameters?: Record<string, string> | null
  headers?: Record<string, string> | null
}) => {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      }
    }

    if (!authorizeAdmin(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      }
    }

    const queryParams = getQueryParams(event)
    const responseId = queryParams.response_id

    if (!responseId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing response_id' }),
      }
    }

    const supabaseUrl = getEnv('SUPABASE_URL')
    const supabaseSecretKey = getEnv('SUPABASE_SECRET_KEY')
    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from('responses')
      .select(
        `
        id,
        submitted_at,
        contact_name,
        contact_email,
        contact_phone,
        business_name,
        survey_id,
        cohort_id,
        response_items (
          id,
          question_id,
          repeat_index,
          value_text,
          value_number,
          value_json,
          survey_questions (
            label,
            type
          )
        ),
        response_audit_log (
          id,
          edited_at,
          editor_id,
          field_path,
          old_value,
          new_value,
          reason
        )
      `,
      )
      .eq('id', responseId)
      .single()

    if (error || !data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Response not found' }),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ response: data }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
    }
  }
}
