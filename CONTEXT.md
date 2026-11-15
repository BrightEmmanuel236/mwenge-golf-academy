# Project context (read this first)

Mwenge Golf Academy: public website and staff area for a grassroots golf and youth-development academy in Uganda.
The full spec is `docs/PRD.md`. This file is the short, current picture. **Claude keeps it up to date after each
merged change**; AI Studio and anyone else should read it before starting work.

## Who does what

| Tool             | Job                                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude           | Plans each change, writes the AI Studio prompt, reviews every pull request before it merges, and does all database work (SQL, access rules, migrations) through its Supabase connector. |
| Google AI Studio | Builds frontend and feature code from Claude's prompt, on a branch. Never writes SQL.                                                                                                   |
| GitHub           | Single source of truth. Work arrives as pull requests into `main`. CI checks every one.                                                                                                 |
| Vercel           | Builds a preview for each pull request and deploys `main` to production.                                                                                                                |
| Lovable          | Passive mirror of GitHub (no credits left). Do not rely on it to build anything.                                                                                                        |

## The loop

1. Claude inspects the repo and database, then gives AI Studio one prompt (goal, allowed files, database facts, checks).
2. AI Studio builds on a branch named `ai/<short-name>` and opens a pull request into `main`. **Never push to `main`.**
3. CI runs (guard, type-check, tests, build) and Vercel builds a preview. The owner checks the preview and runs the build locally.
4. Claude reviews the diff, security and data handling, then the owner merges. Claude applies any database change and updates this file.

## Stack

TypeScript (strict), TanStack Start (Vite, file-based routes in `src/routes`), React, Tailwind with design tokens,
Supabase (Postgres, Auth, Row Level Security), Resend (email), Vercel (hosting). Package manager: **bun**
(`bun.lock`). Checks: `bunx tsc --noEmit`, `bun run test`, `bun run build`.

## Architecture rules

- The **browser** uses only the Supabase publishable key and the signed-in person's session; the database's Row
  Level Security decides what they can see. Nothing in the browser may hold the service key.
- **Server code** lives in `*.server.ts` files and `*.functions.ts` handlers (they load server modules inside the
  handler). Public forms are saved by `src/lib/submit.functions.ts` through database functions; emails are sent after
  a save by `src/lib/server/notify.server.ts`.
- **Staff area** `/admin`: password plus authenticator code (the database requires the second step), never indexed,
  its own frame (no public header/footer). Staff code reads and writes only through the person's own session.
- Content (programs, events, news) is in code (`src/lib/content`); sample content is hidden in production.
- Details: `AGENTS.md`, `docs/B1-SETUP.md`, `docs/B2-SETUP.md`, `docs/B3-SETUP.md`, `docs/LAUNCH-CHECKLIST.md`.

## Database (Supabase project `oqtefjnofyluwutkimpm`, Postgres)

Tables (all with Row Level Security): `user_roles`, `contact_person`, `enquiry`, `contact_message`, `sponsor_enquiry`,
`equipment_pledge`, `equipment_pledge_item`, `reference_counter`, `submission_throttle`, `email_log`, `audit_log`.
Roles: `super_admin`, `academy_admin`, `content_manager`, `safeguarding_lead`. Role helpers live in the `private`
schema. Public visitors reach no table directly; the server uses database functions (`submit_*`, `claim_email`,
`finish_email`, `list_emails_to_retry`, `get_submission_for_email`). `audit_log` is append-only. Safeguarding reports
are restricted to the Safeguarding Lead and Super Administrator. Child details are never put in email.
Applied migrations: `b1_public_forms`, `b2_email_and_safeguarding`, Lovable's B3-core (`20261106121130`), `b3_hardening`.
SQL sources and tests are in `supabase/drafts` and `supabase/tests` (changed by Claude only).

## Settings (names only; values live in Vercel/Supabase secrets, never in git)

Server: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `THROTTLE_PEPPER`, `FORMS_SAVING_ENABLED`, `RESEND_API_KEY`,
`EMAIL_FROM`, `STAFF_NOTIFY_EMAILS`, `SAFEGUARDING_EMAILS`, `ACADEMY_REPLY_TO`, `SAFEGUARDING_INTAKE_ENABLED`,
`CRON_SECRET`. Browser (public, set at build): `VITE_FORMS_MODE`. Production leaves the form-saving switches
**off** (the forms show "Preview only") until the launch checklist is done.

## Status

- Done: public site (F0-F3), B1 forms saved to the database, B2 email and retries, B3 staff sign-in and inbox.
  One super administrator exists and has signed in with two-step login.
- Not done: separate production database; the client's domain for email; privacy notice, contact details, a named
  Safeguarding Lead and real photos from the client; scheduled retries; donations; content editor; talent profiles.
- Not yet tested end to end on the real project: a form submission through to the admin inbox and email.

## Decisions to remember

Saving forms is off in production until staff are notified by email. A save is only reported when the database
confirms it. Safeguarding intake is off and has no screen until the client names the lead. Emails are built from
the saved record, never from what the visitor typed in a subject. New tables need explicit least-privilege grants:
Supabase grants new tables to the public roles by default.
