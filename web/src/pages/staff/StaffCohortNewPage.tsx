import { useState } from 'react'
import {
  Alert,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { fetchStudies, type StudySummary } from '../../lib/staffSurveys'
import { createCohort } from '../../lib/staffCohorts'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'

const statusOptions = ['draft', 'open', 'closed'] as const

export default function StaffCohortNewPage() {
  const navigate = useNavigate()
  const [adminToken, setAdminToken] = useState(getStoredAdminToken())
  const [studies, setStudies] = useState<StudySummary[]>([])
  const [studyId, setStudyId] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<(typeof statusOptions)[number]>('draft')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLoadStudies = async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchStudies({ adminToken })
      setStudies(rows)
      setStoredAdminToken(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load studies')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!studyId || !name.trim()) {
      setError('Study and cohort name are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const cohortId = await createCohort({
        adminToken,
        payload: {
          study_id: studyId,
          name: name.trim(),
          status,
          starts_at: startsAt || null,
          ends_at: endsAt || null,
          notes: notes.trim() || null,
        },
      })
      setStoredAdminToken(adminToken)
      navigate(`/app/cohorts/${cohortId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cohort')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Create cohort</Typography>
          <Typography color="text.secondary">
            Start a new study run and generate survey links.
          </Typography>
        </Stack>

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
              <Button variant="outlined" onClick={handleLoadStudies} disabled={loading}>
                Load studies
              </Button>
              <Button variant="text" component={RouterLink} to="/app/cohorts">
                Back to cohorts
              </Button>
            </Stack>
            <FormControl fullWidth>
              <InputLabel id="study-select-label">Study</InputLabel>
              <Select
                labelId="study-select-label"
                label="Study"
                value={studyId}
                onChange={(event) => setStudyId(event.target.value)}
              >
                {studies.map((study) => (
                  <MenuItem key={study.id} value={study.id}>
                    {study.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Cohort name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Start date"
                type="date"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End date"
                type="date"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
            <Button variant="contained" onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating...' : 'Create cohort'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
