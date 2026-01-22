import { Link as RouterLink, useParams } from 'react-router-dom'
import { Alert, Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material'
import PlaceholderPage from '../../components/PlaceholderPage'
import { usePublicSurveyBundle } from '../../lib/usePublicSurveyBundle'
import { getFlowSections } from '../../lib/surveyFlow'

export default function PublicLandingPage() {
  const { surveySlug } = useParams()
  const { data, error, loading } = usePublicSurveyBundle(surveySlug)

  if (!surveySlug) {
    return <PlaceholderPage title="Survey not found" description="Missing survey slug." />
  }

  if (loading) {
    return <PlaceholderPage title="Loading survey..." description="Fetching survey details." />
  }

  if (error) {
    return (
      <PlaceholderPage
        title="Survey unavailable"
        description={`We could not load this survey. ${error}`}
      />
    )
  }

  if (!data) {
    return (
      <PlaceholderPage
        title="Survey unavailable"
        description="This survey link is closed or does not exist."
      />
    )
  }

  const flowSections = getFlowSections(data)
  const firstSection = flowSections[0]
  const startPath =
    data.survey.contact_info_placement === 'start'
      ? `/${surveySlug}/start`
      : firstSection
        ? `/${surveySlug}/section/${firstSection.id}/intro`
        : `/${surveySlug}/review`

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip label="Open survey" color="success" />
              <Typography variant="body2" color="text.secondary">
                Hosted by {data.study.host_name}
              </Typography>
            </Box>
            <Typography variant="h1">{data.study.name}</Typography>
            <Typography variant="h4" color="text.secondary">
              {data.survey.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cohort: {data.cohort.name}
            </Typography>

            {data.study.description ? (
              <Typography>{data.study.description}</Typography>
            ) : null}
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="h3">Before you begin</Typography>
            <Typography color="text.secondary">
              This survey collects a quick snapshot of the materials you buy and dispose of so the
              team can map resource flows. Approximate values are great.
            </Typography>
            <Alert severity="info">
              You can pause at any time. Most participants finish in 8-12 minutes.
            </Alert>
            <Stack spacing={1}>
              <Typography variant="subtitle1">What to have ready</Typography>
              <Typography color="text.secondary">
                Your top purchases (volume or cost), waste streams, and who supplies/hauls them.
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="h3">Consent</Typography>
            <Typography color="text.secondary">
              By continuing, you agree to participate in this study. You can skip any question and
              stop at any time.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" component={RouterLink} to={startPath}>
                Start survey
              </Button>
              <Button variant="outlined" component={RouterLink} to={`/${surveySlug}/review`}>
                Jump to review
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}

