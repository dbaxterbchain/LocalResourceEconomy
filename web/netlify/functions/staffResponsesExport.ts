import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv, getQueryParams } from './utils'

const csvEscape = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

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
    const slug = queryParams.slug
    const studyId = queryParams.study_id
    const status = queryParams.status
    const search = queryParams.search?.trim()
    const from = queryParams.from
    const to = queryParams.to
    const limit = Number.parseInt(queryParams.limit ?? '5000', 10)

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
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
        return { statusCode: 500, body: JSON.stringify({ error: surveyError.message }) }
      }

      if (!surveyRows || surveyRows.length === 0) {
        return {
          statusCode: 200,
          headers: { 'content-type': 'text/csv' },
          body: 'response_id,submitted_at,survey_id,cohort_id,contact_name,contact_email,contact_phone,business_name,question_id,question_label,question_type,repeat_index,value_text,value_number,value_json',
        }
      }

      surveyIdsFromStudy = surveyRows.map((row) => row.id)
    }

    let responseQuery = supabase
      .from('responses')
      .select(
        'id, submitted_at, contact_name, contact_email, contact_phone, business_name, survey_id, cohort_id',
      )
      .order('submitted_at', { ascending: false })
      .limit(Number.isNaN(limit) ? 5000 : limit)

    if (surveyId) {
      responseQuery = responseQuery.eq('survey_id', surveyId)
    }

    if (surveyIdsFromStudy && surveyIdsFromStudy.length > 0) {
      responseQuery = responseQuery.in('survey_id', surveyIdsFromStudy)
    }

    if (cohortId) {
      responseQuery = responseQuery.eq('cohort_id', cohortId)
    }

    if (status === 'submitted') {
      responseQuery = responseQuery.not('submitted_at', 'is', null)
    }

    if (status === 'draft') {
      responseQuery = responseQuery.is('submitted_at', null)
    }

    if (from) {
      responseQuery = responseQuery.gte('submitted_at', from)
    }

    if (to) {
      responseQuery = responseQuery.lte('submitted_at', to)
    }

    const { data: responses, error: responseError } = await responseQuery

    if (responseError) {
      return { statusCode: 500, body: JSON.stringify({ error: responseError.message }) }
    }

    const responseRows = responses ?? []
    if (responseRows.length === 0) {
      return {
        statusCode: 200,
        headers: { 'content-type': 'text/csv' },
        body: 'response_id,submitted_at,survey_id,cohort_id,contact_name,contact_email,contact_phone,business_name,question_id,question_label,question_type,repeat_index,value_text,value_number,value_json',
      }
    }

    const responseIds = responseRows.map((row) => row.id)

    if (search) {
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

      const filteredIds = new Set(
        responseRows
          .filter((row) => {
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
          .map((row) => row.id),
      )

      if (filteredIds.size === 0) {
        return {
          statusCode: 200,
          headers: { 'content-type': 'text/csv' },
          body: 'response_id,submitted_at,survey_id,cohort_id,contact_name,contact_email,contact_phone,business_name,question_id,question_label,question_type,repeat_index,value_text,value_number,value_json',
        }
      }

      responseIds.splice(0, responseIds.length, ...Array.from(filteredIds))
    }

    const { data: items, error: itemsError } = await supabase
      .from('response_items')
      .select(
        'response_id, repeat_index, value_text, value_number, value_json, survey_questions(id, label, type), responses(survey_id, cohort_id, submitted_at, contact_name, contact_email, contact_phone, business_name)',
      )
      .in('response_id', responseIds)

    if (itemsError) {
      return { statusCode: 500, body: JSON.stringify({ error: itemsError.message }) }
    }

    const header = [
      'response_id',
      'submitted_at',
      'survey_id',
      'cohort_id',
      'contact_name',
      'contact_email',
      'contact_phone',
      'business_name',
      'question_id',
      'question_label',
      'question_type',
      'repeat_index',
      'value_text',
      'value_number',
      'value_json',
    ]

    const lines = [header.join(',')]

    for (const item of items ?? []) {
      const response = item.responses
      const question = item.survey_questions
      const row = [
        item.response_id ?? '',
        response?.submitted_at ?? '',
        response?.survey_id ?? '',
        response?.cohort_id ?? '',
        response?.contact_name ?? '',
        response?.contact_email ?? '',
        response?.contact_phone ?? '',
        response?.business_name ?? '',
        question?.id ?? '',
        question?.label ?? '',
        question?.type ?? '',
        item.repeat_index?.toString() ?? '0',
        item.value_text ?? '',
        item.value_number?.toString() ?? '',
        item.value_json ? JSON.stringify(item.value_json) : '',
      ]
      lines.push(row.map((value) => csvEscape(String(value))).join(','))
    }

    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/csv',
        'content-disposition': 'attachment; filename="responses.csv"',
      },
      body: lines.join('\n'),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
