# Architecture

## Overview
React client hosted on Netlify connects directly to Supabase for data and auth. Public survey access uses an anon key with strict RLS.

## Frontend
- React + Vite + TypeScript.
- React Router for routing.
- TanStack Query for data fetching and caching.
- React Hook Form + Zod for form state and validation.
- QR rendering via `qrcode.react`.
- CSV export via `papaparse`.

## UI and design system
- Tailwind CSS for styling and tokens.
- shadcn/ui built on Radix UI for accessible components.
- Lucide icons.

## Backend (Supabase)
- Postgres for data storage.
- Auth for research team login (email + password or magic link).
- Storage for assets (logos, optional files).
- Edge Functions optional for invite emails or export bundling.

## Hosting (Netlify)
- Build from Vite.
- Environment variables for Supabase keys and site URLs.
- Preview deploys for branches.

## Security
- Public survey pages are read-only; response inserts allowed.
- Research staff can read and edit responses.
- Edits are done via RPC that requires a reason and writes to audit log.
- Direct updates to responses are blocked by RLS.

## QR
- QR code generated from the public survey link in the client.
- QR landing page shows study name, survey name, cohort label (if any), and host info.
- Each cohort gets its own survey link and QR to keep runs separated.

## Environments
- Separate Supabase projects for dev and prod.
- Netlify deploy contexts map to env vars.
