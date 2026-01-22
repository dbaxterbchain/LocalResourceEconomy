import { useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
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
import { Link as RouterLink } from 'react-router-dom'
import {
  exportStaffResponsesCsv,
  fetchStaffResponses,
  type StaffResponseRow,
} from '../../lib/staffResponses'
import { fetchStaffSurveys, fetchStudies, type StudySummary, type SurveySummary } from '../../lib/staffSurveys'
import { fetchStaffCohorts, type CohortSummary } from '../../lib/staffCohorts'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'

export default function StaffResponsesPage() {
  const [adminToken, setAdminToken] = useState(getStoredAdminToken())
  const [studies, setStudies] = useState<StudySummary[]>([])
  const [surveys, setSurveys] = useState<SurveySummary[]>([])
  const [cohorts, setCohorts] = useState<CohortSummary[]>([])
  const [studyId, setStudyId] = useState('')
  const [surveyId, setSurveyId] = useState('')
  const [cohortId, setCohortId] = useState('')
  const [status, setStatus] = useState<'submitted' | 'draft' | ''>('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [slug, setSlug] = useState('')
  const [responses, setResponses] = useState<StaffResponseRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLoadFilters = async () => {
    setLoading(true)
    setError(null)
    try {
      const [studyRows, surveyRows, cohortRows] = await Promise.all([
        fetchStudies({ adminToken }),
        fetchStaffSurveys({ adminToken, studyId: studyId || undefined }),
        fetchStaffCohorts({ adminToken, studyId: studyId || undefined }),
      ])
      setStudies(studyRows)
      setSurveys(surveyRows)
      setCohorts(cohortRows)
      setStoredAdminToken(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load filter data')
    } finally {
      setLoading(false)
    }
  }

  const handleFetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchStaffResponses({
        adminToken,
        filters: {
          slug: slug || undefined,
          studyId: studyId || undefined,
          surveyId: surveyId || undefined,
          cohortId: cohortId || undefined,
          status: status || undefined,
          search: search || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
      })
      setResponses(result)
      setStoredAdminToken(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch responses')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    try {
      const csv = await exportStaffResponsesCsv({
        adminToken,
        filters: {
          slug: slug || undefined,
          studyId: studyId || undefined,
          surveyId: surveyId || undefined,
          cohortId: cohortId || undefined,
          status: status || undefined,
          search: search || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
      })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'responses.csv'
      link.click()
      URL.revokeObjectURL(url)
      setStoredAdminToken(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export responses')
    } finally {
      setLoading(false)
    }
  }

  const formatSubmittedAt = (submittedAt: string | null) => {
    if (!submittedAt) {
      return 'Draft'
    }
    return new Date(submittedAt).toLocaleString()
  }

  const getContactLabel = (response: StaffResponseRow) =>
    response.contact_email || response.contact_name || response.business_name || 'Anonymous'

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Responses</Typography>
          <Typography color="text.secondary">
            Filter, search, and export survey responses.
          </Typography>
        </Stack>

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
              <Button variant="outlined" onClick={handleLoadFilters} disabled={loading}>
                Load filters
              </Button>
              <Button component={RouterLink} to="/app" variant="text">
                Back to dashboard
              </Button>
            </Stack>
            <TextField
              label="Survey link slug (optional)"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              helperText="Overrides survey/cohort filters when provided."
              fullWidth
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="study-filter-label">Study</InputLabel>
                <Select
                  labelId="study-filter-label"
                  label="Study"
                  value={studyId}
                  onChange={(event) => {
                    setStudyId(event.target.value)
                    setSurveyId('')
                    setCohortId('')
                  }}
                >
                  <MenuItem value="">All studies</MenuItem>
                  {studies.map((study) => (
                    <MenuItem key={study.id} value={study.id}>
                      {study.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="survey-filter-label">Survey</InputLabel>
                <Select
                  labelId="survey-filter-label"
                  label="Survey"
                  value={surveyId}
                  onChange={(event) => setSurveyId(event.target.value)}
                >
                  <MenuItem value="">All surveys</MenuItem>
                  {surveys.map((survey) => (
                    <MenuItem key={survey.id} value={survey.id}>
                      {survey.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="cohort-filter-label">Cohort</InputLabel>
                <Select
                  labelId="cohort-filter-label"
                  label="Cohort"
                  value={cohortId}
                  onChange={(event) => setCohortId(event.target.value)}
                >
                  <MenuItem value="">All cohorts</MenuItem>
                  {cohorts.map((cohort) => (
                    <MenuItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  label="Status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="From date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="To date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              helperText="Search contact info, questions, and answer text."
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" onClick={handleFetch} disabled={loading}>
                {loading ? 'Loading...' : 'Load responses'}
              </Button>
              <Button variant="outlined" onClick={handleExport} disabled={loading}>
                Export CSV
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? <LinearProgress /> : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        {responses.length === 0 && !loading ? (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">No responses found.</Typography>
          </Paper>
        ) : null}

        {responses.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Survey</TableCell>
                  <TableCell>Cohort</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {responses.map((response) => (
                  <TableRow key={response.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          {formatSubmittedAt(response.submitted_at)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {response.id}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{getContactLabel(response)}</TableCell>
                    <TableCell>
                      <Chip
                        label={response.submitted_at ? 'Submitted' : 'Draft'}
                        color={response.submitted_at ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {response.survey_id.slice(0, 8)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {response.cohort_id.slice(0, 8)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        component={RouterLink}
                        to={`/app/responses/${response.id}`}
                        variant="outlined"
                        size="small"
                      >
                        View response
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Stack>
    </Container>
  )
}
