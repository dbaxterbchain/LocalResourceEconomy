import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'
import {
  createSurvey,
  exportSurvey,
  fetchStudies,
  fetchSurveyTemplates,
  importSurvey,
  type SurveyDefinition,
  type SurveyTemplateSummary,
} from '../../lib/staffSurveys'

type StudyOption = {
  id: string
  name: string
  host_name: string
}

export default function StaffSurveyNewPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState(getStoredAdminToken())
  const [studies, setStudies] = useState<StudyOption[]>([])
  const [templates, setTemplates] = useState<SurveyTemplateSummary[]>([])
  const [studyId, setStudyId] = useState('')
  const [name, setName] = useState('')
  const [contactMode, setContactMode] = useState<'optional' | 'required'>('optional')
  const [contactPlacement, setContactPlacement] = useState<'start' | 'end'>('end')
  const [isTemplate, setIsTemplate] = useState(false)
  const [importText, setImportText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      return
    }

    setLoading(true)
    setError(null)

    fetchStudies({ adminToken: token })
      .then((studyRows) => {
        setStudies(studyRows)
        if (studyRows[0]) {
          setStudyId((prev) => prev || studyRows[0].id)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load studies')
      })
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!token || !studyId) {
      return
    }

    setLoading(true)
    setError(null)

    fetchSurveyTemplates({ adminToken: token, studyId })
      .then((templateRows) => {
        setTemplates(templateRows)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      })
      .finally(() => setLoading(false))
  }, [token, studyId])

  const selectedStudy = useMemo(
    () => studies.find((study) => study.id === studyId) ?? null,
    [studies, studyId],
  )

  const handleTokenChange = (value: string) => {
    setToken(value)
    setStoredAdminToken(value)
  }

  const handleCreate = async () => {
    if (!token) {
      setError('Enter the admin token to continue.')
      return
    }
    if (!studyId) {
      setError('Select a study before creating a survey.')
      return
    }
    if (!name.trim()) {
      setError('Enter a survey name.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const surveyId = await createSurvey({
        adminToken: token,
        payload: {
          study_id: studyId,
          name: name.trim(),
          contact_info_mode: contactMode,
          contact_info_placement: contactPlacement,
          is_template: isTemplate,
        },
      })
      navigate(`/app/surveys/${surveyId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create survey')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateUse = async (template: SurveyTemplateSummary) => {
    if (!token) {
      setError('Enter the admin token to continue.')
      return
    }
    if (!studyId) {
      setError('Select a study before using a template.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const surveyId = await createSurvey({
        adminToken: token,
        payload: {
          study_id: studyId,
          name: `${template.name} (Copy)`,
          contact_info_mode: template.contact_info_mode,
          contact_info_placement: template.contact_info_placement,
          source_survey_id: template.id,
          is_template: false,
        },
      })
      navigate(`/app/surveys/${surveyId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy template')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!token) {
      setError('Enter the admin token to continue.')
      return
    }
    if (!studyId) {
      setError('Select a study before importing.')
      return
    }
    if (!importText.trim()) {
      setError('Paste a JSON definition to import.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const definition = JSON.parse(importText) as SurveyDefinition
      const surveyId = await importSurvey({
        adminToken: token,
        studyId,
        definition,
      })
      navigate(`/app/surveys/${surveyId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import survey')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text()
      setImportText(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
    }
  }

  const handleTemplateRefresh = async () => {
    if (!token) {
      setError('Enter the admin token to continue.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const templateRows = await fetchSurveyTemplates({ adminToken: token, studyId })
      setTemplates(templateRows)
      setSuccess('Templates refreshed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh templates')
    } finally {
      setLoading(false)
    }
  }

  const handleExampleExport = async () => {
    if (!token) {
      setError('Enter the admin token to continue.')
      return
    }
    if (templates.length === 0) {
      setError('No template surveys available to export.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const definition = await exportSurvey({ adminToken: token, surveyId: templates[0].id })
      setImportText(JSON.stringify(definition, null, 2))
      setSuccess('Loaded sample JSON from the first template.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template JSON')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Create survey</Typography>
          <Typography color="text.secondary">
            Start from scratch, reuse a template, or import a JSON definition.
          </Typography>
        </Stack>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <TextField
              label="Admin token"
              type="password"
              value={token}
              onChange={(event) => handleTokenChange(event.target.value)}
              helperText="Stored locally for this browser."
              fullWidth
            />
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
                    {study.name} ({study.host_name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedStudy ? (
              <Typography variant="body2" color="text.secondary">
                Creating surveys inside: {selectedStudy.name}
              </Typography>
            ) : null}
          </Stack>
        </Paper>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Paper sx={{ p: { xs: 3, md: 4 }, flex: 1 }}>
            <Stack spacing={2}>
              <Typography variant="h4">Start from scratch</Typography>
              <TextField
                label="Survey name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Resource Flow Collection"
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel id="contact-info-mode-label">Contact info mode</InputLabel>
                <Select
                  labelId="contact-info-mode-label"
                  label="Contact info mode"
                  value={contactMode}
                  onChange={(event) => setContactMode(event.target.value as 'optional' | 'required')}
                >
                  <MenuItem value="optional">Optional</MenuItem>
                  <MenuItem value="required">Required</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="contact-info-placement-label">Contact info placement</InputLabel>
                <Select
                  labelId="contact-info-placement-label"
                  label="Contact info placement"
                  value={contactPlacement}
                  onChange={(event) => setContactPlacement(event.target.value as 'start' | 'end')}
                >
                  <MenuItem value="start">Start</MenuItem>
                  <MenuItem value="end">End</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={isTemplate}
                    onChange={(event) => setIsTemplate(event.target.checked)}
                  />
                }
                label="Save as template"
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" onClick={handleCreate} disabled={loading}>
                  Create survey
                </Button>
                <Button variant="outlined" component={RouterLink} to="/app">
                  Back to dashboard
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 3, md: 4 }, flex: 1 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h4">Use a template</Typography>
                <Chip label={`${templates.length}`} />
              </Stack>
              <Typography color="text.secondary">
                Templates are stored within each study. Pick one to duplicate.
              </Typography>

              <Stack spacing={1}>
                {templates.map((template) => (
                  <Paper key={template.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1">{template.name}</Typography>
                        <Chip label="Template" size="small" />
                      </Stack>
                      <Typography color="text.secondary">
                        Contact info: {template.contact_info_mode} ({template.contact_info_placement})
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => handleTemplateUse(template)}
                        disabled={loading}
                      >
                        Use template
                      </Button>
                    </Stack>
                  </Paper>
                ))}
                {templates.length === 0 ? (
                  <Typography color="text.secondary">No templates yet.</Typography>
                ) : null}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="text" onClick={handleTemplateRefresh} disabled={loading}>
                  Refresh templates
                </Button>
                <Button variant="text" onClick={handleExampleExport} disabled={loading}>
                  Load sample JSON
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h4">Import from JSON</Typography>
              <Chip label="JSON" size="small" />
            </Stack>
            <Typography color="text.secondary">
              Paste a survey JSON export or upload a file to create a new survey.
            </Typography>
            <TextField
              label="Survey JSON"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="{ ... }"
              multiline
              minRows={4}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="outlined" component="label" disabled={loading}>
                Upload JSON
                <Box
                  component="input"
                  type="file"
                  hidden
                  accept="application/json"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void handleFileUpload(file)
                    }
                  }}
                />
              </Button>
              <Button variant="contained" onClick={handleImport} disabled={loading}>
                Import survey
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Divider />
        <Typography variant="caption" color="text.secondary">
          Templates stay inside a study. Use JSON export/import to reuse surveys across studies.
        </Typography>
      </Stack>
    </Container>
  )
}
