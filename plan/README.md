# Plan Index

Project: Survey Manager for "Coffee Shop Waste Systems"
Host: Circular Earth
Study scope: single study, multiple surveys

## Purpose
Build a simple survey manager so the research team can define, distribute, and analyze surveys for their study.

## Decisions
- Participants are anonymous; contact info can be optional or required.
- Contact info can be collected at the start or at the end.
- Distribution is via QR code and email.
- Stable internet is assumed (no offline mode).
- Units and quantities are mostly free text.
- Data ownership stays with the research group.
- Research staff can edit responses; edits require a reason and are audit logged.

## Stack
- Frontend: React + Vite + TypeScript
- UI: Tailwind CSS + shadcn/ui (Radix UI)
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions as needed)
- Hosting: Netlify

## Files
- plan/01-goals-scope.md
- plan/02-architecture.md
- plan/03-ux-and-survey-flow.md
- plan/04-data-model.md
- plan/05-resource-flow-survey.md
- plan/06-progress.md
- plan/07-wireframes.md
- plan/08-screen-list.md
- plan/09-supabase-schema-rls.md
- plan/10-supabase-migration.sql
- plan/11-data-access.md

## How to keep on track
- Update `plan/06-progress.md` after each work session.
- Record scope changes in `plan/01-goals-scope.md`.
- Record architecture changes in `plan/02-architecture.md`.
