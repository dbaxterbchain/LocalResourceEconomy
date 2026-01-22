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
    const slug = queryParams.slug
    const studyId = queryParams.study_id
    const status = queryParams.status
    const search = queryParams.search?.trim()
    const from = queryParams.from
    const to = queryParams.to
    const limit = Number.parseInt(queryParams.limit ?? '200', 10)

    const supabaseUrl = getEnv('SUPABASE_URL')
    const supabaseSecretKey = getEnv('SUPABASE_SECRET_KEY')
    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false },
    })

    let surveyId = queryParams.survey_id
    let cohortId = queryParams.cohort_id

    if (slug && (!surveyId || !cohortId)) {
      const { data: linkRow, error: linkError } = await supabase
        .from('survey_links')
        .select('survey_id, cohort_id')
        .eq('public_slug', slug)
        .single()

      if (linkError || !linkRow) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Survey link not found' }),
        }
      }

      surveyId = linkRow.survey_id
      cohortId = linkRow.cohort_id
    }

    let surveyIdsFromStudy: string[] | null = null

    if (studyId && !surveyId) {
      const { data: surveyRows, error: surveyError } = await supabase
        .from('surveys')
        .select('id')
        .eq('study_id', studyId)

      if (surveyError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: surveyError.message }),
        }
      }

      if (!surveyRows || surveyRows.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ responses: [] }) }
      }

      surveyIdsFromStudy = surveyRows.map((row) => row.id)
    }

    let query = supabase
      .from('responses')
      .select(
        'id, submitted_at, contact_name, contact_email, contact_phone, business_name, survey_id, cohort_id, survey_link_id',
      )
      .order('submitted_at', { ascending: false })
      .limit(Number.isNaN(limit) ? 200 : limit)

    if (surveyId) {
      query = query.eq('survey_id', surveyId)
    }

    if (surveyIdsFromStudy && surveyIdsFromStudy.length > 0) {
      query = query.in('survey_id', surveyIdsFromStudy)
    }

    if (cohortId) {
      query = query.eq('cohort_id', cohortId)
    }

    if (status === 'submitted') {
      query = query.not('submitted_at', 'is', null)
    }

    if (status === 'draft') {
      query = query.is('submitted_at', null)
    }

    if (from) {
      query = query.gte('submitted_at', from)
    }

    if (to) {
      query = query.lte('submitted_at', to)
    }

    const { data, error } = await query

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      }
    }

    const responses = data ?? []

    if (!search || responses.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ responses }),
      }
    }

    const responseIds = responses.map((row) => row.id)
    const { data: items, error: itemError } = await supabase
      .from('response_items')
      .select('response_id, value_text, value_number, value_json, survey_questions(label)')
      .in('response_id', responseIds)

    if (itemError) {
      return { statusCode: 500, body: JSON.stringify({ error: itemError.message }) }
    }

    const searchTerm = search.toLowerCase()
    const responseText = new Map<string, string>()

    for (const item of items ?? []) {
      const parts = [
        item.value_text ?? '',
        item.value_number?.toString() ?? '',
        item.value_json ? JSON.stringify(item.value_json) : '',
        item.survey_questions?.label ?? '',
      ]
      const current = responseText.get(item.response_id) ?? ''
      responseText.set(item.response_id, `${current} ${parts.join(' ')}`.trim())
    }

    const filtered = responses.filter((row) => {
      const contact = [
        row.contact_name,
        row.contact_email,
        row.contact_phone,
        row.business_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (contact.includes(searchTerm)) {
        return true
      }
      const itemText = responseText.get(row.id)?.toLowerCase() ?? ''
      return itemText.includes(searchTerm)
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ responses: filtered }),
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
