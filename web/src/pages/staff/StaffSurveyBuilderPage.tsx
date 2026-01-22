
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  exportSurvey,
  updateSurvey,
  updateSurveyDefinition,
  type SurveyDefinition,
} from '../../lib/staffSurveys'
import { getStoredAdminToken, setStoredAdminToken } from '../../lib/adminToken'

type RepeatGroup = NonNullable<SurveyDefinition['sections'][number]['repeat_groups']>[number]

const buildExportFilename = (name: string) => {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${normalized || 'survey'}.json`
}

const createTempId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createSection = (sortOrder: number): SurveyDefinition['sections'][number] => ({
  id: createTempId(),
  title: 'New section',
  sort_order: sortOrder,
  repeat_groups: [],
  questions: [],
})

const createQuestion = (
  sortOrder: number,
  type: SurveyDefinition['sections'][number]['questions'][number]['type'] = 'text',
): SurveyDefinition['sections'][number]['questions'][number] => ({
  id: createTempId(),
  type,
  label: type === 'info' ? 'Info block' : 'New block',
  helper_text: '',
  required: false,
  repeat_group_key: null,
  sort_order: sortOrder,
  config_json: {},
  options: [],
})

const createRepeatGroup = (sortOrder: number, existingKeys: Set<string>): RepeatGroup => {
  let index = 1
  let key = `group-${index}`
  while (existingKeys.has(key)) {
    index += 1
    key = `group-${index}`
  }
  return {
    id: createTempId(),
    name: `Group ${index}`,
    repeat_group_key: key,
    min_items: 1,
    max_items: 10,
    sort_order: sortOrder,
  }
}

const repeatGroupTintPalette = [
  '#E3F2FD',
  '#E8F5E9',
  '#FFF8E1',
  '#E0F7FA',
  '#F1F8E9',
  '#FFF3E0',
  '#FCE4EC',
  '#F9FBE7',
]
export default function StaffSurveyBuilderPage() {
  const { surveyId } = useParams()
  const [adminToken, setAdminToken] = useState(getStoredAdminToken())
  const [definition, setDefinition] = useState<SurveyDefinition | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingStructure, setSavingStructure] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)

  const canAct = Boolean(surveyId && adminToken.trim().length > 0)
  const survey = definition?.survey ?? null
  const sections = useMemo(() => definition?.sections ?? [], [definition])

  const loadSurvey = useCallback(async () => {
    if (!canAct || !surveyId) {
      setDefinition(null)
      return
    }

    setLoading(true)
    setError(null)
    setStatusMessage(null)
    try {
      const data = await exportSurvey({ adminToken, surveyId })
      setDefinition(data)
      setStoredAdminToken(adminToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load survey')
    } finally {
      setLoading(false)
    }
  }, [adminToken, canAct, surveyId])

  useEffect(() => {
    void loadSurvey()
  }, [loadSurvey])

  useEffect(() => {
    if (!sections.length) {
      setSelectedSectionId(null)
      setSelectedQuestionId(null)
      return
    }

    if (!selectedSectionId || !sections.some((section) => section.id === selectedSectionId)) {
      const firstSectionId = sections[0]?.id ?? null
      setSelectedSectionId(firstSectionId)
      const firstQuestionId = sections[0]?.questions?.[0]?.id ?? null
      setSelectedQuestionId(firstQuestionId)
    }
  }, [sections, selectedSectionId])

  useEffect(() => {
    if (!selectedSectionId) {
      setSelectedQuestionId(null)
      return
    }
    const selectedSection = sections.find((section) => section.id === selectedSectionId)
    if (!selectedSection?.questions?.length) {
      setSelectedQuestionId(null)
      return
    }
    if (
      !selectedQuestionId ||
      !selectedSection.questions.some((question) => question.id === selectedQuestionId)
    ) {
      setSelectedQuestionId(selectedSection.questions[0]?.id ?? null)
    }
  }, [sections, selectedQuestionId, selectedSectionId])

  const updateSurveyField = (updates: Partial<SurveyDefinition['survey']>) => {
    setDefinition((prev) =>
      prev
        ? {
            ...prev,
            survey: {
              ...prev.survey,
              ...updates,
            },
          }
        : prev,
    )
  }

  const updateSection = (
    sectionId: string,
    updater: (section: SurveyDefinition['sections'][number]) => SurveyDefinition['sections'][number],
  ) => {
    setDefinition((prev) => {
      if (!prev) {
        return prev
      }
      return {
        ...prev,
        sections: prev.sections.map((section) =>
          section.id === sectionId ? updater(section) : section,
        ),
      }
    })
  }

  const updateQuestion = (
    sectionId: string,
    questionId: string,
    updater: (
      question: SurveyDefinition['sections'][number]['questions'][number],
    ) => SurveyDefinition['sections'][number]['questions'][number],
  ) => {
    updateSection(sectionId, (section) => ({
      ...section,
      questions: section.questions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    }))
  }

  const updateRepeatGroup = (
    sectionId: string,
    groupId: string,
    updater: (group: RepeatGroup) => RepeatGroup,
  ) => {
    updateSection(sectionId, (section) => ({
      ...section,
      repeat_groups: (section.repeat_groups ?? []).map((group) =>
        group.id === groupId ? updater(group) : group,
      ),
    }))
  }

  const handleAddRepeatGroup = (sectionId: string) => {
    updateSection(sectionId, (section) => {
      const groups = section.repeat_groups ?? []
      const existingKeys = new Set(groups.map((group) => group.repeat_group_key))
      const nextGroup = createRepeatGroup(groups.length + 1, existingKeys)
      return {
        ...section,
        repeat_groups: [...groups, nextGroup],
      }
    })
  }

  const handleRemoveRepeatGroup = (sectionId: string, groupId: string) => {
    updateSection(sectionId, (section) => ({
      ...section,
      repeat_groups: (section.repeat_groups ?? []).filter((group) => group.id !== groupId),
      questions: section.questions.map((question) =>
        question.group_id === groupId
          ? { ...question, group_id: null, repeat_group_key: null }
          : question,
      ),
    }))
  }

  const handleRepeatGroupKeyChange = (
    sectionId: string,
    groupId: string,
    nextKey: string,
  ) => {
    updateSection(sectionId, (section) => ({
      ...section,
      repeat_groups: (section.repeat_groups ?? []).map((group) =>
        group.id === groupId ? { ...group, repeat_group_key: nextKey } : group,
      ),
      questions: section.questions.map((question) =>
        question.group_id === groupId
          ? { ...question, repeat_group_key: nextKey }
          : question,
      ),
    }))
  }

  const handleAddSection = () => {
    setDefinition((prev) => {
      if (!prev) {
        return prev
      }
      const nextSection = createSection(prev.sections.length + 1)
      const nextSections = [...prev.sections, nextSection]
      setSelectedSectionId(nextSection.id ?? null)
      setSelectedQuestionId(null)
      return { ...prev, sections: nextSections }
    })
  }

  const handleRemoveSection = (sectionId: string) => {
    setDefinition((prev) => {
      if (!prev) {
        return prev
      }
      const nextSections = prev.sections.filter((section) => section.id !== sectionId)
      const fallbackSectionId = nextSections[0]?.id ?? null
      setSelectedSectionId(fallbackSectionId)
      setSelectedQuestionId(nextSections[0]?.questions?.[0]?.id ?? null)
      return { ...prev, sections: nextSections }
    })
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setDefinition((prev) => {
      if (!prev) {
        return prev
      }
      const index = prev.sections.findIndex((section) => section.id === sectionId)
      if (index < 0) {
        return prev
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.sections.length) {
        return prev
      }
      const nextSections = [...prev.sections]
      const [moved] = nextSections.splice(index, 1)
      nextSections.splice(targetIndex, 0, moved)
      return { ...prev, sections: nextSections }
    })
  }

  const handleAddQuestion = (
    sectionId: string,
    type: SurveyDefinition['sections'][number]['questions'][number]['type'] = 'text',
  ) => {
    updateSection(sectionId, (section) => {
      const nextQuestion = createQuestion(section.questions.length + 1, type)
      setSelectedQuestionId(nextQuestion.id ?? null)
      return { ...section, questions: [...section.questions, nextQuestion] }
    })
  }

  const handleRemoveQuestion = (sectionId: string, questionId: string) => {
    updateSection(sectionId, (section) => {
      const nextQuestions = section.questions.filter((question) => question.id !== questionId)
      setSelectedQuestionId(nextQuestions[0]?.id ?? null)
      return { ...section, questions: nextQuestions }
    })
  }

  const moveQuestion = (sectionId: string, questionId: string, direction: 'up' | 'down') => {
    updateSection(sectionId, (section) => {
      const index = section.questions.findIndex((question) => question.id === questionId)
      if (index < 0) {
        return section
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= section.questions.length) {
        return section
      }
      const nextQuestions = [...section.questions]
      const [moved] = nextQuestions.splice(index, 1)
      nextQuestions.splice(targetIndex, 0, moved)
      return { ...section, questions: nextQuestions }
    })
  }

  const handleOptionAdd = (sectionId: string, questionId: string) => {
    updateQuestion(sectionId, questionId, (question) => {
      const nextIndex = (question.options?.length ?? 0) + 1
      const nextOption = {
        id: createTempId(),
        value: `option-${nextIndex}`,
        label: `Option ${nextIndex}`,
        sort_order: nextIndex,
      }
      return {
        ...question,
        options: [...(question.options ?? []), nextOption],
      }
    })
  }

  const handleOptionRemove = (
    sectionId: string,
    questionId: string,
    optionId: string,
  ) => {
    updateQuestion(sectionId, questionId, (question) => ({
      ...question,
      options: (question.options ?? []).filter((option) => option.id !== optionId),
    }))
  }
  const normalizeSectionsForSave = (rawSections: SurveyDefinition['sections']) =>
    rawSections.map((section, sectionIndex) => ({
      ...section,
      sort_order: sectionIndex + 1,
      repeat_groups: (section.repeat_groups ?? []).map((group, groupIndex) => {
        const minItems = Number.isFinite(group.min_items) ? group.min_items : 1
        const maxItems = Number.isFinite(group.max_items) ? group.max_items : minItems
        return {
          ...group,
          sort_order: groupIndex + 1,
          name: group.name.trim(),
          repeat_group_key: group.repeat_group_key.trim(),
          min_items: Math.max(1, minItems),
          max_items: Math.max(Math.max(1, minItems), maxItems),
        }
      }),
      questions: (section.questions ?? []).map((question, questionIndex) => {
        const groups = section.repeat_groups ?? []
        const hasGroups = groups.length > 0
        const group =
          (question.group_id
            ? groups.find((entry) => entry.id === question.group_id)
            : undefined) ??
          (question.repeat_group_key
            ? groups.find((entry) => entry.repeat_group_key === question.repeat_group_key)
            : undefined)
        const repeatGroupKey = hasGroups
          ? group?.repeat_group_key ?? null
          : question.repeat_group_key?.trim() || null
        return {
          ...question,
          sort_order: questionIndex + 1,
          helper_text: question.helper_text?.trim() ? question.helper_text.trim() : null,
          repeat_group_key: repeatGroupKey,
          group_id: hasGroups ? group?.id ?? null : null,
          required: question.type === 'info' ? false : question.required,
          config_json: question.config_json ?? {},
          options: (question.options ?? []).map((option, optionIndex) => ({
            ...option,
            value: option.value.trim(),
            label: option.label.trim(),
            sort_order: optionIndex + 1,
          })),
        }
      }),
    }))

  const validateSections = (rawSections: SurveyDefinition['sections']) => {
    if (rawSections.length === 0) {
      return 'Add at least one section before saving structure.'
    }
    for (const section of rawSections) {
      if (!section.title.trim()) {
        return 'Every section needs a title.'
      }
      if (!section.questions || section.questions.length === 0) {
        return `Section "${section.title}" needs at least one block.`
      }
      const repeatGroups = section.repeat_groups ?? []
      const repeatGroupKeys = new Set<string>()
      for (const group of repeatGroups) {
        if (!group.name.trim()) {
          return `Repeat groups need a name (section "${section.title}").`
        }
        if (!group.repeat_group_key.trim()) {
          return `Repeat groups need a key (section "${section.title}").`
        }
        if (repeatGroupKeys.has(group.repeat_group_key)) {
          return `Repeat group key "${group.repeat_group_key}" is duplicated in "${section.title}".`
        }
        repeatGroupKeys.add(group.repeat_group_key)
        if (group.min_items < 1 || group.max_items < 1) {
          return `Repeat group "${group.name}" needs min/max of at least 1.`
        }
        if (group.max_items < group.min_items) {
          return `Repeat group "${group.name}" has max less than min.`
        }
      }
      for (const question of section.questions) {
        if (!question.label.trim()) {
          return `Every block needs a label (section "${section.title}").`
        }
        if (
          (question.type === 'select' || question.type === 'multiselect') &&
          (!question.options || question.options.length === 0)
        ) {
          return `Block "${question.label}" needs at least one option.`
        }
        for (const option of question.options ?? []) {
          if (!option.label.trim() || !option.value.trim()) {
            return `Option labels and values are required (block "${question.label}").`
          }
        }
      }
    }
    return null
  }

  const handleSave = async () => {
    if (!canAct || !surveyId || !survey) {
      setError('Load a survey before saving.')
      return
    }

    setSaving(true)
    setError(null)
    setStatusMessage(null)
    try {
      await updateSurvey({
        adminToken,
        payload: {
          survey_id: surveyId,
          name: survey.name,
          contact_info_mode: survey.contact_info_mode,
          contact_info_placement: survey.contact_info_placement,
          is_template: survey.is_template,
        },
      })
      setStoredAdminToken(adminToken)
      setStatusMessage('Saved survey settings.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save survey')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStructure = async () => {
    if (!canAct || !surveyId || !definition) {
      setError('Load a survey before saving structure.')
      return
    }

    const validationError = validateSections(definition.sections ?? [])
    if (validationError) {
      setError(validationError)
      return
    }

    setSavingStructure(true)
    setError(null)
    setStatusMessage(null)
    try {
      const normalizedSections = normalizeSectionsForSave(definition.sections ?? [])
      await updateSurveyDefinition({
        adminToken,
        surveyId,
        sections: normalizedSections,
      })
      setStoredAdminToken(adminToken)
      setStatusMessage('Saved survey structure.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save structure')
    } finally {
      setSavingStructure(false)
    }
  }

  const handleExport = async () => {
    if (!canAct || !surveyId) {
      setError('Load a survey before exporting.')
      return
    }

    setExporting(true)
    setError(null)
    setStatusMessage(null)
    try {
      const data = await exportSurvey({ adminToken, surveyId })
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = buildExportFilename(data.survey.name)
      link.click()
      URL.revokeObjectURL(url)
      setStatusMessage('Downloaded JSON export.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export survey')
    } finally {
      setExporting(false)
    }
  }

  const statusChip = survey?.status ? (
    <Chip
      label={survey.status}
      color={survey.status === 'live' ? 'success' : survey.status === 'draft' ? 'warning' : 'default'}
    />
  ) : null

  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? null
  const selectedQuestion =
    selectedSection?.questions?.find((question) => question.id === selectedQuestionId) ?? null
  const selectedSectionGroups = selectedSection?.repeat_groups ?? []
  const repeatGroupById = new Map(
    selectedSectionGroups
      .filter((group) => Boolean(group.id))
      .map((group) => [group.id as string, group]),
  )
  const repeatGroupByKey = new Map(
    selectedSectionGroups.map((group) => [group.repeat_group_key, group]),
  )
  const repeatGroupTintById = useMemo(() => {
    const map = new Map<string, string>()
    selectedSectionGroups.forEach((group, index) => {
      const key = (group.id ?? group.repeat_group_key) as string | undefined
      if (!key) {
        return
      }
      map.set(key, repeatGroupTintPalette[index % repeatGroupTintPalette.length])
    })
    return map
  }, [selectedSectionGroups])

  const getAssignedGroup = (
    question: SurveyDefinition['sections'][number]['questions'][number],
  ) => {
    if (question.group_id) {
      return repeatGroupById.get(question.group_id) ?? null
    }
    if (question.repeat_group_key) {
      return repeatGroupByKey.get(question.repeat_group_key) ?? null
    }
    return null
  }

  const getGroupTint = (group: RepeatGroup | null) => {
    if (!group) {
      return null
    }
    const key = (group.id ?? group.repeat_group_key) as string | undefined
    return key ? repeatGroupTintById.get(key) ?? null : null
  }
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h2">Survey builder</Typography>
          <Typography color="text.secondary">
            Manage survey settings, templates, and exports.
          </Typography>
        </Stack>

        {!surveyId ? <Alert severity="error">Missing survey id in the route.</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        {statusMessage ? <Alert severity="success">{statusMessage}</Alert> : null}
        {loading ? <Alert severity="info">Loading survey...</Alert> : null}

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant="h4">Admin access</Typography>
            <TextField
              label="Admin token"
              type="password"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              helperText="Stored locally for convenience."
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="outlined" onClick={() => void loadSurvey()} disabled={!canAct || loading}>
                Reload survey
              </Button>
              <Button variant="text" component={RouterLink} to="/app">
                Back to dashboard
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Survey name"
                value={survey?.name ?? ''}
                onChange={(event) => updateSurveyField({ name: event.target.value })}
                fullWidth
                disabled={!survey}
              />
              {statusChip}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="contact-info-mode-label">Contact info mode</InputLabel>
                <Select
                  labelId="contact-info-mode-label"
                  label="Contact info mode"
                  value={survey?.contact_info_mode ?? 'optional'}
                  onChange={(event) =>
                    updateSurveyField({
                      contact_info_mode: event.target.value as 'optional' | 'required',
                    })
                  }
                  disabled={!survey}
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
                  value={survey?.contact_info_placement ?? 'end'}
                  onChange={(event) =>
                    updateSurveyField({
                      contact_info_placement: event.target.value as 'start' | 'end',
                    })
                  }
                  disabled={!survey}
                >
                  <MenuItem value="start">Start</MenuItem>
                  <MenuItem value="end">End</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(survey?.is_template)}
                  onChange={(event) => updateSurveyField({ is_template: event.target.checked })}
                  disabled={!survey}
                />
              }
              label="Template"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" onClick={handleSave} disabled={!canAct || saving}>
                {saving ? 'Saving...' : 'Save survey settings'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleSaveStructure}
                disabled={!canAct || savingStructure}
              >
                {savingStructure ? 'Saving...' : 'Save blocks'}
              </Button>
              <Button variant="text" onClick={handleExport} disabled={!canAct || exporting}>
                {exporting ? 'Exporting...' : 'Export JSON'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
          <Paper sx={{ p: { xs: 3, md: 4 }, minWidth: { lg: 320 } }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h4">Sections</Typography>
                <Chip label={`${sections.length}`} />
              </Stack>
              <Stack spacing={1}>
                {sections.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography color="text.secondary">
                      No sections yet. Add your first section to begin.
                    </Typography>
                  </Paper>
                ) : (
                  sections.map((section, index) => (
                    <Paper
                      key={section.id ?? section.title}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor:
                          section.id === selectedSectionId ? 'primary.main' : 'divider',
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ flex: 1 }}>{section.title}</Typography>
                          <Chip label={`${section.questions?.length ?? 0} blocks`} size="small" />
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setSelectedSectionId(section.id ?? null)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => moveSection(section.id ?? '', 'up')}
                            disabled={index === 0}
                          >
                            Move up
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => moveSection(section.id ?? '', 'down')}
                            disabled={index === sections.length - 1}
                          >
                            Move down
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={() => handleRemoveSection(section.id ?? '')}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
              <Button variant="outlined" onClick={handleAddSection} disabled={!definition}>
                Add section
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 3, md: 4 }, flex: 1 }}>
            <Stack spacing={3}>
              {!selectedSection ? (
                <Alert severity="info">Select a section to edit its details.</Alert>
              ) : (
                <Stack spacing={3}>
                  <Stack spacing={1}>
                    <Typography variant="h3">Section editor</Typography>
                    <TextField
                      label="Section title"
                      value={selectedSection.title}
                      onChange={(event) =>
                        updateSection(selectedSection.id ?? '', (section) => ({
                          ...section,
                          title: event.target.value,
                        }))
                      }
                      fullWidth
                    />
                  </Stack>

                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h4">Repeat groups</Typography>
                      <Chip label={`${selectedSection.repeat_groups?.length ?? 0}`} />
                    </Stack>
                    <Stack spacing={1}>
                      {(selectedSection.repeat_groups ?? []).length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography color="text.secondary">
                            No repeat groups yet. Add one when this section should repeat.
                          </Typography>
                        </Paper>
                      ) : (
                        (selectedSection.repeat_groups ?? []).map((group) => (
                          <Paper
                            key={group.id ?? group.repeat_group_key}
                            variant="outlined"
                            sx={{ p: 2, bgcolor: getGroupTint(group) ?? 'background.paper' }}
                          >
                            <Stack spacing={2}>
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                  label="Group name"
                                  value={group.name}
                                  onChange={(event) =>
                                    updateRepeatGroup(selectedSection.id ?? '', group.id ?? '', (entry) => ({
                                      ...entry,
                                      name: event.target.value,
                                    }))
                                  }
                                  fullWidth
                                />
                                <TextField
                                  label="Group key"
                                  value={group.repeat_group_key}
                                  onChange={(event) =>
                                    handleRepeatGroupKeyChange(
                                      selectedSection.id ?? '',
                                      group.id ?? '',
                                      event.target.value.trim(),
                                    )
                                  }
                                  fullWidth
                                />
                              </Stack>
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                  label="Min items"
                                  type="number"
                                  value={group.min_items}
                                  onChange={(event) =>
                                    updateRepeatGroup(selectedSection.id ?? '', group.id ?? '', (entry) => ({
                                      ...entry,
                                      min_items: Number.parseInt(event.target.value, 10) || 1,
                                    }))
                                  }
                                />
                                <TextField
                                  label="Max items"
                                  type="number"
                                  value={group.max_items}
                                  onChange={(event) =>
                                    updateRepeatGroup(selectedSection.id ?? '', group.id ?? '', (entry) => ({
                                      ...entry,
                                      max_items: Number.parseInt(event.target.value, 10) || entry.min_items || 1,
                                    }))
                                  }
                                />
                                <Button
                                  color="error"
                                  variant="text"
                                  onClick={() => handleRemoveRepeatGroup(selectedSection.id ?? '', group.id ?? '')}
                                >
                                  Remove group
                                </Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h4">Blocks</Typography>
                      <Chip label={`${selectedSection.questions?.length ?? 0}`} />
                    </Stack>
                    <Stack spacing={1}>
                      {selectedSection.questions.map((question, index) => {
                        const assignedGroup = getAssignedGroup(question)
                        const groupTint = getGroupTint(assignedGroup)
                        return (
                          <Paper
                            key={question.id ?? question.label}
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderColor:
                                question.id === selectedQuestionId ? 'primary.main' : 'divider',
                              bgcolor: groupTint ?? 'background.paper',
                            }}
                          >
                            <Stack spacing={1}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography sx={{ flex: 1 }}>{question.label}</Typography>
                                <Chip label={question.type} size="small" />
                                {assignedGroup ? (
                                  <Chip label={`Group: ${assignedGroup.name}`} size="small" />
                                ) : null}
                                {question.required ? <Chip label="Required" size="small" /> : null}
                              </Stack>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setSelectedQuestionId(question.id ?? null)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() =>
                                    moveQuestion(selectedSection.id ?? '', question.id ?? '', 'up')
                                  }
                                  disabled={index === 0}
                                >
                                  Move up
                                </Button>
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() =>
                                    moveQuestion(selectedSection.id ?? '', question.id ?? '', 'down')
                                  }
                                  disabled={index === selectedSection.questions.length - 1}
                                >
                                  Move down
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="text"
                                  onClick={() =>
                                    handleRemoveQuestion(selectedSection.id ?? '', question.id ?? '')
                                  }
                                >
                                  Remove
                                </Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        )
                      })}
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Button
                        variant="outlined"
                        onClick={() => handleAddQuestion(selectedSection.id ?? '')}
                      >
                        Add block
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleAddQuestion(selectedSection.id ?? '', 'info')}
                      >
                        Add info block
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleAddRepeatGroup(selectedSection.id ?? '')}
                      >
                        Add repeat group
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={2}>
                    <Typography variant="h4">Block editor</Typography>
                    {!selectedQuestion ? (
                      <Alert severity="info">Select a block to edit its details.</Alert>
                    ) : (
                      <Stack spacing={2}>
                        <FormControl fullWidth>
                          <InputLabel id="question-type-label">Type</InputLabel>
                          <Select
                            labelId="question-type-label"
                            label="Type"
                            value={selectedQuestion.type}
                            onChange={(event) =>
                              updateQuestion(
                                selectedSection.id ?? '',
                                selectedQuestion.id ?? '',
                                (question) => {
                                  const nextType = event.target.value as SurveyDefinition['sections'][number]['questions'][number]['type']
                                  const nextOptions =
                                    nextType === 'select' || nextType === 'multiselect'
                                      ? question.options ?? []
                                      : []
                                  return {
                                    ...question,
                                    type: nextType,
                                    options: nextOptions,
                                    required: nextType === 'info' ? false : question.required,
                                    repeat_group_key:
                                      nextType === 'info' ? null : question.repeat_group_key,
                                  }
                                },
                              )
                            }
                          >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="longtext">Long text</MenuItem>
                            <MenuItem value="select">Select</MenuItem>
                            <MenuItem value="multiselect">Multi-select</MenuItem>
                            <MenuItem value="info">Info block</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          label={selectedQuestion.type === 'info' ? 'Block title' : 'Block label'}
                          value={selectedQuestion.label}
                          onChange={(event) =>
                            updateQuestion(
                              selectedSection.id ?? '',
                              selectedQuestion.id ?? '',
                              (question) => ({
                                ...question,
                                label: event.target.value,
                              }),
                            )
                          }
                          fullWidth
                        />
                        <TextField
                          label={selectedQuestion.type === 'info' ? 'Block content' : 'Helper text'}
                          value={selectedQuestion.helper_text ?? ''}
                          onChange={(event) =>
                            updateQuestion(
                              selectedSection.id ?? '',
                              selectedQuestion.id ?? '',
                              (question) => ({
                                ...question,
                                helper_text: event.target.value,
                              }),
                            )
                          }
                          multiline={selectedQuestion.type === 'info'}
                          minRows={selectedQuestion.type === 'info' ? 3 : 1}
                          fullWidth
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={selectedQuestion.required}
                              disabled={selectedQuestion.type === 'info'}
                              onChange={(event) =>
                                updateQuestion(
                                  selectedSection.id ?? '',
                                  selectedQuestion.id ?? '',
                                  (question) => ({
                                    ...question,
                                    required: event.target.checked,
                                  }),
                                )
                              }
                            />
                          }
                          label={
                            selectedQuestion.type === 'info'
                              ? 'Required (not used for info blocks)'
                              : 'Required'
                          }
                        />
                        <FormControl fullWidth>
                          <InputLabel id="repeat-group-select-label">Repeat group</InputLabel>
                          <Select
                            labelId="repeat-group-select-label"
                            label="Repeat group"
                            value={selectedQuestion.group_id ?? ''}
                            onChange={(event) =>
                              updateQuestion(
                                selectedSection.id ?? '',
                                selectedQuestion.id ?? '',
                                (question) => {
                                  const nextGroupId = event.target.value as string
                                  const nextGroup = selectedSectionGroups.find(
                                    (group) => group.id === nextGroupId,
                                  )
                                  return {
                                    ...question,
                                    group_id: nextGroupId || null,
                                    repeat_group_key: nextGroup?.repeat_group_key ?? null,
                                  }
                                },
                              )
                            }
                            disabled={
                              selectedQuestion.type === 'info' || selectedSectionGroups.length === 0
                            }
                          >
                            <MenuItem value="">No group</MenuItem>
                            {selectedSectionGroups.map((group) => (
                              <MenuItem key={group.id ?? group.repeat_group_key} value={group.id ?? ''}>
                                {group.name} ({group.repeat_group_key})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {(selectedQuestion.type === 'select' ||
                          selectedQuestion.type === 'multiselect') && (
                          <Stack spacing={2}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={Boolean(
                                    (selectedQuestion.config_json as Record<string, unknown> | undefined)?.allow_other_detail,
                                  )}
                                  onChange={(event) =>
                                    updateQuestion(
                                      selectedSection.id ?? '',
                                      selectedQuestion.id ?? '',
                                      (question) => ({
                                        ...question,
                                        config_json: {
                                          ...(question.config_json ?? {}),
                                          allow_other_detail: event.target.checked,
                                        },
                                      }),
                                    )
                                  }
                                />
                              }
                              label="Allow 'Other' detail"
                            />
                            <Stack spacing={1}>
                              {(selectedQuestion.options ?? []).map((option) => (
                                <Paper key={option.id ?? option.value} variant="outlined" sx={{ p: 2 }}>
                                  <Stack spacing={1}>
                                    <TextField
                                      label="Option label"
                                      value={option.label}
                                      onChange={(event) =>
                                        updateQuestion(
                                          selectedSection.id ?? '',
                                          selectedQuestion.id ?? '',
                                          (question) => ({
                                            ...question,
                                            options: (question.options ?? []).map((row) =>
                                              row.id === option.id
                                                ? { ...row, label: event.target.value }
                                                : row,
                                            ),
                                          }),
                                        )
                                      }
                                      fullWidth
                                    />
                                    <TextField
                                      label="Option value"
                                      value={option.value}
                                      onChange={(event) =>
                                        updateQuestion(
                                          selectedSection.id ?? '',
                                          selectedQuestion.id ?? '',
                                          (question) => ({
                                            ...question,
                                            options: (question.options ?? []).map((row) =>
                                              row.id === option.id
                                                ? { ...row, value: event.target.value }
                                                : row,
                                            ),
                                          }),
                                        )
                                      }
                                      fullWidth
                                    />
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleOptionRemove(
                                          selectedSection.id ?? '',
                                          selectedQuestion.id ?? '',
                                          option.id ?? '',
                                        )
                                      }
                                    >
                                      Remove option
                                    </Button>
                                  </Stack>
                                </Paper>
                              ))}
                            </Stack>
                            <Button
                              variant="outlined"
                              onClick={() =>
                                handleOptionAdd(selectedSection.id ?? '', selectedQuestion.id ?? '')
                              }
                            >
                              Add option
                            </Button>
                          </Stack>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  )
}
