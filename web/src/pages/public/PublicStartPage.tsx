import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import { usePublicSurveyBundle } from '../../lib/usePublicSurveyBundle'
import { getFlowSections } from '../../lib/surveyFlow'
import { useSurveySession } from '../../lib/surveySession'
import PlaceholderPage from '../../components/PlaceholderPage'

export default function PublicStartPage() {
  const { surveySlug } = useParams()
  const navigate = useNavigate()
  const { data, error, loading } = usePublicSurveyBundle(surveySlug)
  const { session, setContactInfo, ensureSession } = useSurveySession(surveySlug)

  if (!surveySlug) {
    return <PlaceholderPage title="Survey not found" description="Missing survey slug." />
  }

  if (loading) {
    return <PlaceholderPage title="Loading survey..." description="Fetching survey details." />
  }

  if (error || !data) {
    return (
      <PlaceholderPage
        title="Survey unavailable"
        description="This survey link is closed or does not exist."
      />
    )
  }

  ensureSession(surveySlug)

  const flowSections = getFlowSections(data)
  const firstSection = flowSections[0]
  const nextPath = firstSection
    ? `/${surveySlug}/section/${firstSection.id}/intro`
    : `/${surveySlug}/review`

  if (data.survey.contact_info_placement !== 'start') {
    navigate(nextPath, { replace: true })
    return null
  }

  const isRequired = data.survey.contact_info_mode === 'required'

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 6 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2}>
          <Typography variant="h2">Contact info</Typography>
          <Typography color="text.secondary">
            Provide contact details so the research team can follow up if needed.
          </Typography>
          {!isRequired ? (
            <Alert severity="info">Contact info is optional for this survey.</Alert>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              navigate(nextPath)
            }}
          >
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={session?.contact_info.contact_name ?? ''}
                onChange={(event) => setContactInfo({ contact_name: event.target.value })}
                required={isRequired}
                fullWidth
              />
              <TextField
                label="Email"
                value={session?.contact_info.contact_email ?? ''}
                onChange={(event) => setContactInfo({ contact_email: event.target.value })}
                required={isRequired}
                fullWidth
              />
              <TextField
                label="Phone"
                value={session?.contact_info.contact_phone ?? ''}
                onChange={(event) => setContactInfo({ contact_phone: event.target.value })}
                fullWidth
              />
              <TextField
                label="Business name"
                value={session?.contact_info.business_name ?? ''}
                onChange={(event) => setContactInfo({ business_name: event.target.value })}
                fullWidth
              />
              <Button type="submit" variant="contained">
                Continue
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  )
}
