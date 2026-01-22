import { createClient } from '@supabase/supabase-js'
import { authorizeAdmin, getEnv } from './utils'
import { insertSurveyStructure } from './surveyDefinition'

type SurveyDefinitionPayload = {
  survey: {
    name?: string
    contact_info_mode?: 'optional' | 'required'
    contact_info_placement?: 'start' | 'end'
    is_template?: boolean
  }
  sections?: Array<{
    title: string
    sort_order?: number
    questions?: Array<{
      type: string
      label: string
      helper_text?: string | null
      required?: boolean
      repeat_group_key?: string | null
      sort_order?: number
      config_json?: Record<string, unknown>
      options?: Array<{
        value: string
        label: string
        sort_order?: number
      }>
    }>
  }>
}

type ImportPayload = {
  study_id?: string
  definition?: SurveyDefinitionPayload
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

    const payload = event.body ? (JSON.parse(event.body) as ImportPayload) : {}
    if (!payload.study_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing study_id' }) }
    }

    const definition = payload.definition
    if (!definition?.survey?.name) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing survey definition' }) }
    }

    const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SECRET_KEY'), {
      auth: { persistSession: false },
    })

    const { data: surveyRow, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        study_id: payload.study_id,
        name: definition.survey.name,
        status: 'draft',
        contact_info_mode: definition.survey.contact_info_mode ?? 'optional',
        contact_info_placement: definition.survey.contact_info_placement ?? 'end',
        is_template: Boolean(definition.survey.is_template),
      })
      .select('id')
      .single()

    if (surveyError || !surveyRow) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: surveyError?.message ?? 'Failed to create survey' }),
      }
    }

    const normalizedSections =
      definition.sections?.map((section, index) => ({
        id: section.title,
        title: section.title,
        sort_order: section.sort_order ?? index + 1,
        questions:
          section.questions?.map((question, qIndex) => ({
            id: question.label,
            type: question.type,
            label: question.label,
            helper_text: question.helper_text ?? null,
            required: Boolean(question.required),
            repeat_group_key: question.repeat_group_key ?? null,
            sort_order: question.sort_order ?? qIndex + 1,
            config_json: question.config_json ?? {},
            options:
              question.options?.map((option, oIndex) => ({
                id: option.value,
                value: option.value,
                label: option.label,
                sort_order: option.sort_order ?? oIndex + 1,
              })) ?? [],
          })) ?? [],
      })) ?? []

    await insertSurveyStructure(supabase, surveyRow.id, normalizedSections)

    return { statusCode: 200, body: JSON.stringify({ survey_id: surveyRow.id }) }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
    }
  }
}
