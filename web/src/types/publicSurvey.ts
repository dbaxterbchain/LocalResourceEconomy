export type PublicSurveyBundle = {
  study: {
    id: string
    name: string
    host_name: string
    description: string | null
  }
  survey: {
    id: string
    name: string
    contact_info_mode: 'optional' | 'required'
    contact_info_placement: 'start' | 'end'
  }
  cohort: {
    id: string
    name: string
  }
  link: {
    id: string
    public_slug: string
    status: 'open' | 'closed'
    opens_at: string | null
    closes_at: string | null
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
    }> | null
    questions: Array<{
      id: string
      type: 'text' | 'number' | 'select' | 'multiselect' | 'longtext' | 'info'
      label: string
      helper_text: string | null
      required: boolean
      repeat_group_key: string | null
      group_id?: string | null
      sort_order: number
      config_json: Record<string, unknown>
      options: Array<{
        id: string
        value: string
        label: string
        sort_order: number
      }> | null
    }> | null
  }> | null
}
