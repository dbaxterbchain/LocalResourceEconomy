import { getSupabaseClient } from './supabaseClient'
import type { PublicSurveyBundle } from '../types/publicSurvey'
import type { SurveySession } from './surveySession'

type SubmitResult = {
  responseId: string
}

const buildResponseId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (crypto?.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const toHex = (value: number) => value.toString(16).padStart(2, '0')
  return [
    toHex(bytes[0]),
    toHex(bytes[1]),
    toHex(bytes[2]),
    toHex(bytes[3]),
    '-',
    toHex(bytes[4]),
    toHex(bytes[5]),
    '-',
    toHex(bytes[6]),
    toHex(bytes[7]),
    '-',
    toHex(bytes[8]),
    toHex(bytes[9]),
    '-',
    toHex(bytes[10]),
    toHex(bytes[11]),
    toHex(bytes[12]),
    toHex(bytes[13]),
    toHex(bytes[14]),
    toHex(bytes[15]),
  ].join('')
}

const buildAnonToken = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID()
  }
  return `anon_${Math.random().toString(36).slice(2)}`
}

export const submitSurvey = async (
  bundle: PublicSurveyBundle,
  session: SurveySession,
): Promise<SubmitResult> => {
  const supabase = getSupabaseClient()
  const anonToken = buildAnonToken()
  const responseId = buildResponseId()

  const responseInsert = {
    id: responseId,
    survey_id: bundle.survey.id,
    cohort_id: bundle.cohort.id,
    survey_link_id: bundle.link.id,
    anon_token: anonToken,
    submitted_at: new Date().toISOString(),
    contact_name: session.contact_info.contact_name || null,
    contact_email: session.contact_info.contact_email || null,
    contact_phone: session.contact_info.contact_phone || null,
    business_name: session.contact_info.business_name || null,
  }

  const { error: responseError } = await supabase.from('responses').insert(responseInsert)
  if (responseError) {
    throw new Error(responseError.message ?? 'Failed to create response')
  }

  const questions =
    bundle.sections?.flatMap((section) => section.questions ?? []) ??
    []

  const items = Object.entries(session.answers)
    .map(([key, answer]) => {
      const [questionId, repeatIndexRaw] = key.split(':')
      const repeatIndex = Number.parseInt(repeatIndexRaw ?? '0', 10)
      const question = questions.find((q) => q.id === questionId)
      if (!question) {
        return null
      }
      if (question.type === 'info') {
        return null
      }

      if (question.type === 'multiselect') {
        return {
          response_id: responseId,
          question_id: questionId,
          repeat_index: repeatIndex,
          value_json: {
            values: Array.isArray(answer.value) ? answer.value : [answer.value],
            other: answer.other ?? null,
          },
        }
      }

      if (question.type === 'select' && answer.other) {
        return {
          response_id: responseId,
          question_id: questionId,
          repeat_index: repeatIndex,
          value_json: {
            value: answer.value,
            other: answer.other,
          },
        }
      }

      if (question.type === 'number') {
        const parsed = Number.parseFloat(String(answer.value))
        if (Number.isFinite(parsed)) {
          return {
            response_id: responseId,
            question_id: questionId,
            repeat_index: repeatIndex,
            value_number: parsed,
          }
        }
      }

      return {
        response_id: responseId,
        question_id: questionId,
        repeat_index: repeatIndex,
        value_text: String(answer.value ?? ''),
      }
    })
    .filter(Boolean) as Array<Record<string, unknown>>

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('response_items').insert(items)
    if (itemsError) {
      throw new Error(itemsError.message)
    }
  }

  return { responseId }
}
