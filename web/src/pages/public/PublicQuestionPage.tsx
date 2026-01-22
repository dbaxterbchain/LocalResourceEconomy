import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  FormGroup,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PlaceholderPage from '../../components/PlaceholderPage'
import { usePublicSurveyBundle } from '../../lib/usePublicSurveyBundle'
import {
  getFlowSections,
  getSectionById,
  getSectionQuestions,
  getRepeatGroupKey,
  getCompletedSectionIds,
} from '../../lib/surveyFlow'
import { useSurveySession } from '../../lib/surveySession'
import SurveySectionStepper from '../../components/SurveySectionStepper'

type SelectOption = {
  id: string
  value: string
  label: string
  sort_order: number
}

export default function PublicQuestionPage() {
  const { surveySlug, sectionId, questionId, repeatIndex } = useParams()
  const navigate = useNavigate()
  const { data, error, loading } = usePublicSurveyBundle(surveySlug)
  const { getAnswer, setAnswer, getRepeatCount, session } = useSurveySession(surveySlug)
  const [otherValue, setOtherValue] = useState('')

  const section = data && sectionId ? getSectionById(data, sectionId) : null
  const questions = getSectionQuestions(section)
  const questionIndex = questionId ? questions.findIndex((q) => q.id === questionId) : -1
  const question = questionIndex >= 0 ? questions[questionIndex] : null
  const groupKey = getRepeatGroupKey(section)
  const repeatIndexNumber = repeatIndex ? Number.parseInt(repeatIndex, 10) || 0 : 0
  const repeatCount = groupKey ? getRepeatCount(groupKey) : 1
  const answer = question ? getAnswer(question.id, repeatIndexNumber) : undefined

  useEffect(() => {
    setOtherValue(answer?.other ?? '')
  }, [answer?.other])

  const allowOtherDetail = Boolean(question?.config_json?.['allow_other_detail'])
  const showOtherInput = useMemo(() => {
    if (!allowOtherDetail || !question) {
      return false
    }
    if (question.type === 'multiselect' && Array.isArray(answer?.value)) {
      return answer.value.includes('other')
    }
    return answer?.value === 'other'
  }, [allowOtherDetail, answer?.value, question])

  const options = ((question?.options ?? []) as SelectOption[]).sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  const nextPath = useMemo(() => {
    if (!surveySlug || !sectionId || !question) {
      return '/'
    }

    if (questionIndex < questions.length - 1) {
      const nextQuestion = questions[questionIndex + 1]
      return `/${surveySlug}/section/${sectionId}/item/${repeatIndexNumber}/question/${nextQuestion.id}`
    }

    if (groupKey) {
      if (repeatIndexNumber < repeatCount - 1) {
        const firstQuestion = questions[0]
        return `/${surveySlug}/section/${sectionId}/item/${repeatIndexNumber + 1}/question/${firstQuestion.id}`
      }

      return `/${surveySlug}/section/${sectionId}/items`
    }

    if (data) {
      const flowSections = getFlowSections(data)
      const sectionIndex = flowSections.findIndex((s) => s.id === sectionId)
      const nextSection = flowSections[sectionIndex + 1]
      if (nextSection) {
        return `/${surveySlug}/section/${nextSection.id}/intro`
      }
    }

    return `/${surveySlug}/review`
  }, [data, groupKey, question, questionIndex, questions, repeatCount, repeatIndexNumber, sectionId, surveySlug])

  const prevPath = useMemo(() => {
    if (!surveySlug || !sectionId || !question) {
      return '/'
    }

    if (questionIndex > 0) {
      const prevQuestion = questions[questionIndex - 1]
      return `/${surveySlug}/section/${sectionId}/item/${repeatIndexNumber}/question/${prevQuestion.id}`
    }

    if (groupKey && repeatIndexNumber > 0) {
      const lastQuestion = questions[questions.length - 1]
      return `/${surveySlug}/section/${sectionId}/item/${repeatIndexNumber - 1}/question/${lastQuestion.id}`
    }

    return `/${surveySlug}/section/${sectionId}/items`
  }, [groupKey, question, questionIndex, questions, repeatIndexNumber, sectionId, surveySlug])

  const saveAnswer = (value: string | string[], other?: string) => {
    if (!question) {
      return
    }
    setAnswer(question.id, repeatIndexNumber, { value, other })
  }

  const renderInput = () => {
    if (!question) {
      return null
    }

    if (question.type === 'info') {
      return (
        <Alert severity="info">
          This step is informational. No response is needed.
        </Alert>
      )
    }

    if (question.type === 'longtext') {
      return (
        <TextField
          multiline
          minRows={5}
          value={typeof answer?.value === 'string' ? answer.value : ''}
          onChange={(event) => saveAnswer(event.target.value, otherValue)}
          fullWidth
        />
      )
    }

    if (question.type === 'number') {
      return (
        <TextField
          type="number"
          value={typeof answer?.value === 'string' ? answer.value : ''}
          onChange={(event) => saveAnswer(event.target.value, otherValue)}
          fullWidth
        />
      )
    }

    if (question.type === 'select') {
      return (
        <TextField
          select
          value={typeof answer?.value === 'string' ? answer.value : ''}
          onChange={(event) => saveAnswer(event.target.value, otherValue)}
          fullWidth
        >
          <MenuItem value="">Select...</MenuItem>
          {options.map((option) => (
            <MenuItem key={option.id} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    if (question.type === 'multiselect') {
      const values = Array.isArray(answer?.value) ? answer?.value : []
      return (
        <FormGroup>
          <Stack spacing={1}>
            {options.map((option) => (
              <FormControlLabel
                key={option.id}
                control={
                  <Checkbox
                    checked={values.includes(option.value)}
                    onChange={(event) => {
                      const nextValues = event.target.checked
                        ? [...values, option.value]
                        : values.filter((value) => value !== option.value)
                      saveAnswer(nextValues, otherValue)
                    }}
                  />
                }
                label={option.label}
              />
            ))}
          </Stack>
        </FormGroup>
      )
    }

    return (
      <TextField
        value={typeof answer?.value === 'string' ? answer.value : ''}
        onChange={(event) => saveAnswer(event.target.value, otherValue)}
        fullWidth
      />
    )
  }

  if (!surveySlug || !sectionId || !questionId || repeatIndex === undefined) {
    return <PlaceholderPage title="Question not found" description="Missing question info." />
  }

  if (loading) {
    return <PlaceholderPage title="Loading question..." description="Fetching survey details." />
  }

  if (error || !data) {
    return (
      <PlaceholderPage
        title="Question unavailable"
        description="This survey link is closed or does not exist."
      />
    )
  }

  if (!section || !question) {
    return <PlaceholderPage title="Question not found" description="Invalid question." />
  }

  const flowSections = getFlowSections(data)
  const completedSectionIds = getCompletedSectionIds(data, session)
  const progress = questions.length > 0 ? ((questionIndex + 1) / questions.length) * 100 : 0

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
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault()
              navigate(nextPath)
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label={groupKey ? `Item ${repeatIndexNumber + 1} of ${repeatCount}` : 'Single item'}
                  color="secondary"
                />
                <Chip label={`Question ${questionIndex + 1} of ${questions.length}`} />
              </Stack>

              <Typography variant="h2">{question.label}</Typography>
              {question.helper_text ? (
                <Typography color="text.secondary">{question.helper_text}</Typography>
              ) : null}

              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 999 }}
              />

              <Stack spacing={2}>{renderInput()}</Stack>

              {showOtherInput ? (
                <TextField
                  label="Other details"
                  value={otherValue}
                  onChange={(event) => {
                    setOtherValue(event.target.value)
                    saveAnswer(answer?.value ?? '', event.target.value)
                  }}
                  fullWidth
                />
              ) : null}

              <Alert severity="info">
                Need to jump? You can return to the item list or review at any time.
              </Alert>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button type="button" variant="outlined" onClick={() => navigate(prevPath)}>
                  Back
                </Button>
                <Button type="submit" variant="contained">
                  Next
                </Button>
                <Button
                  type="button"
                  variant="text"
                  onClick={() => navigate(`/${surveySlug}/section/${sectionId}/items`)}
                >
                  Item list
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Stack>
    </Container>
  )
}
