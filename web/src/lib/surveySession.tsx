import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type AnswerValue = {
  value: string | string[]
  other?: string
}

export type ContactInfo = {
  contact_name: string
  contact_email: string
  contact_phone: string
  business_name: string
}

export type SurveySession = {
  started_at: string
  contact_info: ContactInfo
  answers: Record<string, AnswerValue>
  repeat_counts: Record<string, number>
}

type SurveySessionContextValue = {
  slug: string | null
  session: SurveySession | null
  ensureSession: (slug: string) => void
  setAnswer: (questionId: string, repeatIndex: number, answer: AnswerValue) => void
  getAnswer: (questionId: string, repeatIndex: number) => AnswerValue | undefined
  setRepeatCount: (groupKey: string, count: number) => void
  getRepeatCount: (groupKey: string) => number
  setContactInfo: (info: Partial<ContactInfo>) => void
  clearSession: () => void
}

const SurveySessionContext = createContext<SurveySessionContextValue | null>(null)

const createDefaultSession = (): SurveySession => ({
  started_at: new Date().toISOString(),
  contact_info: {
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    business_name: '',
  },
  answers: {},
  repeat_counts: {},
})

const storageKey = (slug: string) => `survey-session:${slug}`

export const SurveySessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [slug, setSlug] = useState<string | null>(null)
  const [session, setSession] = useState<SurveySession | null>(null)

  const ensureSession = useCallback((nextSlug: string) => {
    if (slug === nextSlug && session) {
      return
    }

    const stored = localStorage.getItem(storageKey(nextSlug))
    const parsed = stored ? (JSON.parse(stored) as SurveySession) : createDefaultSession()
    setSlug(nextSlug)
    setSession(parsed)
  }, [slug, session])

  useEffect(() => {
    if (!slug || !session) {
      return
    }
    localStorage.setItem(storageKey(slug), JSON.stringify(session))
  }, [slug, session])

  const setAnswer = useCallback((questionId: string, repeatIndex: number, answer: AnswerValue) => {
    setSession((prev) => {
      if (!prev) {
        return prev
      }
      const key = `${questionId}:${repeatIndex}`
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [key]: answer,
        },
      }
    })
  }, [])

  const getAnswer = useCallback((questionId: string, repeatIndex: number) => {
    if (!session) {
      return undefined
    }
    const key = `${questionId}:${repeatIndex}`
    return session.answers[key]
  }, [session])

  const setRepeatCount = useCallback((groupKey: string, count: number) => {
    setSession((prev) => {
      if (!prev) {
        return prev
      }
      return {
        ...prev,
        repeat_counts: {
          ...prev.repeat_counts,
          [groupKey]: count,
        },
      }
    })
  }, [])

  const getRepeatCount = useCallback((groupKey: string) => {
    if (!session) {
      return 1
    }
    return session.repeat_counts[groupKey] ?? 1
  }, [session])

  const setContactInfo = useCallback((info: Partial<ContactInfo>) => {
    setSession((prev) => {
      if (!prev) {
        return prev
      }
      return {
        ...prev,
        contact_info: {
          ...prev.contact_info,
          ...info,
        },
      }
    })
  }, [])

  const clearSession = useCallback(() => {
    if (slug) {
      localStorage.removeItem(storageKey(slug))
    }
    setSession(null)
    setSlug(null)
  }, [slug])

  const value = useMemo(
    () => ({
      slug,
      session,
      ensureSession,
      setAnswer,
      getAnswer,
      setRepeatCount,
      getRepeatCount,
      setContactInfo,
      clearSession,
    }),
    [
      slug,
      session,
      ensureSession,
      setAnswer,
      getAnswer,
      setRepeatCount,
      getRepeatCount,
      setContactInfo,
      clearSession,
    ],
  )

  return <SurveySessionContext.Provider value={value}>{children}</SurveySessionContext.Provider>
}

export const useSurveySession = (surveySlug?: string) => {
  const context = useContext(SurveySessionContext)
  if (!context) {
    throw new Error('useSurveySession must be used within SurveySessionProvider')
  }

  useEffect(() => {
    if (surveySlug) {
      context.ensureSession(surveySlug)
    }
  }, [surveySlug, context])

  return context
}
