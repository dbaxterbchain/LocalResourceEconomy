import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Button,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import PlaceholderPage from '../../components/PlaceholderPage'
import { usePublicSurveyBundle } from '../../lib/usePublicSurveyBundle'
import {
  getCompletedSectionIds,
  getFlowSections,
  getRepeatGroupKey,
  getSectionQuestions,
} from '../../lib/surveyFlow'
import { useSurveySession } from '../../lib/surveySession'
import { submitSurvey } from '../../lib/submitSurvey'
import SurveySectionStepper from '../../components/SurveySectionStepper'

export default function PublicReviewPage() {
  const { surveySlug } = useParams()
  const navigate = useNavigate()
  const { data, error, loading } = usePublicSurveyBundle(surveySlug)
  const { session, getRepeatCount, clearSession } = useSurveySession(surveySlug)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const missingRequired = useMemo(() => {
    if (!data || !session) {
      return []
    }

    const missing: string[] = []
    const sections = getFlowSections(data)
    const answers = session.answers

    sections.forEach((section) => {
      const questions = getSectionQuestions(section)
      const groupKey = getRepeatGroupKey(section)
      const repeatCount = groupKey ? getRepeatCount(groupKey) : 1

      questions.forEach((question) => {
        if (!question.required) {
          return
        }

        for (let index = 0; index < repeatCount; index += 1) {
          const key = `${question.id}:${index}`
          const answer = answers[key]
          const hasValue = Array.isArray(answer?.value)
            ? answer.value.length > 0
            : Boolean(answer?.value && String(answer.value).trim().length > 0)

          if (!hasValue) {
            missing.push(`${section.title}: ${question.label}`)
            break
          }
        }
      })
    })

    return missing
  }, [data, getRepeatCount, session])

  const needsContactAtEnd = data?.survey.contact_info_placement === 'end'

  if (!surveySlug) {
    return <PlaceholderPage title="Survey not found" description="Missing survey slug." />
  }

  if (loading) {
    return <PlaceholderPage title="Loading review..." description="Fetching survey details." />
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

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitSurvey(data, session)
      clearSession()
      navigate(`/${surveySlug}/thank-you`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrimaryAction = async () => {
    if (needsContactAtEnd) {
      navigate(`/${surveySlug}/contact`)
      return
    }
    await handleSubmit()
  }

  const flowSections = getFlowSections(data)
  const completedSectionIds = getCompletedSectionIds(data, session)

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <SurveySectionStepper
          surveySlug={surveySlug}
          sections={flowSections}
          activeSectionId="review"
          completedSectionIds={completedSectionIds}
        />

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="h2">Review</Typography>
            <Typography color="text.secondary">
              Confirm your responses before submitting.
            </Typography>

            <Stack spacing={1}>
              <Typography>
                <strong>Study:</strong> {data.study.name}
              </Typography>
              <Typography>
                <strong>Survey:</strong> {data.survey.name}
              </Typography>
              <Typography>
                <strong>Sections:</strong> {flowSections.length}
              </Typography>
            </Stack>

            <Divider />

            {missingRequired.length > 0 ? (
              <Alert severity="warning">
                Missing required answers:
                <List dense>
                  {missingRequired.map((item) => (
                    <ListItem key={item} sx={{ py: 0 }}>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            ) : (
              <Alert severity="success">All required answers are complete.</Alert>
            )}

            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Stack
              component="form"
              onSubmit={(event) => {
                event.preventDefault()
                void handlePrimaryAction()
              }}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
            >
              <Button type="button" variant="outlined" component={RouterLink} to={`/${surveySlug}`}>
                Back to start
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || missingRequired.length > 0}
              >
                {needsContactAtEnd
                  ? 'Continue to contact info'
                  : submitting
                    ? 'Submitting...'
                    : 'Submit survey'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
