import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Container,
  Divider,
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
import { fetchStaffResponseDetail, type StaffResponseDetail } from '../../lib/staffResponses'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'

export default function StaffResponseDetailPage() {
  const { responseId } = useParams()
  const [tokenInput, setTokenInput] = useState(getStoredAdminToken())
  const [activeToken, setActiveToken] = useState(getStoredAdminToken())
  const [data, setData] = useState<StaffResponseDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleReload = () => {
    if (!tokenInput) {
      setError('Enter an admin token to load this response.')
      return
    }
    setError(null)
    setData(null)
    setActiveToken(tokenInput)
  }

  useEffect(() => {
    if (!responseId || !activeToken) {
      return
    }
    setLoading(true)
    setError(null)
    fetchStaffResponseDetail({ responseId, adminToken: activeToken })
      .then((response) => {
        setData(response)
        setStoredAdminToken(activeToken)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load response')
      })
      .finally(() => setLoading(false))
  }, [responseId, activeToken])

  const formatResponseValue = (item: StaffResponseDetail['response_items'][number]) => {
    if (item.value_text) {
      return item.value_text
    }
    if (item.value_number !== null) {
      return item.value_number.toString()
    }
    if (item.value_json) {
      return JSON.stringify(item.value_json)
    }
    return ''
  }

  const formatAuditValue = (value: Record<string, unknown> | null) => {
    if (!value) {
      return 'n/a'
    }
    return JSON.stringify(value)
  }

  if (!responseId) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="h3">Response not found</Typography>
            <Button component={RouterLink} to="/app/responses" variant="outlined">
              Back to responses
            </Button>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Response detail</Typography>
          <Typography color="text.secondary">Review answers and audit history.</Typography>
        </Stack>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Admin token"
                type="password"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                helperText="Stored locally for convenience."
                fullWidth
              />
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'flex-end' }}
              >
                <Button variant="contained" onClick={handleReload} disabled={loading}>
                  {loading ? 'Loading...' : 'Reload response'}
                </Button>
                <Button component={RouterLink} to="/app/responses" variant="outlined">
                  Back to responses
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        {loading ? <LinearProgress /> : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        {data ? (
          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <Chip
                  label={data.submitted_at ? 'Submitted' : 'Draft'}
                  color={data.submitted_at ? 'success' : 'default'}
                />
                <Typography variant="body2" color="text.secondary">
                  Submitted:{' '}
                  {data.submitted_at ? new Date(data.submitted_at).toLocaleString() : 'Draft'}
                </Typography>
              </Stack>

              <Divider />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contact
                  </Typography>
                  <Typography>{data.contact_name || 'Anonymous'}</Typography>
                  <Typography color="text.secondary">
                    {data.contact_email || 'No email provided'}
                  </Typography>
                  {data.contact_phone ? (
                    <Typography color="text.secondary">{data.contact_phone}</Typography>
                  ) : null}
                </Stack>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Business
                  </Typography>
                  <Typography>{data.business_name || 'Not provided'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Response ID: {data.id}
                  </Typography>
                </Stack>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="h4">Answers</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Question</TableCell>
                        <TableCell>Answer</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.response_items.map((item) => {
                        const label = item.survey_questions?.label ?? item.question_id
                        const repeatSuffix = item.repeat_index > 0 ? ` (Item ${item.repeat_index + 1})` : ''
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{`${label}${repeatSuffix}`}</TableCell>
                            <TableCell>{formatResponseValue(item) || 'n/a'}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="h4">Audit log</Typography>
                {data.response_audit_log.length === 0 ? (
                  <Typography color="text.secondary">No edits yet.</Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Edited at</TableCell>
                          <TableCell>Field</TableCell>
                          <TableCell>Change</TableCell>
                          <TableCell>Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.response_audit_log.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{new Date(entry.edited_at).toLocaleString()}</TableCell>
                            <TableCell>{entry.field_path}</TableCell>
                            <TableCell>{`${formatAuditValue(entry.old_value)} -> ${formatAuditValue(entry.new_value)}`}</TableCell>
                            <TableCell>{entry.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Container>
  )
}
