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
  fetchStaffSurveys,
  fetchStudies,
  type StudySummary,
  type SurveySummary,
} from '../../lib/staffSurveys'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'

export default function StaffSurveysPage() {
  const [adminToken, setAdminToken] = useState(getStoredAdminToken())
  const [studies, setStudies] = useState<StudySummary[]>([])
  const [studyId, setStudyId] = useState('')
  const [surveys, setSurveys] = useState<SurveySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoad = async () => {
    setLoading(true)
    setError(null)
    try {
      const [studyRows, surveyRows] = await Promise.all([
        fetchStudies({ adminToken }),
        fetchStaffSurveys({ adminToken, studyId: studyId || undefined }),
      ])
      setStudies(studyRows)
      setSurveys(surveyRows)
      setStoredAdminToken(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (value: string) => new Date(value).toLocaleDateString()

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Surveys</Typography>
          <Typography color="text.secondary">
            Browse surveys and jump into the builder.
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
                {loading ? 'Loading...' : 'Load surveys'}
              </Button>
              <Button variant="outlined" component={RouterLink} to="/app/surveys/new">
                Create survey
              </Button>
              <Button variant="text" component={RouterLink} to="/app">
                Back to dashboard
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? <LinearProgress /> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        {surveys.length === 0 && !loading ? (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">No surveys found yet.</Typography>
          </Paper>
        ) : null}

        {surveys.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Survey</TableCell>
                  <TableCell>Study</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {surveys.map((survey) => (
                  <TableRow key={survey.id} hover>
                    <TableCell>{survey.name}</TableCell>
                    <TableCell>{survey.study_name ?? 'Unknown study'}</TableCell>
                    <TableCell>
                      <Chip label={survey.status} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={survey.is_template ? 'Template' : 'Standard'}
                        color={survey.is_template ? 'secondary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(survey.created_at)}</TableCell>
                    <TableCell align="right">
                      <Button
                        component={RouterLink}
                        to={`/app/surveys/${survey.id}`}
                        variant="outlined"
                        size="small"
                      >
                        Open builder
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
