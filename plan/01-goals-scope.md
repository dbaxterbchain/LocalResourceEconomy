# Goals and Scope (MVP)

## Goals
- Provide a simple survey host for a single study with multiple surveys.
- Keep the architecture ready for multiple studies in the future.
- Collect Resource Flow Collection data with high completion rates.
- Make it easy for research staff to define, publish, and export surveys.
- Enable per-study survey templates with JSON export/import for reuse.
- Maintain an immutable audit trail for staff edits.

## Constraints and decisions
- Distribution: QR and email.
- Connectivity: stable internet.
- Units: mostly free text.
- Data ownership: research group.
- Participants: anonymous; contact info optional or required; collected at start or end.
- All responses must be tied to a cohort.

## MVP features
- Study hub with name, host info, and survey list.
- Survey builder with sections, questions, and repeatable groups.
- Survey templates within a study, plus JSON export/import.
- Survey settings: status (draft/live/closed), contact info options.
- Participant flow: mobile first, guided, one question per step.
- Response management: filters, view, CSV and JSON export.
- Audit log: append only; edit reason required.

## Out of scope (MVP)
- Offline mode.
- Advanced analytics dashboards.
- Payments or incentive tracking.
- Multi-study management UI (create/switch studies).
- Survey marketplace.

## Assumptions
- Research staff have accounts; participants do not.
- Study host and survey names are stable for the pilot.
