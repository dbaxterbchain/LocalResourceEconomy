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
    const cohortId = queryParams.cohort_id

    if (!cohortId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'cohort_id is required' }) }
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    const { data: cohort, error: cohortError } = await supabase
      .from('study_cohorts')
      .select('id, study_id, name, status, starts_at, ends_at, notes, created_at, studies(id, name, host_name)')
      .eq('id', cohortId)
      .single()

    if (cohortError || !cohort) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Cohort not found' }) }
    }

    const studyId = cohort.study_id

    const { data: surveys, error: surveyError } = await supabase
      .from('surveys')
      .select('id, name, status, is_template')
      .eq('study_id', studyId)
      .order('created_at', { ascending: true })

    if (surveyError) {
      return { statusCode: 500, body: JSON.stringify({ error: surveyError.message }) }
    }

    const { data: links, error: linkError } = await supabase
      .from('survey_links')
      .select('id, survey_id, cohort_id, public_slug, status, opens_at, closes_at')
      .eq('cohort_id', cohortId)

    if (linkError) {
      return { statusCode: 500, body: JSON.stringify({ error: linkError.message }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        cohort: {
          id: cohort.id,
          study_id: cohort.study_id,
          name: cohort.name,
          status: cohort.status,
          starts_at: cohort.starts_at,
          ends_at: cohort.ends_at,
          notes: cohort.notes,
          created_at: cohort.created_at,
        },
        study: cohort.studies,
        surveys: surveys ?? [],
        links: links ?? [],
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
