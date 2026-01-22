type StaffResponsesParams = {
  adminToken: string
  filters?: {
    slug?: string
    studyId?: string
    surveyId?: string
    cohortId?: string
    status?: 'submitted' | 'draft'
    search?: string
    from?: string
    to?: string
  }
}

type StaffResponseDetailParams = {
  responseId: string
  adminToken: string
}

export type StaffResponseRow = {
  id: string
  submitted_at: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  business_name: string | null
  survey_id: string
  cohort_id: string
  survey_link_id: string
}

export type StaffResponseDetail = {
  id: string
  submitted_at: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  business_name: string | null
  survey_id: string
  cohort_id: string
  response_items: Array<{
    id: string
    question_id: string
    repeat_index: number
    value_text: string | null
    value_number: number | null
    value_json: Record<string, unknown> | null
    survey_questions: {
      label: string
      type: string
    } | null
  }>
  response_audit_log: Array<{
    id: string
    edited_at: string
    editor_id: string
    field_path: string
    old_value: Record<string, unknown> | null
    new_value: Record<string, unknown> | null
    reason: string
  }>
}

export const fetchStaffResponses = async ({ adminToken, filters }: StaffResponsesParams) => {
  const url = new URL('/.netlify/functions/staffResponses', window.location.origin)
  if (filters?.slug) {
    url.searchParams.set('slug', filters.slug)
  }
  if (filters?.studyId) {
    url.searchParams.set('study_id', filters.studyId)
  }
  if (filters?.surveyId) {
    url.searchParams.set('survey_id', filters.surveyId)
  }
  if (filters?.cohortId) {
    url.searchParams.set('cohort_id', filters.cohortId)
  }
  if (filters?.status) {
    url.searchParams.set('status', filters.status)
  }
  if (filters?.search) {
    url.searchParams.set('search', filters.search)
  }
  if (filters?.from) {
    url.searchParams.set('from', filters.from)
  }
  if (filters?.to) {
    url.searchParams.set('to', filters.to)
  }

  const response = await fetch(url.toString(), {
    headers: {
      'x-admin-token': adminToken,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch responses')
  }

  const payload = (await response.json()) as { responses: StaffResponseRow[] }
  return payload.responses
}

export const exportStaffResponsesCsv = async ({
  adminToken,
  filters,
}: StaffResponsesParams) => {
  const url = new URL('/.netlify/functions/staffResponsesExport', window.location.origin)
  if (filters?.slug) {
    url.searchParams.set('slug', filters.slug)
  }
  if (filters?.studyId) {
    url.searchParams.set('study_id', filters.studyId)
  }
  if (filters?.surveyId) {
    url.searchParams.set('survey_id', filters.surveyId)
  }
  if (filters?.cohortId) {
    url.searchParams.set('cohort_id', filters.cohortId)
  }
  if (filters?.status) {
    url.searchParams.set('status', filters.status)
  }
  if (filters?.search) {
    url.searchParams.set('search', filters.search)
  }
  if (filters?.from) {
    url.searchParams.set('from', filters.from)
  }
  if (filters?.to) {
    url.searchParams.set('to', filters.to)
  }

  const response = await fetch(url.toString(), {
    headers: {
      'x-admin-token': adminToken,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to export responses')
  }

  return await response.text()
}

export const fetchStaffResponseDetail = async ({
  responseId,
  adminToken,
}: StaffResponseDetailParams) => {
  const response = await fetch(
    `/.netlify/functions/staffResponseDetail?response_id=${encodeURIComponent(responseId)}`,
    {
      headers: {
        'x-admin-token': adminToken,
      },
    },
  )

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch response detail')
  }

  const payload = (await response.json()) as { response: StaffResponseDetail }
  return payload.response
}
