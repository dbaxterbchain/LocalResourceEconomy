import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { fetchStaffSurveyBundle } from '../../lib/staffSurveyBundle'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'
import type { PublicSurveyBundle } from '../../types/publicSurvey'

export default function StaffPreviewPage() {
  const [slug, setSlug] = useState('coffee-shop-waste-systems-spring-2026-resource-flow')
  const [token, setToken] = useState(getStoredAdminToken())
  const [data, setData] = useState<PublicSurveyBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const result = await fetchStaffSurveyBundle({ slug, adminToken: token })
      setData(result as PublicSurveyBundle)
      setStoredAdminToken(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff preview')
    } finally {
      setLoading(false)
    }
  }

  const linkStatusColor = data?.link.status === 'open' ? 'success' : 'default'
  const totalQuestions =
    data?.sections?.reduce((sum, section) => sum + (section.questions?.length ?? 0), 0) ?? 0

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Staff survey preview</Typography>
          <Typography color="text.secondary">
            Fetch any survey bundle by slug using the admin token.
          </Typography>
        </Stack>

        <Paper component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <TextField
              label="Survey slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="coffee-shop-waste-systems-spring-2026-resource-flow"
              fullWidth
              required
            />
            <TextField
              label="Admin token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="local-admin-token"
              helperText="Stored locally for convenience."
              fullWidth
              required
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Loading...' : 'Fetch preview'}
              </Button>
              <Button component={RouterLink} to="/app" variant="outlined">
                Back to dashboard
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {data ? (
          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Chip label={`Link status: ${data.link.status}`} color={linkStatusColor} />
                <Typography variant="body2" color="text.secondary">
                  Slug: {data.link.public_slug}
                </Typography>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Study
                </Typography>
                <Typography variant="h4">{data.study.name}</Typography>
                <Typography color="text.secondary">Host: {data.study.host_name}</Typography>
                {data.study.description ? <Typography>{data.study.description}</Typography> : null}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Survey
                  </Typography>
                  <Typography>{data.survey.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contact info: {data.survey.contact_info_mode} ({data.survey.contact_info_placement})
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cohort
                  </Typography>
                  <Typography>{data.cohort.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sections: {data.sections?.length ?? 0} | Questions: {totalQuestions}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to={`/${data.link.public_slug}`}
                >
                  Open public survey
                </Button>
              </Stack>

              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(31, 35, 40, 0.04)',
                  overflowX: 'auto',
                  fontSize: '0.75rem',
                  lineHeight: 1.6,
                }}
              >
                {JSON.stringify(data, null, 2)}
              </Box>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Container>
  )
}
