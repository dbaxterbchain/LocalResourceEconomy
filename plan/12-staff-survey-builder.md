# Staff Survey Builder Scope (V1)

## Goals
- Let staff create and edit surveys for a study without touching SQL.
- Keep structure simple: sections, questions, options, repeat groups.
- Save draft structure for use in cohorts and links.
- Support per-study survey templates and reuse across cohorts.
- Allow JSON export/import for moving surveys between studies.

## Non-goals (V1)
- No survey versioning or publish workflow.
- No per-question branching logic.
- No bulk import/export of multiple surveys at once.
- No survey marketplace.

## Survey templates (V1)
A template is a saved survey structure (sections + questions + options) stored within a study and
reused across cohorts. Intended use:
- Speed up common study types or recurring surveys.
- Preserve standard question wording across cohorts.
- Share a baseline survey with lightweight edits per study.

Template handling (V1):
- Mark a survey as a template within its study.
- "Create from template" duplicates structure into a new survey draft.
- Export survey JSON and import into another study.

## Future marketplace
- Allow sharing templates across organizations.
- Curate common study templates and rating/metadata.

## Data model (existing tables)
- `studies`
- `surveys`
- `survey_sections`
- `survey_questions`
- `survey_question_options`

## Required fields
- Survey: name, contact_info_mode, contact_info_placement
- Section: title, sort_order
- Question: type, label, required, sort_order (group_id optional; repeat_group_key derived)
- Option (select/multiselect): label, value, sort_order

## Repeat groups
- Defined per section as first-class group records.
- Each group has its own repeat_group_key, min_items, max_items.
- Multiple groups can exist in a single section.
- Blocks can be ungrouped (shown once per section) even when groups exist.

## Screen structure

### `/app/surveys/new`
- Form: name, contact info mode (optional/required), placement (start/end)
- Action: create survey (draft)

### `/app/surveys/:surveyId`
Two-panel builder:
- Left: section list with add, reorder, delete
- Right: section editor + question list

Section editor:
- Title
- Repeat group key (optional)

Block list:
- Add block button
- Each block row: label, type, required, reorder
- Edit drawer/modal for details

Block editor fields:
- Type (text, number, longtext, select, multiselect, info)
- Label
- Helper text or block content
- Required toggle (question types only)
- Repeat group key (until repeat-group blocks land)
- Options editor (for select/multiselect)
- Allow other detail (config flag)

Info blocks:
- Add an `info` type for non-response content (consent, instructions).
- Stored alongside questions but skipped during submission.

Repeat group blocks (V1)
- Create a repeat-group block inside a section with:
  - name (display)
  - repeat_group_key (internal id)
  - min_items, max_items
  - sort_order (position in section)
- Blocks belong to a group via `group_id`, or sit at top level (no group).
- UI shows groups as collapsible blocks; questions can be moved into/out of a group.

Schema changes (V1):
- New table `survey_repeat_groups` (id, section_id, name, repeat_group_key, min_items, max_items, sort_order).
- Add `group_id` (nullable) to `survey_questions`.
- Section ordering: groups and ungrouped blocks each have `sort_order`; questions inside a group use their own sort_order.

Public flow impact:
- Grouped questions repeat together by group settings.
- Ungrouped blocks remain single-run within the section.

## Draft saving
- Manual "Save" button
- Inline field edits update local state; save writes to Supabase
- Export: download survey JSON
- Import: paste/upload JSON to create a new survey

## JSON export/import format (V1)
Export endpoint:
- `/.netlify/functions/staffSurveyExport?survey_id=...`

Import endpoint:
- `/.netlify/functions/staffSurveyImport` (POST `{ "study_id": "...", "definition": { ... } }`)

Definition shape:
```
{
  "survey": {
    "name": "Resource Flow Collection Sheet",
    "contact_info_mode": "optional",
    "contact_info_placement": "end",
    "is_template": false
  },
  "sections": [
    {
      "title": "Intro and consent",
      "sort_order": 1,
      "questions": [
        {
          "type": "text",
          "label": "Material or good",
          "helper_text": "What are you purchasing?",
          "required": true,
          "repeat_group_key": "purchases",
          "sort_order": 1,
          "config_json": {},
          "options": [
            { "value": "daily", "label": "Daily", "sort_order": 1 }
          ]
        }
      ]
    }
  ]
}
```

Notes:
- Export includes ids for reference; import ignores ids.
- Import always creates a new survey in the target study with status `draft`.

## Validation rules
- Must have at least 1 section and 1 block before use in cohorts.
- Select/multiselect require at least 1 option.
- Ungrouped blocks are allowed even when repeat groups exist.

## Future data collection modules
- Matrix/grid questions (rows x columns).
- Numeric with units and unit picker.
- Ranking and priority ordering.
- Ratings (Likert scale).
- Date/time inputs and scheduling.
- Photo/file uploads (receipt, bin photo, invoice).
- Location capture (address or map pin).
- Inventory list builder (typed list with quantities).

## Staff flow
1. Create survey draft
2. Add sections
3. Add questions per section
4. Save
5. Use survey in cohort link

## Open questions
- Templates: in V1 (per-study). Marketplace later.
- Repeat groups: set per repeatable section (group name + max items). Use separate sections
  when multiple repeat groups are needed.
