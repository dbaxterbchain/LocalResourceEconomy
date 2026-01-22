import { useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { fetchCohortDetail, type CohortDetail } from '../../lib/staffCohorts'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'

export default function StaffCohortDetailPage() {
  const { cohortId } = useParams()
  const [adminToken, setAdminToken] = useState(getStoredAdminToken())
  const [detail, setDetail] = useState<CohortDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoad = async () => {
    if (!cohortId) {
      setError('Missing cohort id.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCohortDetail({ adminToken, cohortId })
      setDetail(data)
      setStoredAdminToken(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cohort')
    } finally {
      setLoading(false)
    }
  }

  const linkBySurveyId = new Map(detail?.links.map((link) => [link.survey_id, link]))

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Cohort detail</Typography>
          <Typography color="text.secondary">Manage survey links for this cohort.</Typography>
        </Stack>

        {!cohortId ? <Alert severity="error">Missing cohort id.</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

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
              <Button variant="contained" onClick={handleLoad} disabled={loading || !cohortId}>
                {loading ? 'Loading...' : 'Load cohort'}
              </Button>
              <Button variant="outlined" component={RouterLink} to="/app/cohorts">
                Back to cohorts
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? <LinearProgress /> : null}

        {detail ? (
          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="h4">{detail.cohort.name}</Typography>
                <Typography color="text.secondary">
                  {detail.study.name} · {detail.study.host_name}
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Chip label={`Status: ${detail.cohort.status}`} />
                {detail.cohort.starts_at ? (
                  <Chip label={`Starts: ${new Date(detail.cohort.starts_at).toLocaleDateString()}`} />
                ) : null}
                {detail.cohort.ends_at ? (
                  <Chip label={`Ends: ${new Date(detail.cohort.ends_at).toLocaleDateString()}`} />
                ) : null}
              </Stack>
              {detail.cohort.notes ? (
                <Typography color="text.secondary">{detail.cohort.notes}</Typography>
              ) : null}
            </Stack>
          </Paper>
        ) : null}

        {detail ? (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Survey</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.surveys.map((survey) => {
                  const link = linkBySurveyId.get(survey.id)
                  return (
                    <TableRow key={survey.id} hover>
                      <TableCell>{survey.name}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={survey.status} size="small" />
                          {survey.is_template ? (
                            <Chip label="Template" size="small" color="secondary" />
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {link ? (
                          <Chip
                            label={link.status === 'open' ? 'Open' : 'Closed'}
                            color={link.status === 'open' ? 'success' : 'default'}
                            size="small"
                          />
                        ) : (
                          <Chip label="Not created" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          component={RouterLink}
                          to={`/app/cohorts/${detail.cohort.id}/surveys/${survey.id}/link`}
                          variant="outlined"
                          size="small"
                        >
                          Manage link
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Stack>
    </Container>
  )
}
