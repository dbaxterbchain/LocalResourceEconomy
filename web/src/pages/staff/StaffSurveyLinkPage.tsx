import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import QRCode from 'react-qr-code'
import {
  createSurveyLink,
  fetchSurveyLink,
  updateSurveyLink,
  type SurveyLinkDetail,
} from '../../lib/staffCohorts'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'

export default function StaffSurveyLinkPage() {
  const { cohortId, surveyId } = useParams()
  const [adminToken, setAdminToken] = useState(getStoredAdminToken())
  const [detail, setDetail] = useState<SurveyLinkDetail | null>(null)
  const [slugDraft, setSlugDraft] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (detail?.link?.public_slug) {
      setSlugDraft(detail.link.public_slug)
    }
  }, [detail?.link?.public_slug])

  const handleLoad = async () => {
    if (!cohortId || !surveyId) {
      setError('Missing cohort or survey id.')
      return
    }
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    try {
      const data = await fetchSurveyLink({ adminToken, cohortId, surveyId })
      setDetail(data)
      setStoredAdminToken(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load link')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!cohortId || !surveyId) {
      setError('Missing cohort or survey id.')
      return
    }
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    try {
      const data = await createSurveyLink({
        adminToken,
        payload: { cohort_id: cohortId, survey_id: surveyId, public_slug: slugDraft || null },
      })
      setDetail(data)
      setStoredAdminToken(adminToken)
      setStatusMessage('Link created.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSlug = async () => {
    if (!cohortId || !surveyId || !detail?.link) {
      return
    }
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    try {
      const data = await updateSurveyLink({
        adminToken,
        payload: {
          cohort_id: cohortId,
          survey_id: surveyId,
          public_slug: slugDraft,
        },
      })
      setDetail(data)
      setStoredAdminToken(adminToken)
      setStatusMessage('Link updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update link')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!cohortId || !surveyId || !detail?.link) {
      return
    }
    const nextStatus = detail.link.status === 'open' ? 'closed' : 'open'
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    try {
      const data = await updateSurveyLink({
        adminToken,
        payload: {
          cohort_id: cohortId,
          survey_id: surveyId,
          status: nextStatus,
        },
      })
      setDetail(data)
      setStoredAdminToken(adminToken)
      setStatusMessage(`Link ${nextStatus === 'open' ? 'opened' : 'closed'}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update link status')
    } finally {
      setLoading(false)
    }
  }

  const publicUrl =
    detail?.link?.public_slug && typeof window !== 'undefined'
      ? `${window.location.origin}/${detail.link.public_slug}`
      : ''

  const handleCopy = async () => {
    if (!publicUrl || !navigator.clipboard) {
      return
    }
    await navigator.clipboard.writeText(publicUrl)
    setStatusMessage('Link copied to clipboard.')
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Survey link</Typography>
          <Typography color="text.secondary">
            Share a QR code and manage link status for this cohort.
          </Typography>
        </Stack>

        {!cohortId || !surveyId ? (
          <Alert severity="error">Missing cohort or survey id.</Alert>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        {statusMessage ? <Alert severity="success">{statusMessage}</Alert> : null}

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <TextField
              label="Admin token"
              type="password"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              helperText="Stored locally for convenience."
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" onClick={handleLoad} disabled={loading}>
                {loading ? 'Loading...' : 'Load link'}
              </Button>
              <Button variant="outlined" component={RouterLink} to={`/app/cohorts/${cohortId}`}>
                Back to cohort
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {detail ? (
          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h4">{detail.survey.name}</Typography>
                <Typography color="text.secondary">
                  {detail.study.name} · {detail.cohort.name}
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Chip label={`Survey status: ${detail.survey.status}`} />
                <Chip label={`Cohort status: ${detail.cohort.status}`} />
              </Stack>
              <TextField
                label="Public slug"
                value={slugDraft}
                onChange={(event) => setSlugDraft(event.target.value)}
                placeholder="example-survey-link"
                fullWidth
                disabled={loading}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {detail.link ? (
                  <>
                    <Button variant="outlined" onClick={handleSaveSlug} disabled={loading}>
                      Save slug
                    </Button>
                    <Button variant="contained" onClick={handleToggleStatus} disabled={loading}>
                      {detail.link.status === 'open' ? 'Close link' : 'Open link'}
                    </Button>
                  </>
                ) : (
                  <Button variant="contained" onClick={handleCreate} disabled={loading}>
                    Create link
                  </Button>
                )}
              </Stack>
              {detail.link ? (
                <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
                  <Stack spacing={1} sx={{ minWidth: { md: 280 } }}>
                    <Typography variant="subtitle1">Shareable link</Typography>
                    <Typography color="text.secondary">{publicUrl || 'Not available yet'}</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Button variant="outlined" onClick={handleCopy} disabled={!publicUrl}>
                        Copy link
                      </Button>
                      <Chip
                        label={detail.link.status === 'open' ? 'Open' : 'Closed'}
                        color={detail.link.status === 'open' ? 'success' : 'default'}
                      />
                    </Stack>
                  </Stack>
                  {publicUrl ? (
                    <Paper variant="outlined" sx={{ p: 2, alignSelf: 'flex-start' }}>
                      <QRCode value={publicUrl} size={180} />
                    </Paper>
                  ) : null}
                </Stack>
              ) : (
                <Alert severity="info">
                  Create a link to generate a QR code and shareable URL.
                </Alert>
              )}
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Container>
  )
}
