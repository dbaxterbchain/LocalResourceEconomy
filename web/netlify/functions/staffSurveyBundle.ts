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
        body: JSON.stringify({
          error: 'Unauthorized',
        }),
      }
    }

    const queryParams = getQueryParams(event)
    const slug = queryParams.slug
    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing slug parameter' }),
      }
    }

    const supabaseUrl = getEnv('SUPABASE_URL')
    const supabaseSecretKey = getEnv('SUPABASE_SECRET_KEY')
    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase.rpc('get_staff_survey_bundle', { p_slug: slug })

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      }
    }

    if (!data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Survey bundle not found' }),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
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
