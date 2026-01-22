# Response Explorer + CSV Export (V1)

## Goals
- Let staff find responses quickly (by survey, cohort, date).
- Provide a CSV export for analysis.
- Offer a simple search across contact info and answer text.

## Non-goals (V1)
- Advanced analytics or charts.
- Per-question computed metrics.
- Background export jobs.

## UX

### `/app/responses`
- Filters: study, survey, cohort, date range, status (draft/submitted)
- Search: name, email, business, answer text
- Table: submitted date, contact, cohort, status
- Actions: view response, export CSV

### `/app/responses/:responseId`
- Existing detail view + audit log
- Add "Download CSV for this response" (optional)

## CSV export format
Start with a "long" format (one row per answer).

Columns:
- response_id
- submitted_at
- survey_id
- cohort_id
- contact_name
- contact_email
- contact_phone
- business_name
- question_id
- question_label
- question_type
- repeat_index
- value_text
- value_number
- value_json

This format is stable and works with repeat groups.

## Data access
- Use existing staff functions for response list + detail.
- Add Netlify function `staffResponsesExport`:
  - Inputs: survey_id or slug, cohort_id (optional), date range
  - Output: CSV text

## Search behavior
V1 uses server-side filters:
- Text search across all contact fields plus answer values (value_text or value_json)
- Include business name and question label text in matching
- Use an RPC or SQL on the Netlify function to keep UI fast

## Next steps
- Default filters: all studies/cohorts unless slug provided
- CSV export shipped via `staffResponsesExport`
- Search + export controls added to `/app/responses`

## Implementation notes (V1)
- Responses filter in `/.netlify/functions/staffResponses` with study/survey/cohort/date/status/search.
- CSV export in `/.netlify/functions/staffResponsesExport` (long format, one row per answer).
- Search matches contact fields, question labels, and answer text (value_text/value_number/value_json).
