type StaffSurveyBundleParams = {
  slug: string
  adminToken: string
}

export const fetchStaffSurveyBundle = async ({ slug, adminToken }: StaffSurveyBundleParams) => {
  const response = await fetch(`/.netlify/functions/staffSurveyBundle?slug=${encodeURIComponent(slug)}`, {
    headers: {
      'x-admin-token': adminToken,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Failed to fetch staff survey bundle')
  }

  return response.json()
}
