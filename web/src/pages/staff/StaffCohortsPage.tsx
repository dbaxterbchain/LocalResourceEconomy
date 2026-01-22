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
import { fetchStudies, type StudySummary } from '../../lib/staffSurveys'
import { fetchStaffCohorts, type CohortSummary } from '../../lib/staffCohorts'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'

export default function StaffCohortsPage() {
  const [adminToken, setAdminToken] = useState(getStoredAdminToken())
  const [studies, setStudies] = useState<StudySummary[]>([])
  const [studyId, setStudyId] = useState('')
  const [cohorts, setCohorts] = useState<CohortSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoad = async () => {
    setLoading(true)
    setError(null)
    try {
      const [studyRows, cohortRows] = await Promise.all([
        fetchStudies({ adminToken }),
        fetchStaffCohorts({ adminToken, studyId: studyId || undefined }),
      ])
      setStudies(studyRows)
      setCohorts(cohortRows)
      setStoredAdminToken(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cohorts')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : '—')

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Cohorts</Typography>
          <Typography color="text.secondary">
            Track study runs and manage their survey links.
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
            <FormControl fullWidth>
              <InputLabel id="study-filter-label">Study filter</InputLabel>
              <Select
                labelId="study-filter-label"
                label="Study filter"
                value={studyId}
                onChange={(event) => setStudyId(event.target.value)}
              >
                <MenuItem value="">All studies</MenuItem>
                {studies.map((study) => (
                  <MenuItem key={study.id} value={study.id}>
                    {study.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" onClick={handleLoad} disabled={loading}>
                {loading ? 'Loading...' : 'Load cohorts'}
              </Button>
              <Button variant="outlined" component={RouterLink} to="/app/cohorts/new">
                Create cohort
              </Button>
              <Button variant="text" component={RouterLink} to="/app">
                Back to dashboard
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? <LinearProgress /> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        {cohorts.length === 0 && !loading ? (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">No cohorts found yet.</Typography>
          </Paper>
        ) : null}

        {cohorts.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cohort</TableCell>
                  <TableCell>Study</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cohorts.map((cohort) => (
                  <TableRow key={cohort.id} hover>
                    <TableCell>{cohort.name}</TableCell>
                    <TableCell>{cohort.study_name ?? 'Unknown study'}</TableCell>
                    <TableCell>
                      <Chip label={cohort.status} size="small" />
                    </TableCell>
                    <TableCell>{formatDate(cohort.starts_at)}</TableCell>
                    <TableCell>{formatDate(cohort.ends_at)}</TableCell>
                    <TableCell align="right">
                      <Button
                        component={RouterLink}
                        to={`/app/cohorts/${cohort.id}`}
                        variant="outlined"
                        size="small"
                      >
                        View cohort
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
