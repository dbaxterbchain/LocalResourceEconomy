# Progress

Last updated: 2026-01-20

## Current status
- Phase: implementation
- Next milestone: Pilot with Coffee Shop Waste Systems study

## Milestones
- [x] Capture requirements and constraints
- [x] Decide stack and architecture
- [x] Draft survey schema
- [x] Draft wireframes
- [x] Implement participant flow (public UI + submission)
- [x] Implement survey builder (staff)
- [ ] Pilot with Coffee Shop Waste Systems study
- [x] Implement response explorer + CSV export

## Work log
- 2026-01-18: Documented plan, architecture, data model, and initial survey schema.
- 2026-01-18: Added cohort and survey link modeling and drafted wireframes.
- 2026-01-18: Confirmed survey schema decisions and aligned wireframes to full resource and waste details.
- 2026-01-18: Defined cohort defaults and required cohort-linked survey links.
- 2026-01-18: Refined wireframes with section intro, disposal detail, and edit reason flow.
- 2026-01-18: Added detailed screen list with routes and states.
- 2026-01-18: Noted multi-study readiness and future study management screens.
- 2026-01-18: Drafted Supabase schema, RLS, and audit log RPC.
- 2026-01-18: Tightened public read policies, added contact edit RPC, and wrote migration SQL.
- 2026-01-18: Added Supabase migration file and seed data for the demo study.
- 2026-01-18: Updated seed slug and added "Other" detail config flags.
- 2026-01-18: Added staff preview RPC, made public bundle open-only, and fixed seed enum casts.
- 2026-01-18: Added typed public survey bundle function and type.
- 2026-01-18: Added data access doc with SQL and RPC examples.
- 2026-01-18: Scaffolded React app, added routes, and implemented public survey fetch flow.
- 2026-01-18: Added Netlify function for staff bundle access with secret key and admin token guard.
- 2026-01-18: Allowed Authorization header and dev-only token query param for staff bundle function.
- 2026-01-18: Added dev diagnostics to staff bundle function auth.
- 2026-01-18: Added token length diagnostics for staff function auth debugging.
- 2026-01-18: Expanded dev-mode detection using host/client IP to surface debug payloads.
- 2026-01-18: Added query string parsing fallback for Netlify function auth.
- 2026-01-18: Allowed service role tokens to access staff survey bundle.
- 2026-01-18: Added staff preview page and removed debug payload from function responses.
- 2026-01-18: Implemented public survey flow pages, session storage, and submission to Supabase.
- 2026-01-18: Fixed hook order issues in public question and review pages.
- 2026-01-18: Added ESLint setup and built staff responses list/detail with Netlify functions.
- 2026-01-19: Upgraded public and staff UI to MUI, added mobile-first layouts, and improved repeat-item summaries.
- 2026-01-19: Added section stepper completion states, review step, and vertical mode on mobile.
- 2026-01-19: Added enter-to-continue on question, section intro, and review screens.
- 2026-01-19: Fixed public submission RLS by adding helper functions and client-generated response IDs.
- 2026-01-19: Ran lint/build; updated ESLint config for modern JSX runtime.
- 2026-01-19: Drafted staff survey builder scope and response explorer/export plan.
- 2026-01-19: Expanded V1 scope to include per-study survey templates and JSON import/export.
- 2026-01-19: Added surveys.is_template flag migration and updated schema docs.
- 2026-01-19: Added staff survey builder shell wiring, templates list, and JSON import/export scaffolding.
- 2026-01-20: Wired staff survey create/import/export endpoints and updated builder UI for templates.
- 2026-01-20: Added survey builder structure editor, JSON save endpoint, and template seed toggle.
- 2026-01-20: Added info blocks, section/question editor updates, and save label clarity.
- 2026-01-20: Renamed builder UI to blocks and drafted repeat-group block design.
- 2026-01-20: Implemented repeat group schema/builder support and wired public flow to group limits.
- 2026-01-20: Finalized staff survey builder (blocks, templates, JSON import/export, group-aware UI).
- 2026-01-20: Added staff surveys/cohorts management screens with cohort link + QR sharing.
- 2026-01-20: Implemented response explorer filters, search, and CSV export endpoint.

## Risks and notes
- Free text units reduce standardization; plan a normalization step later.
- Audit log enforcement should be done in the database to avoid bypass.
