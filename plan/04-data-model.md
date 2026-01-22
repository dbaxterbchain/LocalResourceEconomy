# Data Model

## Core tables
- studies
- study_cohorts
- surveys
- survey_links
- survey_sections
- survey_questions
- survey_question_options
- responses
- response_items
- response_audit_log

## Key fields (draft)
- studies: id, name, host_name, description, created_at
- study_cohorts: id, study_id, name, status, starts_at, ends_at, notes, created_at
- surveys: id, study_id, name, status, contact_info_mode, contact_info_placement, is_template
- survey_links: id, survey_id, cohort_id, public_slug, status, opens_at, closes_at, created_at
- survey_sections: id, survey_id, title, sort_order
- survey_questions: id, section_id, type, label, helper_text, required, repeat_group_key, sort_order, config_json
- survey_question_options: id, question_id, value, label, sort_order
- responses: id, survey_id, cohort_id, survey_link_id, anon_token, started_at, submitted_at, contact_name, contact_email, contact_phone, business_name
- response_items: id, response_id, question_id, repeat_index, value_text, value_number, value_json
- response_audit_log: id, response_id, editor_id, edited_at, field_path, old_value, new_value, reason

## Cohorts and study runs
- A cohort represents a single run of a study (ex: Spring 2026 coffee shops).
- Surveys are reused across cohorts; responses are tagged with `cohort_id`.
- Cohort naming keeps future runs organized without duplicating survey definitions.
- The `studies` table supports multiple studies; UI can add a study picker later.

## Survey links (distribution instances)
- Each cohort can generate its own public survey link and QR code.
- Survey links can be opened or closed without changing the survey definition.
- Survey links provide a stable place to attach settings like open/close dates.
- Survey links must be tied to a cohort for organizational consistency.

## Defaults and constraints
- `study_cohorts.status` defaults to `draft`.
- `survey_links.status` defaults to `closed`.
- `survey_links.cohort_id` is required (no general links).
- `responses.cohort_id` and `responses.survey_link_id` are required.
- `survey_links.opens_at` and `survey_links.closes_at` are optional.

## Repeatable groups
- `repeat_group_key` groups a set of questions (ex: purchases, waste_streams).
- `repeat_index` ties response items to a specific group instance.

## Edit flow and audit log
- Research staff edits use an RPC function like `edit_response_item(id, new_value, reason)`.
- The function writes to `response_audit_log` and updates the item.
- Direct updates are blocked by RLS for non-admin roles.
- Audit log rows are append only (no update or delete).

## RLS summary
- Public anon can read survey definitions and survey links and insert responses.
- Public anon cannot read responses.
- Authenticated staff can read and edit responses and view audit logs.
