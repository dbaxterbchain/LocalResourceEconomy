import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv, getQueryParams } from './utils'

type LinkPayload = {
  cohort_id?: string
  survey_id?: string
  public_slug?: string | null
  status?: 'open' | 'closed'
  opens_at?: string | null
  closes_at?: string | null
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const buildSlug = (surveyName: string, cohortName: string, provided?: string | null) => {
  if (provided && provided.trim()) {
    return slugify(provided)
  }
  const base = slugify(`${surveyName}-${cohortName}`)
  return base || `survey-${slugify(surveyName) || 'link'}`
}

export const handler = async (event: {
  httpMethod: string
  queryStringParameters?: Record<string, string> | null
  headers?: Record<string, string> | null
  body?: string | null
}) => {
  try {
    if (!authorizeAdmin(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const queryParams = getQueryParams(event)
    const payload = event.body ? (JSON.parse(event.body) as LinkPayload) : {}

    const cohortId = payload.cohort_id ?? queryParams.cohort_id
    const surveyId = payload.survey_id ?? queryParams.survey_id

    if (!cohortId || !surveyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'cohort_id and survey_id are required' }) }
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    const [cohortResult, surveyResult] = await Promise.all([
      supabase
        .from('study_cohorts')
        .select('id, study_id, name, status')
        .eq('id', cohortId)
        .single(),
      supabase
        .from('surveys')
        .select('id, study_id, name, status')
        .eq('id', surveyId)
        .single(),
    ])

    if (cohortResult.error || !cohortResult.data) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Cohort not found' }) }
    }

    if (surveyResult.error || !surveyResult.data) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Survey not found' }) }
    }

    const studyId = cohortResult.data.study_id

    const { data: study, error: studyError } = await supabase
      .from('studies')
      .select('id, name, host_name')
      .eq('id', studyId)
      .single()

    if (studyError || !study) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Study not found' }) }
    }

    if (event.httpMethod === 'GET') {
      const { data: link, error: linkError } = await supabase
        .from('survey_links')
        .select('id, survey_id, cohort_id, public_slug, status, opens_at, closes_at')
        .eq('survey_id', surveyId)
        .eq('cohort_id', cohortId)
        .limit(1)
        .maybeSingle()

      if (linkError) {
        return { statusCode: 500, body: JSON.stringify({ error: linkError.message }) }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          study,
          cohort: cohortResult.data,
          survey: surveyResult.data,
          link: link ?? null,
        }),
      }
    }

    if (event.httpMethod === 'POST') {
      const { data: existing } = await supabase
        .from('survey_links')
        .select('id, survey_id, cohort_id, public_slug, status, opens_at, closes_at')
        .eq('survey_id', surveyId)
        .eq('cohort_id', cohortId)
        .limit(1)
        .maybeSingle()

      if (existing) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            study,
            cohort: cohortResult.data,
            survey: surveyResult.data,
            link: existing,
          }),
        }
      }

      const baseSlug = buildSlug(surveyResult.data.name, cohortResult.data.name, payload.public_slug)
      const status = payload.status ?? 'closed'
      let created = null as null | {
        id: string
        survey_id: string
        cohort_id: string
        public_slug: string
        status: string
        opens_at: string | null
        closes_at: string | null
      }

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const suffix = attempt === 0 ? '' : `-${Math.random().toString(36).slice(2, 6)}`
        const slug = `${baseSlug}${suffix}`
        const { data, error } = await supabase
          .from('survey_links')
          .insert({
            survey_id: surveyId,
            cohort_id: cohortId,
            public_slug: slug,
            status,
            opens_at: payload.opens_at ?? null,
            closes_at: payload.closes_at ?? null,
          })
          .select('id, survey_id, cohort_id, public_slug, status, opens_at, closes_at')
          .single()

        if (!error && data) {
          created = data
          break
        }
        if (error?.code !== '23505') {
          return { statusCode: 500, body: JSON.stringify({ error: error?.message ?? 'Failed to create link' }) }
        }
      }

      if (!created) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to generate a unique link slug' }) }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          study,
          cohort: cohortResult.data,
          survey: surveyResult.data,
          link: created,
        }),
      }
    }

    if (event.httpMethod === 'PATCH') {
      const { data: link, error: linkError } = await supabase
        .from('survey_links')
        .update({
          public_slug: payload.public_slug ? slugify(payload.public_slug) : undefined,
          status: payload.status,
          opens_at: payload.opens_at ?? null,
          closes_at: payload.closes_at ?? null,
        })
        .eq('survey_id', surveyId)
        .eq('cohort_id', cohortId)
        .select('id, survey_id, cohort_id, public_slug, status, opens_at, closes_at')
        .single()

      if (linkError || !link) {
        return { statusCode: 500, body: JSON.stringify({ error: linkError?.message ?? 'Failed to update link' }) }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          study,
          cohort: cohortResult.data,
          survey: surveyResult.data,
          link,
        }),
      }
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
