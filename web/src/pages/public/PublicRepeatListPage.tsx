import { useEffect } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import PlaceholderPage from '../../components/PlaceholderPage'
import { usePublicSurveyBundle } from '../../lib/usePublicSurveyBundle'
import {
  getFlowSections,
  getMaxItemsForGroup,
  getMinItemsForGroup,
  getRepeatGroupKey,
  getSectionById,
  getCompletedSectionIds,
} from '../../lib/surveyFlow'
import { useSurveySession } from '../../lib/surveySession'
import SurveySectionStepper from '../../components/SurveySectionStepper'

export default function PublicRepeatListPage() {
  const { surveySlug, sectionId } = useParams()
  const { data, error, loading } = usePublicSurveyBundle(surveySlug)
  const { getRepeatCount, setRepeatCount, session } = useSurveySession(surveySlug)
  const section = data && sectionId ? getSectionById(data, sectionId) : null
  const groupKey = section ? getRepeatGroupKey(section) : null
  const count = groupKey ? getRepeatCount(groupKey) : 1
  const maxItems = section ? getMaxItemsForGroup(section) : 1
  const minItems = section ? getMinItemsForGroup(section) : 1

  useEffect(() => {
    if (groupKey && count < minItems) {
      setRepeatCount(groupKey, minItems)
    }
  }, [count, groupKey, minItems, setRepeatCount])

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

  if (!section) {
    return <PlaceholderPage title="Section not found" description="Invalid section." />
  }

  if (!groupKey) {
    return <PlaceholderPage title="Section not repeatable" description="No repeat group found." />
  }

  const flowSections = getFlowSections(data)
  const completedSectionIds = getCompletedSectionIds(data, session ?? null)

  const questions = section.questions ?? []
  const groupQuestions = questions.filter((question) => question.repeat_group_key === groupKey)
  const repeatQuestions = groupQuestions.length > 0 ? groupQuestions : questions
  const firstQuestionId =
    repeatQuestions.find((question) => question.type !== 'info')?.id ??
    repeatQuestions[0]?.id
  const requiredQuestions = repeatQuestions.filter((question) => question.required)

  const isAnswerComplete = (questionId: string, index: number, allowOtherDetail: boolean) => {
    const answer = session?.answers?.[`${questionId}:${index}`]
    const value = answer?.value
    const hasValue = Array.isArray(value)
      ? value.length > 0
      : Boolean(value && String(value).trim().length > 0)

    if (!hasValue) {
      return false
    }

    if (allowOtherDetail) {
      const needsOther =
        (Array.isArray(value) && value.includes('other')) || value === 'other'
      if (needsOther) {
        return Boolean(answer?.other && answer.other.trim().length > 0)
      }
    }

    return true
  }

  const isItemComplete = (index: number) =>
    requiredQuestions.every((question) =>
      isAnswerComplete(
        question.id,
        index,
        Boolean(question.config_json?.['allow_other_detail']),
      ),
    )

  const allItemsComplete =
    requiredQuestions.length === 0 || Array.from({ length: count }).every((_, index) => isItemComplete(index))

  const firstIncompleteIndex = requiredQuestions.length === 0
    ? 0
    : Array.from({ length: count }).findIndex((_, index) => !isItemComplete(index))

  const sectionIndex = flowSections.findIndex((flowSection) => flowSection.id === sectionId)
  const nextSection = flowSections[sectionIndex + 1]
  const nextSectionPath = nextSection
    ? `/${surveySlug}/section/${nextSection.id}/intro`
    : `/${surveySlug}/review`

  const continuePath = allItemsComplete
    ? nextSectionPath
    : firstQuestionId
      ? `/${surveySlug}/section/${sectionId}/item/${Math.max(0, firstIncompleteIndex)}/question/${firstQuestionId}`
      : `/${surveySlug}/review`

  const continueLabel = allItemsComplete
    ? nextSection
      ? 'Continue to next section'
      : 'Continue to review'
    : 'Continue item'

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
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h2">{section.title}</Typography>
              <Chip label={`${count}/${maxItems} items`} color="secondary" />
            </Stack>
            <Typography color="text.secondary">
              Add {minItems === maxItems ? minItems : `${minItems}-${maxItems}`} items.
            </Typography>

            <List sx={{ display: 'grid', gap: 1 }}>
              {Array.from({ length: count }).map((_, index) => {
                const summary =
                  firstQuestionId && session?.answers
                    ? session.answers[`${firstQuestionId}:${index}`]?.value
                    : undefined
                const summaryText = Array.isArray(summary)
                  ? summary.join(', ')
                  : summary && String(summary).trim()
                    ? String(summary)
                    : 'Unnamed item'

                return (
                  <ListItem
                    key={index}
                    component={Paper}
                    sx={{ px: 2, py: 1.5, borderRadius: 1 }}
                    secondaryAction={
                      firstQuestionId ? (
                        <Button
                          variant="outlined"
                          component={RouterLink}
                          to={`/${surveySlug}/section/${sectionId}/item/${index}/question/${firstQuestionId}`}
                        >
                          Edit
                        </Button>
                      ) : null
                    }
                  >
                    <ListItemText
                      primary={`Item ${index + 1}`}
                      secondary={summaryText}
                    />
                  </ListItem>
                )
              })}
            </List>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => setRepeatCount(groupKey, Math.min(maxItems, count + 1))}
                  disabled={count >= maxItems}
                >
                  Add item
                </Button>
                {count > 1 ? (
                  <Button
                    variant="outlined"
                    onClick={() => setRepeatCount(groupKey, Math.max(minItems, count - 1))}
                    disabled={count <= minItems}
                  >
                    Remove last item
                  </Button>
                ) : null}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="text" component={RouterLink} to={`/${surveySlug}/review`}>
                  Jump to review
                </Button>
                {firstQuestionId ? (
                  <Button variant="contained" component={RouterLink} to={continuePath}>
                    {continueLabel}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
