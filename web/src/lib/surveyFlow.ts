import type { PublicSurveyBundle } from '../types/publicSurvey'
import type { AnswerValue, SurveySession } from './surveySession'

const DEFAULT_MAX_ITEMS: Record<string, number> = {
  purchases: 10,
  waste_streams: 7,
}

type SurveySection = NonNullable<PublicSurveyBundle['sections']>[number]
type SurveyQuestion = NonNullable<SurveySection['questions']>[number]
type RepeatGroup = NonNullable<SurveySection['repeat_groups']>[number]

type SectionGuide = {
  summary: string
  examples: string[]
  tip?: string
}

const SECTION_GUIDES: Array<{ match: RegExp; guide: SectionGuide }> = [
  {
    match: /purchase/i,
    guide: {
      summary: 'List your top purchases by volume or cost. Think about the supplies you restock most.',
      examples: ['Coffee beans', 'Milk', 'Cups/lids', 'Syrups', 'Cleaning supplies'],
      tip: "Don't worry about perfect units - approximate values are fine.",
    },
  },
  {
    match: /dispose|waste/i,
    guide: {
      summary:
        'List your main waste streams by volume or space in your bins. Focus on what fills up fastest.',
      examples: ['Coffee grounds', 'Cardboard', 'Plastic cups', 'Food waste', 'Milk cartons'],
      tip: "If multiple methods are used, choose 'multiple' and note details.",
    },
  },
]

export const getFlowSections = (bundle: PublicSurveyBundle) => {
  return (
    bundle.sections?.filter((section) => {
      if (!section.questions || section.questions.length === 0) {
        return false
      }

      const isContactSection = section.title.toLowerCase().includes('contact')
      return !isContactSection
    }) ?? []
  )
}

export const getSectionById = (bundle: PublicSurveyBundle, sectionId?: string) => {
  if (!sectionId) {
    return null
  }
  return bundle.sections?.find((section) => section.id === sectionId) ?? null
}

export const getSectionQuestions = (section: SurveySection | null) => {
  if (!section?.questions) {
    return []
  }
  return [...section.questions].sort((a, b) => a.sort_order - b.sort_order)
}

export const getRepeatGroup = (section: SurveySection | null): RepeatGroup | null => {
  const groups = section?.repeat_groups ?? []
  if (!groups.length) {
    return null
  }
  return [...groups].sort((a, b) => a.sort_order - b.sort_order)[0] ?? null
}

export const getRepeatGroupKey = (section: SurveySection | null): string | null => {
  const group = getRepeatGroup(section)
  if (group?.repeat_group_key) {
    return group.repeat_group_key
  }
  const questions = getSectionQuestions(section)
  const withKey = questions.find((question) => question.repeat_group_key)
  return withKey?.repeat_group_key ?? null
}

export const getMaxItemsForGroup = (section: SurveySection | null) => {
  const group = getRepeatGroup(section)
  if (!group) {
    return 1
  }
  return group.max_items ?? DEFAULT_MAX_ITEMS[group.repeat_group_key] ?? 10
}

export const getMinItemsForGroup = (section: SurveySection | null) => {
  const group = getRepeatGroup(section)
  if (!group) {
    return 1
  }
  return group.min_items ?? 1
}

const hasAnswerValue = (answer: AnswerValue | undefined, allowOtherDetail: boolean) => {
  if (!answer) {
    return false
  }

  const value = answer.value
  const hasValue = Array.isArray(value)
    ? value.length > 0
    : Boolean(value && String(value).trim().length > 0)

  if (!hasValue) {
    return false
  }

  if (allowOtherDetail) {
    const needsOther = (Array.isArray(value) && value.includes('other')) || value === 'other'
    if (needsOther) {
      return Boolean(answer.other && answer.other.trim().length > 0)
    }
  }

  return true
}

export const getSectionRepeatCount = (section: SurveySection, session: SurveySession | null) => {
  const groupKey = getRepeatGroupKey(section)
  if (!groupKey || !session) {
    return 1
  }
  return session.repeat_counts[groupKey] ?? 1
}

export const isQuestionComplete = (
  session: SurveySession | null,
  question: SurveyQuestion,
  repeatIndex: number,
) => {
  if (question.type === 'info') {
    return true
  }
  if (!session) {
    return false
  }
  const allowOtherDetail = Boolean(question.config_json?.['allow_other_detail'])
  const key = `${question.id}:${repeatIndex}`
  return hasAnswerValue(session.answers[key], allowOtherDetail)
}

export const isSectionComplete = (section: SurveySection, session: SurveySession | null) => {
  const requiredQuestions = getSectionQuestions(section).filter((question) => question.required)

  if (requiredQuestions.length === 0) {
    return true
  }

  const repeatCount = getSectionRepeatCount(section, session)
  for (let index = 0; index < repeatCount; index += 1) {
    const allAnswered = requiredQuestions.every((question) =>
      isQuestionComplete(session, question, index),
    )
    if (!allAnswered) {
      return false
    }
  }

  return true
}

export const getSectionGuide = (sectionTitle: string): SectionGuide | null => {
  const match = SECTION_GUIDES.find((entry) => entry.match.test(sectionTitle))
  return match?.guide ?? null
}

export const getCompletedSectionIds = (
  bundle: PublicSurveyBundle,
  session: SurveySession | null,
) => {
  if (!bundle.sections) {
    return []
  }
  return getFlowSections(bundle)
    .filter((section) => isSectionComplete(section, session))
    .map((section) => section.id)
}
