import type { SupabaseClient } from '@supabase/supabase-js'

export type SurveyDefinition = {
  survey: {
    id: string
    study_id: string
    name: string
    status: string
    contact_info_mode: string
    contact_info_placement: string
    is_template: boolean
  }
  sections: Array<{
    id: string
    title: string
    sort_order: number
    repeat_groups: Array<{
      id: string
      name: string
      repeat_group_key: string
      min_items: number
      max_items: number
      sort_order: number
    }>
    questions: Array<{
      id: string
      type: string
      label: string
      helper_text: string | null
      required: boolean
      repeat_group_key: string | null
      group_id: string | null
      sort_order: number
      config_json: Record<string, unknown>
      options: Array<{
        id: string
        value: string
        label: string
        sort_order: number
      }>
    }>
  }>
}

export const fetchSurveyDefinition = async (
  supabase: SupabaseClient,
  surveyId: string,
): Promise<SurveyDefinition> => {
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('id, study_id, name, status, contact_info_mode, contact_info_placement, is_template')
    .eq('id', surveyId)
    .single()

  if (surveyError || !survey) {
    throw new Error(surveyError?.message ?? 'Survey not found')
  }

  const { data: sections, error: sectionsError } = await supabase
    .from('survey_sections')
    .select('id, title, sort_order')
    .eq('survey_id', surveyId)
    .order('sort_order', { ascending: true })

  if (sectionsError) {
    throw new Error(sectionsError.message)
  }

  const sectionIds = (sections ?? []).map((section) => section.id)
  const { data: repeatGroups, error: repeatGroupsError } =
    sectionIds.length > 0
      ? await supabase
          .from('survey_repeat_groups')
          .select('id, section_id, name, repeat_group_key, min_items, max_items, sort_order')
          .in('section_id', sectionIds)
          .order('sort_order', { ascending: true })
      : { data: [], error: null }

  if (repeatGroupsError) {
    throw new Error(repeatGroupsError.message)
  }

  const { data: questions, error: questionsError } =
    sectionIds.length > 0
      ? await supabase
          .from('survey_questions')
          .select(
            'id, section_id, type, label, helper_text, required, repeat_group_key, group_id, sort_order, config_json',
          )
          .in('section_id', sectionIds)
          .order('sort_order', { ascending: true })
      : { data: [], error: null }

  if (questionsError) {
    throw new Error(questionsError.message)
  }

  const questionIds = (questions ?? []).map((question) => question.id)
  const { data: options, error: optionsError } =
    questionIds.length > 0
      ? await supabase
          .from('survey_question_options')
          .select('id, question_id, value, label, sort_order')
          .in('question_id', questionIds)
          .order('sort_order', { ascending: true })
      : { data: [], error: null }

  if (optionsError) {
    throw new Error(optionsError.message)
  }

  const optionsByQuestion = new Map<string, SurveyDefinition['sections'][number]['questions'][number]['options']>()
  for (const option of options ?? []) {
    if (!optionsByQuestion.has(option.question_id)) {
      optionsByQuestion.set(option.question_id, [])
    }
    optionsByQuestion.get(option.question_id)?.push({
      id: option.id,
      value: option.value,
      label: option.label,
      sort_order: option.sort_order,
    })
  }

  const repeatGroupsBySection = new Map<string, SurveyDefinition['sections'][number]['repeat_groups']>()
  for (const group of repeatGroups ?? []) {
    if (!repeatGroupsBySection.has(group.section_id)) {
      repeatGroupsBySection.set(group.section_id, [])
    }
    repeatGroupsBySection.get(group.section_id)?.push({
      id: group.id,
      name: group.name,
      repeat_group_key: group.repeat_group_key,
      min_items: group.min_items,
      max_items: group.max_items,
      sort_order: group.sort_order,
    })
  }

  const questionsBySection = new Map<string, SurveyDefinition['sections'][number]['questions']>()
  for (const question of questions ?? []) {
    if (!questionsBySection.has(question.section_id)) {
      questionsBySection.set(question.section_id, [])
    }
    questionsBySection.get(question.section_id)?.push({
      id: question.id,
      type: question.type,
      label: question.label,
      helper_text: question.helper_text,
      required: question.required,
      repeat_group_key: question.repeat_group_key,
      group_id: question.group_id,
      sort_order: question.sort_order,
      config_json: question.config_json ?? {},
      options: optionsByQuestion.get(question.id) ?? [],
    })
  }

  const sectionRows = (sections ?? []).map((section) => ({
    id: section.id,
    title: section.title,
    sort_order: section.sort_order,
    repeat_groups: repeatGroupsBySection.get(section.id) ?? [],
    questions: questionsBySection.get(section.id) ?? [],
  }))

  return {
    survey: {
      id: survey.id,
      study_id: survey.study_id,
      name: survey.name,
      status: survey.status,
      contact_info_mode: survey.contact_info_mode,
      contact_info_placement: survey.contact_info_placement,
      is_template: survey.is_template,
    },
    sections: sectionRows,
  }
}

export const insertSurveyStructure = async (
  supabase: SupabaseClient,
  surveyId: string,
  sections: SurveyDefinition['sections'],
) => {
  for (const section of sections) {
    const { data: newSection, error: sectionError } = await supabase
      .from('survey_sections')
      .insert({
        survey_id: surveyId,
        title: section.title,
        sort_order: section.sort_order,
      })
      .select('id')
      .single()

    if (sectionError || !newSection) {
      throw new Error(sectionError?.message ?? 'Failed to create section')
    }

    const groupKeyMap = new Map<string, string>()
    const groupIdMap = new Map<string, string>()

    for (const group of section.repeat_groups ?? []) {
      const { data: newGroup, error: groupError } = await supabase
        .from('survey_repeat_groups')
        .insert({
          section_id: newSection.id,
          name: group.name,
          repeat_group_key: group.repeat_group_key,
          min_items: group.min_items ?? 1,
          max_items: group.max_items ?? 10,
          sort_order: group.sort_order ?? 0,
        })
        .select('id')
        .single()

      if (groupError || !newGroup) {
        throw new Error(groupError?.message ?? 'Failed to create repeat group')
      }

      if (group.repeat_group_key) {
        groupKeyMap.set(group.repeat_group_key, newGroup.id)
      }
      if (group.id) {
        groupIdMap.set(group.id, newGroup.id)
      }
    }

    for (const question of section.questions ?? []) {
      let repeatGroupKey = question.repeat_group_key ?? null
      if (!repeatGroupKey && question.group_id && section.repeat_groups) {
        const sourceGroup = section.repeat_groups.find((group) => group.id === question.group_id)
        repeatGroupKey = sourceGroup?.repeat_group_key ?? null
      }

      const mappedGroupId =
        (question.group_id ? groupIdMap.get(question.group_id) : undefined) ??
        (repeatGroupKey ? groupKeyMap.get(repeatGroupKey) : undefined) ??
        null

      const { data: newQuestion, error: questionError } = await supabase
        .from('survey_questions')
        .insert({
          section_id: newSection.id,
          type: question.type,
          label: question.label,
          helper_text: question.helper_text,
          required: question.required,
          repeat_group_key: repeatGroupKey,
          group_id: mappedGroupId,
          sort_order: question.sort_order,
          config_json: question.config_json ?? {},
        })
        .select('id')
        .single()

      if (questionError || !newQuestion) {
        throw new Error(questionError?.message ?? 'Failed to create question')
      }

      if (question.options && question.options.length > 0) {
        const optionRows = question.options.map((option) => ({
          question_id: newQuestion.id,
          value: option.value,
          label: option.label,
          sort_order: option.sort_order,
        }))

        const { error: optionsInsertError } = await supabase
          .from('survey_question_options')
          .insert(optionRows)

        if (optionsInsertError) {
          throw new Error(optionsInsertError.message)
        }
      }
    }
  }
}
