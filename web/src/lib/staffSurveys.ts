export type StudySummary = {
  id: string
  name: string
  host_name: string
}

export type SurveySummary = {
  id: string
  study_id: string
  name: string
  status: string
  is_template: boolean
  created_at: string
  study_name: string | null
}

export type SurveyTemplateSummary = {
  id: string
  study_id: string
  name: string
  contact_info_mode: 'optional' | 'required'
  contact_info_placement: 'start' | 'end'
  is_template: boolean
}

export type SurveyDefinition = {
  survey: {
    id?: string
    study_id?: string
    name: string
    status?: string
    contact_info_mode: 'optional' | 'required'
    contact_info_placement: 'start' | 'end'
    is_template?: boolean
  }
  sections: Array<{
    id?: string
    title: string
    sort_order: number
    repeat_groups?: Array<{
      id?: string
      name: string
      repeat_group_key: string
      min_items: number
      max_items: number
      sort_order: number
    }>
    questions: Array<{
      id?: string
      type: 'text' | 'number' | 'select' | 'multiselect' | 'longtext' | 'info'
      label: string
      helper_text: string | null
      required: boolean
      repeat_group_key: string | null
      group_id?: string | null
      sort_order: number
      config_json?: Record<string, unknown>
      options?: Array<{
        id?: string
        value: string
        label: string
        sort_order: number
      }>
    }>
  }>
}

type StaffRequestParams = {
  adminToken: string
}

export const fetchStudies = async ({ adminToken }: StaffRequestParams) => {
  const response = await fetch('/.netlify/functions/staffStudies', {
    headers: { 'x-admin-token': adminToken },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch studies')
  }

  const payload = (await response.json()) as { studies: StudySummary[] }
  return payload.studies
}

export const fetchSurveyTemplates = async ({
  adminToken,
  studyId,
}: StaffRequestParams & { studyId?: string }) => {
  const url = new URL('/.netlify/functions/staffSurveyTemplates', window.location.origin)
  if (studyId) {
    url.searchParams.set('study_id', studyId)
  }

  const response = await fetch(url.toString(), {
    headers: { 'x-admin-token': adminToken },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch templates')
  }

  const payload = (await response.json()) as { templates: SurveyTemplateSummary[] }
  return payload.templates
}

export const fetchStaffSurveys = async ({
  adminToken,
  studyId,
}: StaffRequestParams & { studyId?: string }) => {
  const url = new URL('/.netlify/functions/staffSurveys', window.location.origin)
  if (studyId) {
    url.searchParams.set('study_id', studyId)
  }

  const response = await fetch(url.toString(), {
    headers: { 'x-admin-token': adminToken },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch surveys')
  }

  const payload = (await response.json()) as { surveys: SurveySummary[] }
  return payload.surveys
}

export const createSurvey = async ({
  adminToken,
  payload,
}: StaffRequestParams & { payload: Record<string, unknown> }) => {
  const response = await fetch('/.netlify/functions/staffSurveyCreate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create survey')
  }

  const data = (await response.json()) as { survey_id: string }
  return data.survey_id
}

export const exportSurvey = async ({
  adminToken,
  surveyId,
}: StaffRequestParams & { surveyId: string }) => {
  const url = new URL('/.netlify/functions/staffSurveyExport', window.location.origin)
  url.searchParams.set('survey_id', surveyId)

  const response = await fetch(url.toString(), {
    headers: { 'x-admin-token': adminToken },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to export survey')
  }

  return (await response.json()) as SurveyDefinition
}

export const importSurvey = async ({
  adminToken,
  studyId,
  definition,
}: StaffRequestParams & { studyId: string; definition: SurveyDefinition }) => {
  const response = await fetch('/.netlify/functions/staffSurveyImport', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken,
    },
    body: JSON.stringify({ study_id: studyId, definition }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to import survey')
  }

  const data = (await response.json()) as { survey_id: string }
  return data.survey_id
}

export const updateSurvey = async ({
  adminToken,
  payload,
}: StaffRequestParams & { payload: Record<string, unknown> }) => {
  const response = await fetch('/.netlify/functions/staffSurveyUpdate', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update survey')
  }

  return (await response.json()) as { survey_id: string }
}

export const updateSurveyDefinition = async ({
  adminToken,
  surveyId,
  sections,
}: StaffRequestParams & { surveyId: string; sections: SurveyDefinition['sections'] }) => {
  const response = await fetch('/.netlify/functions/staffSurveyDefinitionUpdate', {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken,
    },
    body: JSON.stringify({ survey_id: surveyId, sections }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update survey structure')
  }

  return (await response.json()) as { survey_id: string }
}
