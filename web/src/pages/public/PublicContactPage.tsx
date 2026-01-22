import { useState } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { Alert, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material'
import PlaceholderPage from '../../components/PlaceholderPage'
import { usePublicSurveyBundle } from '../../lib/usePublicSurveyBundle'
import { useSurveySession } from '../../lib/surveySession'
import { submitSurvey } from '../../lib/submitSurvey'

export default function PublicContactPage() {
  const { surveySlug } = useParams()
  const navigate = useNavigate()
  const { data, error, loading } = usePublicSurveyBundle(surveySlug)
  const { session, setContactInfo, clearSession } = useSurveySession(surveySlug)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!surveySlug) {
    return <PlaceholderPage title="Survey not found" description="Missing survey slug." />
  }

  if (loading) {
    return <PlaceholderPage title="Loading contact..." description="Fetching survey details." />
  }

  if (error || !data) {
    return (
      <PlaceholderPage
        title="Survey unavailable"
        description="This survey link is closed or does not exist."
      />
    )
  }

  if (!session) {
    return <PlaceholderPage title="Survey not started" description="No responses yet." />
  }

  if (data.survey.contact_info_placement !== 'end') {
    navigate(`/${surveySlug}/review`, { replace: true })
    return null
  }

  const isRequired = data.survey.contact_info_mode === 'required'

  const handleSubmit = async (skipContact: boolean) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const sessionToSubmit = skipContact
        ? {
            ...session,
            contact_info: {
              contact_name: '',
              contact_email: '',
              contact_phone: '',
              business_name: '',
            },
          }
        : session

      await submitSurvey(data, sessionToSubmit)
      clearSession()
      navigate(`/${surveySlug}/thank-you`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  const hasRequiredInfo =
    session.contact_info.contact_name.trim().length > 0 &&
    session.contact_info.contact_email.trim().length > 0

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 6 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2}>
          <Typography variant="h2">Contact info</Typography>
          <Typography color="text.secondary">
            {isRequired
              ? 'Please provide contact information to finish the survey.'
              : 'Optional: leave contact info for follow-up.'}
          </Typography>

          {!isRequired ? (
            <Alert severity="info">You can skip this step if you prefer.</Alert>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSubmit(false)
            }}
          >
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={session.contact_info.contact_name}
                onChange={(event) => setContactInfo({ contact_name: event.target.value })}
                required={isRequired}
              />
              <TextField
                label="Email"
                value={session.contact_info.contact_email}
                onChange={(event) => setContactInfo({ contact_email: event.target.value })}
                required={isRequired}
              />
              <TextField
                label="Phone"
                value={session.contact_info.contact_phone}
                onChange={(event) => setContactInfo({ contact_phone: event.target.value })}
              />
              <TextField
                label="Business name"
                value={session.contact_info.business_name}
                onChange={(event) => setContactInfo({ business_name: event.target.value })}
              />

              {submitError ? <Alert severity="error">{submitError}</Alert> : null}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={submitting || (isRequired && !hasRequiredInfo)}
                >
                  {submitting ? 'Submitting...' : 'Submit survey'}
                </Button>
                {!isRequired ? (
                  <Button
                    variant="outlined"
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={submitting}
                  >
                    Skip contact info
                  </Button>
                ) : null}
                <Button variant="text" component={RouterLink} to={`/${surveySlug}/review`}>
                  Back to review
                </Button>
              </Stack>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  )
}
