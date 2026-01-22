import { Stack, Step, StepButton, Stepper, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

type SurveySectionStepperProps = {
  surveySlug: string
  sections: Array<{ id: string; title: string }>
  activeSectionId?: string | null
  includeReview?: boolean
  reviewLabel?: string
  completedSectionIds?: string[]
  showCompletionLabel?: boolean
}

export default function SurveySectionStepper({
  surveySlug,
  sections,
  activeSectionId,
  includeReview = true,
  reviewLabel = 'Review & submit',
  completedSectionIds = [],
  showCompletionLabel = true,
}: SurveySectionStepperProps) {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const steps = includeReview
    ? [...sections, { id: 'review', title: reviewLabel }]
    : sections
  const completedSet = new Set(completedSectionIds)
  const allSectionsComplete =
    sections.length > 0 && sections.every((section) => completedSet.has(section.id))
  const activeStep = Math.max(
    0,
    steps.findIndex((section) => section.id === activeSectionId),
  )

  return (
    <Stepper
      nonLinear
      activeStep={activeStep}
      orientation={isMobile ? 'vertical' : 'horizontal'}
      alternativeLabel={!isMobile}
      sx={{
        px: 2,
        py: 1,
        borderRadius: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(31, 35, 40, 0.08)',
      }}
    >
      {steps.map((section) => {
        const isReview = section.id === 'review'
        const isCompleted = isReview ? allSectionsComplete : completedSet.has(section.id)
        return (
          <Step key={section.id} completed={isCompleted}>
            <StepButton
              onClick={() =>
                navigate(
                  isReview
                    ? `/${surveySlug}/review`
                    : `/${surveySlug}/section/${section.id}/intro`,
                )
              }
            >
              <Stack spacing={0.25} alignItems={isMobile ? 'flex-start' : 'center'}>
                <Typography variant="body2">{section.title}</Typography>
                {showCompletionLabel && isCompleted ? (
                  <Typography variant="caption" color="success.main">
                    Done
                  </Typography>
                ) : null}
              </Stack>
            </StepButton>
          </Step>
        )
      })}
    </Stepper>
  )
}
