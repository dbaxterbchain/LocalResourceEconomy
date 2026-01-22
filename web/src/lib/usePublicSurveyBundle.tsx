import { useEffect, useState } from 'react'
import { getSupabaseClient } from './supabaseClient'
import type { PublicSurveyBundle } from '../types/publicSurvey'

type UsePublicSurveyBundleResult = {
  data: PublicSurveyBundle | null
  error: string | null
  loading: boolean
}

export const usePublicSurveyBundle = (slug?: string): UsePublicSurveyBundleResult => {
  const [data, setData] = useState<PublicSurveyBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    const fetchBundle = async () => {
      if (!slug) {
        setData(null)
        setError('Missing survey slug.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
        const { data: bundle, error: rpcError } = await supabase.rpc(
          'get_public_survey_bundle_typed',
          { p_slug: slug },
        )

        if (!active) {
          return
        }

        if (rpcError) {
          setError(rpcError.message)
          setData(null)
          return
        }

        const typed = bundle as PublicSurveyBundle | null
        if (!typed?.survey || !typed?.link || !typed?.study || !typed?.cohort) {
          setData(null)
          return
        }

        setData(typed)
      } catch (err) {
        if (!active) {
          return
        }
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchBundle()

    return () => {
      active = false
    }
  }, [slug])

  return { data, error, loading }
}
