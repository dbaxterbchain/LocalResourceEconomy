import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Container, Paper, Stack, Typography } from '@mui/material'
import PlaceholderPage from '../../components/PlaceholderPage'
import { usePublicSurveyBundle } from '../../lib/usePublicSurveyBundle'
import {
  getSectionById,
  getRepeatGroupKey,
  getMaxItemsForGroup,
  getMinItemsForGroup,
  getSectionGuide,
  getFlowSections,
  getCompletedSectionIds,
} from '../../lib/surveyFlow'
import { useSurveySession } from '../../lib/surveySession'
import SurveySectionStepper from '../../components/SurveySectionStepper'

export default function PublicSectionIntroPage() {
  const { surveySlug, sectionId } = useParams()
  const navigate = useNavigate()
  const { data, error, loading } = usePublicSurveyBundle(surveySlug)
  const { getRepeatCount, setRepeatCount, session } = useSurveySession(surveySlug)

  if (!surveySlug || !sectionId) {
    return <PlaceholderPage title="Section not found" description="Missing section info." />
  }

  if (loading) {
    return <PlaceholderPage title="Loading section..." description="Fetching survey details." />
  }

  if (error || !data) {
    return (
      <PlaceholderPage
        title="Section unavailable"
        description="This survey link is closed or does not exist."
      />
    )
  }

  const section = getSectionById(data, sectionId)
  if (!section) {
    return <PlaceholderPage title="Section not found" description="Invalid section." />
  }

  const groupKey = getRepeatGroupKey(section)
  if (groupKey) {
    const count = getRepeatCount(groupKey)
    const minItems = getMinItemsForGroup(section)
    if (count < minItems) {
      setRepeatCount(groupKey, minItems)
    }
  }

  const firstQuestionId =
    section.questions?.find((question) => question.type !== 'info')?.id ??
    section.questions?.[0]?.id ??
    ''
  const startPath = groupKey
    ? `/${surveySlug}/section/${sectionId}/items`
    : `/${surveySlug}/section/${sectionId}/item/0/question/${firstQuestionId}`

  const maxItems = groupKey ? getMaxItemsForGroup(section) : null
  const guide = getSectionGuide(section.title)
  const flowSections = getFlowSections(data)
  const completedSectionIds = getCompletedSectionIds(data, session)

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <SurveySectionStepper
          surveySlug={surveySlug}
          sections={flowSections}
          activeSectionId={sectionId}
          completedSectionIds={completedSectionIds}
        />

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="h2">{section.title}</Typography>
            {guide ? (
              <>
                <Typography color="text.secondary">{guide.summary}</Typography>
                <Alert severity="info">Examples: {guide.examples.join(', ')}</Alert>
                {guide.tip ? (
                  <Typography variant="body2" color="text.secondary">
                    Tip: {guide.tip}
                  </Typography>
                ) : null}
              </>
            ) : null}

            {groupKey ? (
              <Typography color="text.secondary">
                You can add up to {maxItems} items in this section.
              </Typography>
            ) : null}

            <Stack
              component="form"
              onSubmit={(event) => {
                event.preventDefault()
                navigate(startPath)
              }}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
            >
              <Button type="submit" variant="contained">
                Start section
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate(`/${surveySlug}/review`)}
              >
                Jump to review
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
