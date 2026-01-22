# Screen List (Routes + States)

## Public participant routes

### `/:surveySlug`
**Purpose:** Landing + consent for a survey link tied to a cohort.  
**States:**
- Loading (fetch survey link, study, cohort).
- Ready (show study name, survey name, host, cohort label).
- Invalid/closed (link not found or status closed).
- Error (network).

### `/:surveySlug/start`
**Purpose:** Optional contact info at start (if configured).  
**States:**
- Required contact info.
- Optional contact info (skip allowed).
- Validation errors (missing required fields).

### `/:surveySlug/section/:sectionId/intro`
**Purpose:** Section intro and expectations (repeatable groups).  
**States:**
- Show section summary and max items.
- Continue button to first question.

### `/:surveySlug/section/:sectionId/item/:repeatIndex/question/:questionId`
**Purpose:** One question per screen (conversational).  
**States:**
- Text input (short).
- Long text input.
- Select (single).
- Multiselect (with "Other" text if selected).
- Validation errors (required).
- Loading (saving draft).

### `/:surveySlug/section/:sectionId/items`
**Purpose:** Repeat group list (add/remove items).  
**States:**
- List of items (summary line).
- Add item (disabled when at max).
- Remove item confirmation.

### `/:surveySlug/review`
**Purpose:** Global review before submit.  
**States:**
- Ready (summary of sections).
- Edit jump to section.
- Submit loading/success/error.

### `/:surveySlug/contact`
**Purpose:** Optional contact info at end (if configured).  
**States:**
- Required contact info.
- Optional contact info.
- Validation errors.

### `/:surveySlug/thank-you`
**Purpose:** Completion confirmation.  
**States:**
- Show confirmation message.

## Research team routes

### `/login`
**Purpose:** Staff auth.  
**States:**
- Email + password.
- Magic link (optional).
- Error (invalid creds).

### `/app`
**Purpose:** Study hub.  
**States:**
- Survey list.
- Cohort list.
- Empty state (no surveys/cohorts).

### Future: `/app/studies`
**Purpose:** Study list and study picker.  
**States:**
- Multiple studies list.
- Create new study.

### Future: `/app/studies/new`
**Purpose:** Create a new study.  
**States:**
- Draft (unsaved).
- Validation errors.

### `/app/surveys/new`
**Purpose:** Create survey.  
**States:**
- Draft (unsaved).
- Validation errors.
- Create from template.
- Import from JSON.

### `/app/surveys/:surveyId`
**Purpose:** Survey builder (sections + questions).  
**States:**
- Draft.
- Live (read-only for structure).
- Archived/closed.
- Template actions (mark as template, export JSON).

### `/app/cohorts/new`
**Purpose:** Create cohort (study run).  
**States:**
- Draft default.
- Validation errors.

### `/app/cohorts/:cohortId`
**Purpose:** Cohort detail + link management.  
**States:**
- Link closed (default).
- Link open.
- Open/close confirmation.

### `/app/cohorts/:cohortId/surveys/:surveyId/link`
**Purpose:** Distribution for a cohort + survey.  
**States:**
- Show link + QR.
- Copy link success.
- Print QR.

### `/app/responses`
**Purpose:** Response list.  
**States:**
- Filters (study, survey, cohort, date, status).
- Search (contact info + answer text).
- CSV export.
- Empty state.

### `/app/responses/:responseId`
**Purpose:** Response detail + audit log.  
**States:**
- View mode.
- Edit mode (requires reason).
- Audit log loaded/empty.

### `/app/exports`
**Purpose:** Export data.  
**States:**
- Export options (CSV/JSON).
- Job running/success/error (if async).
