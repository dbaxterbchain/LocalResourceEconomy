export type CohortSummary = {
  id: string
  study_id: string
  name: string
  status: string
  starts_at: string | null
  ends_at: string | null
  created_at: string
  study_name: string | null
}

export type CohortDetail = {
  cohort: {
    id: string
    study_id: string
    name: string
    status: string
    starts_at: string | null
    ends_at: string | null
    notes: string | null
    created_at: string
  }
  study: {
    id: string
    name: string
    host_name: string
  }
  surveys: Array<{
    id: string
    name: string
    status: string
    is_template: boolean
  }>
  links: Array<{
    id: string
    survey_id: string
    cohort_id: string
    public_slug: string
    status: string
    opens_at: string | null
    closes_at: string | null
  }>
}

export type SurveyLinkDetail = {
  study: { id: string; name: string; host_name: string }
  cohort: { id: string; name: string; status: string; study_id: string }
  survey: { id: string; name: string; status: string; study_id: string }
  link: {
    id: string
    survey_id: string
    cohort_id: string
    public_slug: string
    status: string
    opens_at: string | null
    closes_at: string | null
  } | null
}

type StaffRequestParams = {
  adminToken: string
}

export const fetchStaffCohorts = async ({
  adminToken,
  studyId,
}: StaffRequestParams & { studyId?: string }) => {
  const url = new URL('/.netlify/functions/staffCohorts', window.location.origin)
  if (studyId) {
    url.searchParams.set('study_id', studyId)
  }

  const response = await fetch(url.toString(), {
    headers: { 'x-admin-token': adminToken },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch cohorts')
  }

  const payload = (await response.json()) as { cohorts: CohortSummary[] }
  return payload.cohorts
}

export const createCohort = async ({
  adminToken,
  payload,
}: StaffRequestParams & { payload: Record<string, unknown> }) => {
  const response = await fetch('/.netlify/functions/staffCohortCreate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create cohort')
  }

  const data = (await response.json()) as { cohort_id: string }
  return data.cohort_id
}

export const fetchCohortDetail = async ({
  adminToken,
  cohortId,
}: StaffRequestParams & { cohortId: string }) => {
  const url = new URL('/.netlify/functions/staffCohortDetail', window.location.origin)
  url.searchParams.set('cohort_id', cohortId)

  const response = await fetch(url.toString(), {
    headers: { 'x-admin-token': adminToken },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch cohort detail')
  }

  return (await response.json()) as CohortDetail
}

export const fetchSurveyLink = async ({
  adminToken,
  cohortId,
  surveyId,
}: StaffRequestParams & { cohortId: string; surveyId: string }) => {
  const url = new URL('/.netlify/functions/staffSurveyLink', window.location.origin)
  url.searchParams.set('cohort_id', cohortId)
  url.searchParams.set('survey_id', surveyId)

  const response = await fetch(url.toString(), {
    headers: { 'x-admin-token': adminToken },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch survey link')
  }

  return (await response.json()) as SurveyLinkDetail
}

export const createSurveyLink = async ({
  adminToken,
  payload,
}: StaffRequestParams & { payload: Record<string, unknown> }) => {
  const response = await fetch('/.netlify/functions/staffSurveyLink', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to create survey link')
  }

  return (await response.json()) as SurveyLinkDetail
}

export const updateSurveyLink = async ({
  adminToken,
  payload,
}: StaffRequestParams & { payload: Record<string, unknown> }) => {
  const response = await fetch('/.netlify/functions/staffSurveyLink', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': adminToken,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to update survey link')
  }

  return (await response.json()) as SurveyLinkDetail
}
